import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBody, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CsrfGuard } from "../shared/guards/csrf.guard";
import { requestAuthOf } from "../shared/request-auth";
import { ApiOkCsrf, ApiOkUnauthorized, ApiOkValidationCsrf } from "../shared/swagger-responses";
import { ApiEndpoint, ApiSessionCookieAuth, ApiSessionMutationAuth } from "../shared/swagger-route";
import { validateWithZod } from "../shared/zod-validation";
import { ChannelPostService } from "./channel-post.service";
import {
  createChannelPostSchema,
  listChannelPostsQuerySchema,
  updateChannelPostSchema,
  type CreateChannelPostBody,
  type UpdateChannelPostBody
} from "./channel-post.schemas";
import { CreateChannelPostDto, UpdateChannelPostDto } from "./dto/channel-post.dto";

function auditContextFromReq(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown"
  };
}

@ApiTags("channel-posts")
@ApiSessionCookieAuth()
@UseGuards(AuthGuard)
@Controller("/api/v1/channels/:channelId/posts")
export class ChannelPostController {
  constructor(private readonly posts: ChannelPostService) {}

  @ApiEndpoint("Create channel post")
  @ApiParam({ name: "channelId", required: true })
  @ApiBody({ type: CreateChannelPostDto })
  @ApiSessionMutationAuth()
  @ApiOkValidationCsrf("Post created")
  @UseGuards(CsrfGuard)
  @Post()
  async createPost(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Body() body: CreateChannelPostDto,
    @Res() res: Response
  ) {
    const payload: CreateChannelPostBody = body;
    const validated = validateWithZod(createChannelPostSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const auth = requestAuthOf(req);
    const result = await this.posts.createPost(
      {
        sid: auth.sid,
        userId: auth.userId,
        channelId,
        title: validated.data.title,
        content: validated.data.content
      },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("List channel posts")
  @ApiParam({ name: "channelId", required: true })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiOkUnauthorized("Post list")
  @Get()
  async listPosts(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Query("limit") limit: string | undefined,
    @Query("cursor") cursor: string | undefined,
    @Res() res: Response
  ) {
    const validated = validateWithZod(listChannelPostsQuerySchema, { limit: limit ?? 20, cursor });
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const auth = requestAuthOf(req);
    const result = await this.posts.listPosts({
      sid: auth.sid,
      userId: auth.userId,
      channelId,
      limit: validated.data.limit,
      cursor: validated.data.cursor
    });
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Get channel post")
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "postId", required: true })
  @ApiOkUnauthorized("Post detail")
  @Get(":postId")
  async getPost(@Req() req: Request, @Param("channelId") channelId: string, @Param("postId") postId: string, @Res() res: Response) {
    const auth = requestAuthOf(req);
    const result = await this.posts.getPost({ sid: auth.sid, channelId, postId });
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Update channel post")
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "postId", required: true })
  @ApiBody({ type: UpdateChannelPostDto })
  @ApiSessionMutationAuth()
  @ApiOkValidationCsrf("Post updated")
  @UseGuards(CsrfGuard)
  @Patch(":postId")
  async updatePost(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Param("postId") postId: string,
    @Body() body: UpdateChannelPostDto,
    @Res() res: Response
  ) {
    const payload: UpdateChannelPostBody = body;
    const validated = validateWithZod(updateChannelPostSchema, payload);
    if (!validated.ok) return res.status(validated.response.status).json(validated.response.body);
    const auth = requestAuthOf(req);
    const result = await this.posts.updatePost(
      {
        sid: auth.sid,
        channelId,
        postId,
        title: validated.data.title,
        content: validated.data.content,
        ifUpdatedAt: validated.data.ifUpdatedAt
      },
      auditContextFromReq(req)
    );
    return res.status(result.status).json(result.body);
  }

  @ApiEndpoint("Delete channel post")
  @ApiParam({ name: "channelId", required: true })
  @ApiParam({ name: "postId", required: true })
  @ApiSessionMutationAuth()
  @ApiOkCsrf("Post deleted")
  @UseGuards(CsrfGuard)
  @Delete(":postId")
  async deletePost(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Param("postId") postId: string,
    @Res() res: Response
  ) {
    const auth = requestAuthOf(req);
    const result = await this.posts.deletePost({ sid: auth.sid, channelId, postId }, auditContextFromReq(req));
    return res.status(result.status).json(result.body);
  }
}
