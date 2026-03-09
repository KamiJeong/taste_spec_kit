import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";
import { type GraphqlContext } from "../graphql/common/graphql-context";
import { type ServiceResponse, toGraphqlError } from "../graphql/common/graphql-response";
import { AuthGuard } from "../shared/guards/auth.guard";
import { requestAuthOf } from "../shared/request-auth";
import { UserProfileResult } from "./graphql/user.types";
import { UserService } from "./user.service";

@Resolver()
@UseGuards(AuthGuard)
export class UserResolver {
  constructor(private readonly user: UserService) {}

  @Query(() => UserProfileResult, { name: "myProfile" })
  async myProfile(@Context() context: GraphqlContext): Promise<UserProfileResult> {
    const auth = requestAuthOf(context.req);
    const result = await this.user.getProfile({ sid: auth.sid });
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
    }
    return {
      profile: result.body.data.profile
    };
  }
}
