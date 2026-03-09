import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";
import { requestAuthOf } from "../shared/request-auth";
import { AuthGuard } from "../shared/guards/auth.guard";
import { type GraphqlContext } from "../graphql/common/graphql-context";
import { type ServiceResponse, toGraphqlError } from "../graphql/common/graphql-response";
import { AuthService } from "./auth.service";
import { AuthMeResult } from "./graphql/auth.types";

@Resolver()
@UseGuards(AuthGuard)
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Query(() => AuthMeResult, { name: "me" })
  async me(@Context() context: GraphqlContext): Promise<AuthMeResult> {
    const auth = requestAuthOf(context.req);
    const result = await this.auth.me({ sid: auth.sid, userId: auth.userId });
    if (!result.body.success) {
      throw toGraphqlError(result as ServiceResponse<unknown>, context.req);
    }
    return {
      user: result.body.data.user
    };
  }
}
