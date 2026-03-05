import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import { validateWithZod } from "../shared/zod-validation";
import { cookieOf } from "../shared/request-cookie";
import { CsrfGuard } from "../shared/guards/csrf.guard";
import { ApiCreatedValidation, ApiOkCsrf, ApiOkUnauthorized, ApiOkValidation } from "../shared/swagger-responses";
import { ApiEndpoint, ApiSessionCookieAuth, ApiSessionMutationAuth } from "../shared/swagger-route";
import { TokenService } from "../token/token.service";
import { AuthService } from "./auth.service";
import {
  emailBodySchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type EmailBody,
  type LoginBody,
  type ResetPasswordBody,
  type SignupBody,
  verifyEmailQuerySchema
} from "./auth.schemas";
import { EmailDto, LoginDto, ResetPasswordDto, SignupDto } from "./dto/auth.dto";

function auditContextFromReq(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown"
  };
}

@ApiTags("auth")
@Controller("/api/v1/auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService
  ) {}

  private bearerUserIdOf(req: Request): string | undefined {
    const raw = req.headers.authorization;
    if (typeof raw !== "string") return undefined;
    const [scheme, token] = raw.trim().split(/\s+/, 2);
    if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
    const verified = this.tokens.verifyAccessToken(token);
    return verified?.userId;
  }

  @ApiEndpoint("Sign up with email/password")
  @ApiBody({ type: SignupDto })
  @ApiCreatedValidation("Signup accepted")
  @Post("/signup")
  async signup(@Req() req: Request, @Body() body: SignupDto, @Res() res: Response) {
    const payload: SignupBody = body;
    const validated = validateWithZod(signupSchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.signup(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Verify email token")
  @ApiQuery({ name: "token", required: true })
  @ApiOkValidation("Email verified", "Invalid token")
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

  @ApiEndpoint("Resend verification email")
  @ApiBody({ type: EmailDto })
  @ApiOkValidation("Verification mail requested")
  @Post("/resend-verification")
  async resendVerification(@Req() req: Request, @Body() body: EmailDto, @Res() res: Response) {
    const payload: EmailBody = body;
    const validated = validateWithZod(emailBodySchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.resendVerification(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Request password reset email")
  @ApiBody({ type: EmailDto })
  @ApiOkValidation("Reset mail requested")
  @Post("/forgot-password")
  async forgotPassword(@Req() req: Request, @Body() body: EmailDto, @Res() res: Response) {
    const payload: EmailBody = body;
    const validated = validateWithZod(emailBodySchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.forgotPassword(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Reset password with token")
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkValidation("Password reset")
  @Post("/reset-password")
  async resetPassword(@Req() req: Request, @Body() body: ResetPasswordDto, @Res() res: Response) {
    const payload: ResetPasswordBody = body;
    const validated = validateWithZod(resetPasswordSchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.auth.resetPassword(validated.data, auditContextFromReq(req));
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Login and issue session cookie")
  @ApiBody({ type: LoginDto })
  @ApiOkUnauthorized("Login success", "Login rejected")
  @Post("/login")
  async login(@Req() req: Request, @Body() body: LoginDto, @Res() res: Response) {
    const payload: LoginBody = body;
    const validated = validateWithZod(loginSchema, payload);
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

  @ApiEndpoint("Logout and clear session cookie")
  @ApiSessionMutationAuth()
  @ApiOkCsrf("Logout success")
  @UseGuards(CsrfGuard)
  @Post("/logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.auth.logout({ sid: cookieOf(req, "sid") }, auditContextFromReq(req));
    res.setHeader("set-cookie", ["sid=; HttpOnly; Path=/; Max-Age=0", "csrfToken=; Path=/; Max-Age=0"]);
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Get current session user")
  @ApiSessionCookieAuth()
  @ApiOkUnauthorized("Current user")
  @Get("/me")
  async me(@Req() req: Request, @Res() res: Response) {
    const result = await this.auth.me({ sid: cookieOf(req, "sid"), userId: this.bearerUserIdOf(req) });
    res.status(result.status).json(result.body);
  }
}
