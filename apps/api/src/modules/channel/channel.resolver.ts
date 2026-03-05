import { Args, Context, Field, Int, Mutation, ObjectType, Query, Resolver } from "@nestjs/graphql";
import { GraphQLError } from "graphql";
import { ERROR_CODES } from "@packages/contracts-auth";
import type { Request } from "express";
import { cookieOf } from "../shared/request-cookie";
import { TokenService } from "../token/token.service";
import { validateWithZod } from "../shared/zod-validation";
import { createChannelSchema } from "./channel.schemas";
import { ChannelService } from "./channel.service";

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
class ChannelNode {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  ownerUserId!: string;

  @Field()
  role!: string;

  @Field(() => Int, { nullable: true })
  sortIndex!: number | null;

  @Field(() => ChannelUserNode, { nullable: true })
  creator!: ChannelUserNode | null;

  @Field(() => [ChannelMemberNode])
  users!: ChannelMemberNode[];
}

@ObjectType()
class ChannelUserNode {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field()
  emailVerified!: boolean;
}

@ObjectType()
class ChannelMemberNode {
  @Field(() => ChannelUserNode)
  user!: ChannelUserNode;

  @Field()
  role!: string;

  @Field()
  joinedAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
class ChannelListResult {
  @Field(() => [ChannelNode])
  channels!: ChannelNode[];
}

@ObjectType()
class CreateChannelResult {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  role!: string;
}

@Resolver()
export class ChannelResolver {
  constructor(
    private readonly channels: ChannelService,
    private readonly tokens: TokenService
  ) {}

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (typeof header !== "string") return null;
    const [scheme, value] = header.trim().split(/\s+/, 2);
    if (scheme?.toLowerCase() !== "bearer" || !value) return null;
    return value;
  }

  private resolveAuth(req: Request): { sid?: string; userId?: string } {
    const sidFromCookie = cookieOf(req, "sid");
    if (sidFromCookie) return { sid: sidFromCookie };
    const bearer = this.extractBearerToken(req);
    if (!bearer) return {};
    const verified = this.tokens.verifyAccessToken(bearer);
    if (!verified) return {};
    return { userId: verified.userId };
  }

  private ensureCsrfForMutation(req: Request): void {
    const sid = cookieOf(req, "sid");
    if (!sid) return;
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

  @Query(() => ChannelListResult, { name: "myChannels" })
  async myChannels(@Context() context: GraphqlContext): Promise<ChannelListResult> {
    const auth = this.resolveAuth(context.req);
    const result = await this.channels.listMyChannels({ sid: auth.sid, userId: auth.userId });
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>);
    }
    return { channels: result.body.data.channels };
  }

  @Mutation(() => CreateChannelResult, { name: "createChannel" })
  async createChannel(@Args("name") name: string, @Context() context: GraphqlContext): Promise<CreateChannelResult> {
    this.ensureCsrfForMutation(context.req);
    const validated = validateWithZod(createChannelSchema, { name });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>);
    }

    const auth = this.resolveAuth(context.req);
    const result = await this.channels.createChannel({ sid: auth.sid, userId: auth.userId, name: validated.data.name }, this.toAuditContext(context.req));
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>);
    }

    return {
      id: result.body.data.channel.id,
      name: result.body.data.channel.name,
      role: result.body.data.channel.role
    };
  }
}
