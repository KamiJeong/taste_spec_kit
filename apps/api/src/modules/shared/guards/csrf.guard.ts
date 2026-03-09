import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@packages/contracts-auth";
import type { Request, Response } from "express";
import { failure } from "../http-contract";
import { cookieOf } from "../request-cookie";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const csrfCookie = cookieOf(req, "csrfToken");
    const csrfHeader = req.headers["x-csrf-token"];
    const valid =
      typeof csrfCookie === "string" &&
      typeof csrfHeader === "string" &&
      csrfCookie.length > 0 &&
      csrfHeader === csrfCookie;

    if (valid) return true;

    res.status(403).json(failure(ERROR_CODES.AUTH_CSRF_INVALID, "CSRF 검증에 실패했습니다"));
    return false;
  }
}
