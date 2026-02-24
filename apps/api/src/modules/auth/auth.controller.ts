import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";
import { ERROR_CODES } from "@packages/contracts-auth";
import { validateWithZod } from "../shared/zod-validation";
import { failure } from "../shared/http-contract";
import { AuthService } from "./auth.service";

function cookieOf(req: Request, key: string): string | undefined {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === key) return decodeURIComponent(v || "");
  }
  return undefined;
}

function auditContextFromReq(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown"
  };
}

function isCsrfValid(req: Request): boolean {
  const csrfCookie = cookieOf(req, "csrfToken");
  const csrfHeader = req.headers["x-csrf-token"];
  return typeof csrfCookie === "string" && typeof csrfHeader === "string" && csrfCookie.length > 0 && csrfHeader === csrfCookie;
}

const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100).nullable().optional()
});

const verifyEmailQuerySchema = z.object({
  token: z.string().min(1)
});

const emailBodySchema = z.object({
  email: z.string().trim().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("/signup")
  async signup(@Req() req: Request, @Body() body: { email: string; password: string; name?: string | null }, @Res() res: Response) {
    const validated = validateWithZod(signupSchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.signup(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @Get("/verify-email")
  async verifyEmail(@Req() req: Request, @Query("token") token: string, @Res() res: Response) {
    const validated = validateWithZod(verifyEmailQuerySchema, { token });
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.verifyEmail(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @Post("/resend-verification")
  async resendVerification(@Req() req: Request, @Body() body: { email: string }, @Res() res: Response) {
    const validated = validateWithZod(emailBodySchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.resendVerification(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @Post("/forgot-password")
  async forgotPassword(@Req() req: Request, @Body() body: { email: string }, @Res() res: Response) {
    const validated = validateWithZod(emailBodySchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.forgotPassword(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @Post("/reset-password")
  async resetPassword(@Req() req: Request, @Body() body: { token: string; newPassword: string }, @Res() res: Response) {
    const validated = validateWithZod(resetPasswordSchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.resetPassword(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @Post("/login")
  async login(@Req() req: Request, @Body() body: { email: string; password: string }, @Res() res: Response) {
    const validated = validateWithZod(loginSchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.login(validated.data, auditContextFromReq(req));
    if ("sid" in result && result.sid) {
      const csrfToken = encodeURIComponent(result.csrfToken);
      res.setHeader("set-cookie", [
        `sid=${encodeURIComponent(result.sid)}; HttpOnly; Path=/`,
        `csrfToken=${csrfToken}; Path=/`
      ]);
    }
    res.status(result.status).json(result.body);
  }

  @Post("/logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    if (cookieOf(req, "sid") && !isCsrfValid(req)) {
      res
        .status(403)
        .json(failure(ERROR_CODES.AUTH_CSRF_INVALID, "CSRF 검증에 실패했습니다"));
      return;
    }
    const result = await this.auth.logout({ sid: cookieOf(req, "sid") }, auditContextFromReq(req));
    res.setHeader("set-cookie", ["sid=; HttpOnly; Path=/; Max-Age=0", "csrfToken=; Path=/; Max-Age=0"]);
    res.status(result.status).json(result.body);
  }

  @Get("/me")
  async me(@Req() req: Request, @Res() res: Response) {
    const result = await this.auth.me({ sid: cookieOf(req, "sid") });
    res.status(result.status).json(result.body);
  }
}
