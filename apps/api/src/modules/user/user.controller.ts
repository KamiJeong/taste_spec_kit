import { Body, Controller, Get, Patch, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";
import { ERROR_CODES } from "@packages/contracts-auth";
import { validateWithZod } from "../shared/zod-validation";
import { failure } from "../shared/http-contract";
import { UserService } from "./user.service";

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

function csrfGuard(req: Request, res: Response): boolean {
  if (!cookieOf(req, "sid")) return true;
  if (isCsrfValid(req)) return true;
  res.status(403).json(failure(ERROR_CODES.AUTH_CSRF_INVALID, "CSRF 검증에 실패했습니다"));
  return false;
}

const patchProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().pipe(z.email()).optional()
  })
  .refine((value) => typeof value.name !== "undefined" || typeof value.email !== "undefined", {
    message: "at least one field must be provided"
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

const passwordBodySchema = z.object({
  password: z.string().min(1)
});

@Controller("/api/v1/users")
export class UserController {
  constructor(private readonly user: UserService) {}

  @Get("/profile")
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const result = await this.user.getProfile({ sid: cookieOf(req, "sid") });
    res.status(result.status).json(result.body);
  }

  @Patch("/profile")
  async patchProfile(@Req() req: Request, @Body() body: { name?: string; email?: string }, @Res() res: Response) {
    if (!csrfGuard(req, res)) return;
    const validated = validateWithZod(patchProfileSchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.user.patchProfile({ sid: cookieOf(req, "sid"), ...validated.data });
    res.status(result.status).json(result.body);
  }

  @Post("/change-password")
  async changePassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
    @Res() res: Response
  ) {
    if (!csrfGuard(req, res)) return;
    const validated = validateWithZod(changePasswordSchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.user.changePassword({
      sid: cookieOf(req, "sid"),
      currentPassword: validated.data.currentPassword,
      newPassword: validated.data.newPassword
    });
    res.status(result.status).json(result.body);
  }

  @Post("/deactivate")
  async deactivate(@Req() req: Request, @Body() body: { password: string }, @Res() res: Response) {
    if (!csrfGuard(req, res)) return;
    const validated = validateWithZod(passwordBodySchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.user.deactivate(
      { sid: cookieOf(req, "sid"), password: validated.data.password },
      auditContextFromReq(req)
    );
    if (result.status === 200) {
      res.setHeader("set-cookie", ["sid=; HttpOnly; Path=/; Max-Age=0", "csrfToken=; Path=/; Max-Age=0"]);
    }
    res.status(result.status).json(result.body);
  }

  @Post("/request-deletion")
  async requestDeletion(@Req() req: Request, @Body() body: { password: string }, @Res() res: Response) {
    if (!csrfGuard(req, res)) return;
    const validated = validateWithZod(passwordBodySchema, body);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const result = await this.user.requestDeletion({ sid: cookieOf(req, "sid"), password: validated.data.password });
    res.status(result.status).json(result.body);
  }

  @Post("/cancel-deletion")
  async cancelDeletion(@Req() req: Request, @Res() res: Response) {
    if (!csrfGuard(req, res)) return;
    const result = await this.user.cancelDeletion({ sid: cookieOf(req, "sid") });
    res.status(result.status).json(result.body);
  }
}
