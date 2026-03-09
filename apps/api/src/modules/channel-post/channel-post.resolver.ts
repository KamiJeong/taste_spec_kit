import { Args, Context, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../shared/guards/auth.guard";
import { requestAuthOf } from "../shared/request-auth";
import { validateWithZod } from "../shared/zod-validation";
import { auditContextFromReq } from "../graphql/common/graphql-audit";
import { ensureCsrfForMutation } from "../graphql/common/graphql-csrf";
import { type GraphqlContext } from "../graphql/common/graphql-context";
import { type ServiceResponse, toGraphqlError } from "../graphql/common/graphql-response";
import { createChannelPostSchema, listChannelPostsQuerySchema } from "./channel-post.schemas";
import { ChannelPostConnection, CreateChannelPostResult } from "./graphql/channel-post.types";
import { ChannelPostService } from "./channel-post.service";

@Resolver()
@UseGuards(AuthGuard)
export class ChannelPostResolver {
  constructor(private readonly posts: ChannelPostService) {}

  @Query(() => ChannelPostConnection, { name: "channelPosts" })
  async channelPosts(
    @Args("channelId") channelId: string,
    @Args("limit", { type: () => Int, defaultValue: 20 }) limit: number,
    @Args("cursor", { type: () => String, nullable: true }) cursor: string | undefined,
    @Context() context: GraphqlContext
  ): Promise<ChannelPostConnection> {
    const validated = validateWithZod(listChannelPostsQuerySchema, { limit, cursor });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>, context.req);
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
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
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
    ensureCsrfForMutation(context.req);

    const validated = validateWithZod(createChannelPostSchema, { title, content });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>, context.req);
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
      auditContextFromReq(context.req)
    );
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
    }

    return {
      post: result.body.data.post
    };
  }
}
