import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBody, ApiParam, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { CsrfGuard } from "../shared/guards/csrf.guard";
import { cookieOf } from "../shared/request-cookie";
import { ApiOkCsrf, ApiOkUnauthorized, ApiOkValidation, ApiOkValidationCsrf } from "../shared/swagger-responses";
import { ApiEndpoint, ApiSessionCookieAuth, ApiSessionMutationAuth } from "../shared/swagger-route";
import { validateWithZod } from "../shared/zod-validation";
import { ChannelService } from "./channel.service";
import {
  addManagerSchema,
  createChannelSchema,
  kickMemberSchema,
  reorderChannelsSchema,
  transferOwnershipSchema,
  type AddManagerBody,
  type CreateChannelBody,
  type KickMemberBody,
  type ReorderChannelsBody
} from "./channel.schemas";
import { AddManagerDto, CreateChannelDto, KickMemberDto, ReorderChannelsDto, TransferOwnershipDto } from "./dto/channel.dto";

function auditContextFromReq(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown"
  };
}

@ApiTags("channels")
@ApiSessionCookieAuth()
@Controller("/api/v1/channels")
export class ChannelController {
  constructor(private readonly channels: ChannelService) {}

  @ApiEndpoint("Create channel")
  @ApiBody({ type: CreateChannelDto })
  @ApiSessionMutationAuth()
  @ApiOkValidationCsrf("Channel created")
  @UseGuards(CsrfGuard)
  @Post()
  async createChannel(@Req() req: Request, @Body() body: CreateChannelDto, @Res() res: Response) {
    const payload: CreateChannelBody = body;
    const validated = validateWithZod(createChannelSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.createChannel(
      { sid: cookieOf(req, "sid"), name: validated.data.name },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("List my channels")
  @ApiOkUnauthorized("Channel list")
  @Get()
  async listMyChannels(@Req() req: Request, @Res() res: Response) {
    const result = await this.channels.listMyChannels({ sid: cookieOf(req, "sid") });
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Request join channel")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiOkValidationCsrf("Join request created")
  @UseGuards(CsrfGuard)
  @Post(":channelId/join-requests")
  async createJoinRequest(@Req() req: Request, @Param("channelId") channelId: string, @Res() res: Response) {
    const result = await this.channels.createJoinRequest({ sid: cookieOf(req, "sid"), channelId }, auditContextFromReq(req));
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("List pending join requests")
  @ApiParam({ name: "channelId", required: true })
  @ApiOkUnauthorized("Pending requests")
  @Get(":channelId/join-requests")
  async listPendingRequests(@Req() req: Request, @Param("channelId") channelId: string, @Res() res: Response) {
    const result = await this.channels.listPendingRequests({ sid: cookieOf(req, "sid"), channelId });
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Approve join request")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "requestId", required: true })
  @ApiOkCsrf("Request approved")
  @UseGuards(CsrfGuard)
  @Post(":channelId/join-requests/:requestId/approve")
  async approveJoinRequest(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Param("requestId") requestId: string,
    @Res() res: Response
  ) {
    const result = await this.channels.reviewJoinRequest(
      { sid: cookieOf(req, "sid"), channelId, requestId, decision: "approved" },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Reject join request")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "requestId", required: true })
  @ApiOkCsrf("Request rejected")
  @UseGuards(CsrfGuard)
  @Post(":channelId/join-requests/:requestId/reject")
  async rejectJoinRequest(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Param("requestId") requestId: string,
    @Res() res: Response
  ) {
    const result = await this.channels.reviewJoinRequest(
      { sid: cookieOf(req, "sid"), channelId, requestId, decision: "rejected" },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Add manager")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiBody({ type: AddManagerDto })
  @ApiOkValidationCsrf("Manager added")
  @UseGuards(CsrfGuard)
  @Post(":channelId/managers")
  async addManager(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Body() body: AddManagerDto,
    @Res() res: Response
  ) {
    const payload: AddManagerBody = body;
    const validated = validateWithZod(addManagerSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.addManager(
      { sid: cookieOf(req, "sid"), channelId, targetUserId: validated.data.userId },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Remove manager")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "userId", required: true })
  @ApiOkCsrf("Manager removed")
  @UseGuards(CsrfGuard)
  @Delete(":channelId/managers/:userId")
  async removeManager(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Param("userId") userId: string,
    @Res() res: Response
  ) {
    const result = await this.channels.removeManager(
      { sid: cookieOf(req, "sid"), channelId, targetUserId: userId },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Kick member")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiBody({ type: KickMemberDto })
  @ApiOkValidationCsrf("Member kicked")
  @UseGuards(CsrfGuard)
  @Post(":channelId/kick")
  async kickMember(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Body() body: KickMemberDto,
    @Res() res: Response
  ) {
    const payload: KickMemberBody = body;
    const validated = validateWithZod(kickMemberSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.kickMember(
      { sid: cookieOf(req, "sid"), channelId, targetUserId: validated.data.userId },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Quit channel")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiOkCsrf("Channel quit")
  @UseGuards(CsrfGuard)
  @Post(":channelId/quit")
  async quitChannel(@Req() req: Request, @Param("channelId") channelId: string, @Res() res: Response) {
    const result = await this.channels.quitChannel({ sid: cookieOf(req, "sid"), channelId }, auditContextFromReq(req));
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Transfer ownership")
  @ApiSessionMutationAuth()
  @ApiParam({ name: "channelId", required: true })
  @ApiBody({ type: TransferOwnershipDto })
  @ApiOkValidationCsrf("Ownership transferred")
  @UseGuards(CsrfGuard)
  @Post(":channelId/transfer-ownership")
  async transferOwnership(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Body() body: TransferOwnershipDto,
    @Res() res: Response
  ) {
    const validated = validateWithZod(transferOwnershipSchema, body);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.transferOwnership(
      {
        sid: cookieOf(req, "sid"),
        channelId,
        targetUserId: validated.data.targetUserId,
        previousOwnerRole: validated.data.previousOwnerRole ?? "manager"
      },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Reorder owned channels")
  @ApiSessionMutationAuth()
  @ApiBody({ type: ReorderChannelsDto })
  @ApiOkValidation("Owned channels reordered")
  @UseGuards(CsrfGuard)
  @Post("reorder-owned")
  async reorderOwned(@Req() req: Request, @Body() body: ReorderChannelsDto, @Res() res: Response) {
    const payload: ReorderChannelsBody = body;
    const validated = validateWithZod(reorderChannelsSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.reorderOwnedChannels({ sid: cookieOf(req, "sid"), channelIds: validated.data.channelIds });
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Reorder my channel list")
  @ApiSessionMutationAuth()
  @ApiBody({ type: ReorderChannelsDto })
  @ApiOkValidation("My channels reordered")
  @UseGuards(CsrfGuard)
  @Post("reorder-my-list")
  async reorderMine(@Req() req: Request, @Body() body: ReorderChannelsDto, @Res() res: Response) {
    const payload: ReorderChannelsBody = body;
    const validated = validateWithZod(reorderChannelsSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const result = await this.channels.reorderMyChannels({ sid: cookieOf(req, "sid"), channelIds: validated.data.channelIds });
    return res.status(result.status).json(result.body);
  }
}
