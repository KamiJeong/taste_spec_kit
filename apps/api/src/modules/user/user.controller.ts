import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { validateWithZod } from "../shared/zod-validation";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CsrfGuard } from "../shared/guards/csrf.guard";
import { requestAuthOf } from "../shared/request-auth";
import { ApiOkCsrf, ApiOkUnauthorized, ApiOkValidationCsrf } from "../shared/swagger-responses";
import { ApiCsrfHeader, ApiEndpoint, ApiSessionCookieAuth } from "../shared/swagger-route";
import { UserService } from "./user.service";
import {
  changePasswordSchema,
  passwordBodySchema,
  patchProfileSchema,
  type ChangePasswordBody,
  type PasswordBody,
  type PatchProfileBody
} from "./user.schemas";
import { ChangePasswordDto, PasswordDto, PatchProfileDto } from "./dto/user.dto";

function auditContextFromReq(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown"
  };
}

@ApiTags("users")
@ApiSessionCookieAuth()
@UseGuards(AuthGuard)
@Controller("/api/v1/users")
export class UserController {
  constructor(private readonly user: UserService) {}

  @ApiEndpoint("Get user profile")
  @ApiOkUnauthorized("Profile response")
  @Get("/profile")
  async getProfile(@Req() req: Request, @Res() res: Response) {
    const auth = requestAuthOf(req);
    const result = await this.user.getProfile({ sid: auth.sid });
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Update user profile")
  @ApiCsrfHeader()
  @ApiBody({ type: PatchProfileDto })
  @ApiOkValidationCsrf("Profile updated")
  @UseGuards(CsrfGuard)
  @Patch("/profile")
  async patchProfile(@Req() req: Request, @Body() body: PatchProfileDto, @Res() res: Response) {
    const payload: PatchProfileBody = body;
    const validated = validateWithZod(patchProfileSchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const auth = requestAuthOf(req);
    const result = await this.user.patchProfile({ sid: auth.sid, ...validated.data });
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Change account password")
  @ApiCsrfHeader()
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkValidationCsrf("Password changed")
  @UseGuards(CsrfGuard)
  @Post("/change-password")
  async changePassword(
    @Req() req: Request,
    @Body() body: ChangePasswordDto,
    @Res() res: Response
  ) {
    const payload: ChangePasswordBody = body;
    const validated = validateWithZod(changePasswordSchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const auth = requestAuthOf(req);
    const result = await this.user.changePassword({
      sid: auth.sid,
      currentPassword: validated.data.currentPassword,
      newPassword: validated.data.newPassword
    });
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Deactivate account")
  @ApiCsrfHeader()
  @ApiBody({ type: PasswordDto })
  @ApiOkValidationCsrf("Account deactivated")
  @UseGuards(CsrfGuard)
  @Post("/deactivate")
  async deactivate(@Req() req: Request, @Body() body: PasswordDto, @Res() res: Response) {
    const payload: PasswordBody = body;
    const validated = validateWithZod(passwordBodySchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const auth = requestAuthOf(req);
    const result = await this.user.deactivate(
      { sid: auth.sid, password: validated.data.password },
      auditContextFromReq(req)
    );
    if (result.status === 200) {
      res.setHeader("set-cookie", ["csrfToken=; Path=/; Max-Age=0"]);
    }
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Request account deletion")
  @ApiCsrfHeader()
  @ApiBody({ type: PasswordDto })
  @ApiOkValidationCsrf("Deletion requested")
  @UseGuards(CsrfGuard)
  @Post("/request-deletion")
  async requestDeletion(@Req() req: Request, @Body() body: PasswordDto, @Res() res: Response) {
    const payload: PasswordBody = body;
    const validated = validateWithZod(passwordBodySchema, payload);
    if (!validated.ok) {
      res.status(validated.response.status).json(validated.response.body);
      return;
    }
    const auth = requestAuthOf(req);
    const result = await this.user.requestDeletion({ sid: auth.sid, password: validated.data.password });
    res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Cancel scheduled account deletion")
  @ApiCsrfHeader()
  @ApiOkCsrf("Deletion canceled")
  @UseGuards(CsrfGuard)
  @Post("/cancel-deletion")
  async cancelDeletion(@Req() req: Request, @Res() res: Response) {
    const auth = requestAuthOf(req);
    const result = await this.user.cancelDeletion({ sid: auth.sid });
    res.status(result.status).json(result.body);
  }
}
