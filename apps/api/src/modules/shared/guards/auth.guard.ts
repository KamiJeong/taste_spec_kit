import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ERROR_CODES } from "@packages/contracts-auth";
import type { Request, Response } from "express";
import { GraphQLError } from "graphql";
import { TokenService } from "../../token/token.service";
import { failure } from "../http-contract";
import { setRequestAuth } from "../request-auth";

type GraphqlRequestContext = {
  req: Request;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = this.getRequest(context);
    if (!request) {
      this.reject(context);
      return false;
    }

    const bearerToken = this.extractBearerToken(request);
    if (!bearerToken) {
      this.reject(context);
      return false;
    }

    const verified = this.tokens.verifyAccessToken(bearerToken);
    if (!verified) {
      this.reject(context);
      return false;
    }

    setRequestAuth(request, { sid: verified.sid });
    return true;
  }

  private getRequest(context: ExecutionContext): Request | null {
    if (context.getType<string>() === "graphql") {
      const gql = GqlExecutionContext.create(context);
      return gql.getContext<GraphqlRequestContext>()?.req ?? null;
    }
    return context.switchToHttp().getRequest<Request>();
  }

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (typeof header !== "string") return null;
    const [scheme, value] = header.trim().split(/\s+/, 2);
    if (scheme?.toLowerCase() !== "bearer" || !value) return null;
    return value;
  }

  private reject(context: ExecutionContext): void {
    if (context.getType<string>() === "graphql") {
      throw new GraphQLError("인증이 필요합니다", {
        extensions: {
          code: ERROR_CODES.AUTH_SESSION_REQUIRED,
          httpStatus: 401
        }
      });
    }

    const res = context.switchToHttp().getResponse<Response>();
    res.status(401).json(failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다"));
  }
}
