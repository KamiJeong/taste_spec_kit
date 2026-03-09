import { GraphQLError } from "graphql";

export interface ServiceResponse<T> {
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

export function toGraphqlError(response: ServiceResponse<unknown>): GraphQLError {
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
