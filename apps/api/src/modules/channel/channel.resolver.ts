import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../shared/guards/auth.guard";
import { requestAuthOf } from "../shared/request-auth";
import { validateWithZod } from "../shared/zod-validation";
import { auditContextFromReq } from "../graphql/common/graphql-audit";
import { ensureCsrfForMutation } from "../graphql/common/graphql-csrf";
import { type GraphqlContext } from "../graphql/common/graphql-context";
import { type ServiceResponse, toGraphqlError } from "../graphql/common/graphql-response";
import { createChannelSchema } from "./channel.schemas";
import { ChannelService } from "./channel.service";
import { ChannelListResult, CreateChannelResult } from "./graphql/channel.types";

@Resolver()
@UseGuards(AuthGuard)
export class ChannelResolver {
  constructor(private readonly channels: ChannelService) {}

  @Query(() => ChannelListResult, { name: "myChannels" })
  async myChannels(@Context() context: GraphqlContext): Promise<ChannelListResult> {
    const auth = requestAuthOf(context.req);
    const result = await this.channels.listMyChannels({ sid: auth.sid, userId: auth.userId });
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
    }
    return { channels: result.body.data.channels };
  }

  @Mutation(() => CreateChannelResult, { name: "createChannel" })
  async createChannel(@Args("name") name: string, @Context() context: GraphqlContext): Promise<CreateChannelResult> {
    ensureCsrfForMutation(context.req);
    const validated = validateWithZod(createChannelSchema, { name });
    if (!validated.ok) {
      throw toGraphqlError(validated.response as ServiceResponse<unknown>, context.req);
    }

    const auth = requestAuthOf(context.req);
    const result = await this.channels.createChannel(
      { sid: auth.sid, userId: auth.userId, name: validated.data.name },
      auditContextFromReq(context.req)
    );
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
    }

    return {
      id: result.body.data.channel.id,
      name: result.body.data.channel.name,
      role: result.body.data.channel.role
    };
  }
}
