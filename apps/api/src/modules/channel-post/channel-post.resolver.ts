import { Args, Context, Field, Int, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { GraphQLError } from "graphql";
import type { Request } from "express";
import { ERROR_CODES } from "@packages/contracts-auth";
import { cookieOf } from "../shared/request-cookie";
import { AuthGuard } from "../shared/guards/auth.guard";
import { requestAuthOf } from "../shared/request-auth";
import { validateWithZod } from "../shared/zod-validation";
import { createChannelPostSchema, listChannelPostsQuerySchema } from "./channel-post.schemas";
import { ChannelPostService } from "./channel-post.service";

interface GraphqlContext {
  req: Request;
}

interface ServiceResponse<T> {
  status: number;
  body:
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        code: string;
        message: string;
        details: unknown;
      };
}

function toGraphqlError(response: ServiceResponse<unknown>): GraphQLError {
  if (response.body.success) {
    return new GraphQLError("Unknown GraphQL conversion error");
  }
  return new GraphQLError(response.body.message, {
    extensions: {
      code: response.body.code,
      httpStatus: response.status,
      details: response.body.details
    }
  });
}

@ObjectType()
class ChannelPostNode {
  @Field()
  id!: string;

  @Field()
  channelId!: string;

  @Field()
  authorUserId!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
class ChannelPostConnection {
  @Field(() => [ChannelPostNode])
  items!: ChannelPostNode[];

  @Field(() => String, { nullable: true })
  nextCursor!: string | null;
}

@ObjectType()
class CreateChannelPostResult {
  @Field(() => ChannelPostNode)
  post!: ChannelPostNode;
}

@Resolver()
@UseGuards(AuthGuard)
export class ChannelPostResolver {
  constructor(private readonly posts: ChannelPostService) {}

  private ensureCsrfForMutation(req: Request): void {
    const csrfCookie = cookieOf(req, "csrfToken");
    const csrfHeader = req.headers["x-csrf-token"];
    const valid =
      typeof csrfCookie === "string" &&
      typeof csrfHeader === "string" &&
      csrfCookie.length > 0 &&
      csrfHeader === csrfCookie;
    if (!valid) {
      throw new GraphQLError("CSRF 검증에 실패했습니다", {
        extensions: {
          code: ERROR_CODES.AUTH_CSRF_INVALID,
          httpStatus: 403
        }
      });
    }
  }

  private toAuditContext(req: Request): { ip: string; userAgent: string } {
    return {
      ip: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown"
    };
  }

  @Query(() => ChannelPostConnection, { name: "channelPosts" })
  async channelPosts(
    @Args("channelId") channelId: string,
    @Args("limit", { type: () => Int, defaultValue: 20 }) limit: number,
    @Args("cursor", { type: () => String, nullable: true }) cursor: string | undefined,
    @Context() context: GraphqlContext
  ): Promise<ChannelPostConnection> {
    const validated = validateWithZod(listChannelPostsQuerySchema, { limit, cursor });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>);
    }

    const auth = requestAuthOf(context.req);
    const result = await this.posts.listPosts({
      sid: auth.sid,
      userId: auth.userId,
      channelId,
      limit: validated.data.limit,
      cursor: validated.data.cursor
    });
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>);
    }

    return {
      items: result.body.data.items,
      nextCursor: result.body.data.nextCursor
    };
  }

  @Mutation(() => CreateChannelPostResult, { name: "createChannelPost" })
  async createChannelPost(
    @Args("channelId") channelId: string,
    @Args("title") title: string,
    @Args("content") content: string,
    @Context() context: GraphqlContext
  ): Promise<CreateChannelPostResult> {
    this.ensureCsrfForMutation(context.req);

    const validated = validateWithZod(createChannelPostSchema, { title, content });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>);
    }

    const auth = requestAuthOf(context.req);
    const result = await this.posts.createPost(
      {
        sid: auth.sid,
        userId: auth.userId,
        channelId,
        title: validated.data.title,
        content: validated.data.content
      },
      this.toAuditContext(context.req)
    );
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>);
    }

    return {
      post: result.body.data.post
    };
  }
}
