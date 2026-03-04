import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { PersistenceService } from "../persistence/persistence.service";
import { SessionService } from "../session/session.service";
import { failure, success } from "../shared/http-contract";

@Injectable()
export class ChannelPostService {
  constructor(
    private readonly persistence: PersistenceService,
    private readonly sessions: SessionService,
    private readonly auditLogs: AuditLogService,
    @Inject("CONTRACT_RUNTIME") private readonly _contracts: unknown
  ) {}

  private async resolveUserBySid(sid?: string) {
    const userId = await this.sessions.getUserId(sid);
    if (!userId) return null;
    return this.persistence.findUserById(userId);
  }

  private encodeCursor(input: { createdAt: string; id: string }): string {
    return Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
  }

  private decodeCursor(cursor?: string): { createdAt: string; id: string } | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded) as { createdAt?: unknown; id?: unknown };
      if (
        typeof parsed.createdAt !== "string" ||
        typeof parsed.id !== "string" ||
        parsed.id.trim() === "" ||
        Number.isNaN(Date.parse(parsed.createdAt))
      ) {
        return null;
      }
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      return null;
    }
  }

  private async getActorWithMembership(input: { sid?: string; channelId: string }) {
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { kind: "error" as const, response: { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") } };
    }
    const channel = await this.persistence.findChannelById(input.channelId);
    if (!channel) {
      return { kind: "error" as const, response: { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "채널을 찾을 수 없습니다") } };
    }
    const membership = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!membership) {
      return { kind: "error" as const, response: { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") } };
    }
    return { kind: "ok" as const, actor, membership };
  }

  async createPost(input: { sid?: string; channelId: string; title: string; content: string }, context: AuditContext) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;
    if (resolved.membership.role !== "owner" && resolved.membership.role !== "manager") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const now = new Date().toISOString();
    const postId = randomUUID();
    await this.persistence.createChannelPost({
      id: postId,
      channelId: input.channelId,
      authorUserId: resolved.actor.id,
      title: input.title.trim(),
      content: input.content.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });

    await this.auditLogs.record({
      eventType: "CHANNEL_POST_CREATE",
      result: "SUCCESS",
      context,
      userId: resolved.actor.id,
      email: resolved.actor.email
    });

    return {
      status: 201,
      body: success({
        post: {
          id: postId,
          channelId: input.channelId,
          authorUserId: resolved.actor.id,
          title: input.title.trim(),
          content: input.content.trim(),
          createdAt: now,
          updatedAt: now
        }
      })
    };
  }

  async listPosts(input: { sid?: string; channelId: string; limit: number; cursor?: string }) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;

    const decodedCursor = this.decodeCursor(input.cursor);
    if (input.cursor && !decodedCursor) {
      return { status: 400, body: failure(ERROR_CODES.VALIDATION_ERROR, "cursor 형식이 올바르지 않습니다") };
    }

    const rows = await this.persistence.listChannelPosts({
      channelId: input.channelId,
      limit: input.limit,
      cursor: decodedCursor ?? undefined
    });
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const tail = page[page.length - 1];
    const nextCursor = hasMore && tail ? this.encodeCursor({ createdAt: tail.createdAt, id: tail.id }) : null;

    return {
      status: 200,
      body: success({
        items: page.map((row) => ({
          id: row.id,
          channelId: row.channelId,
          authorUserId: row.authorUserId,
          title: row.title,
          content: row.content,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        })),
        nextCursor
      })
    };
  }

  async getPost(input: { sid?: string; channelId: string; postId: string }) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;

    const post = await this.persistence.findChannelPostById(input.channelId, input.postId);
    if (!post) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_POST_NOT_FOUND, "게시글을 찾을 수 없습니다") };
    }
    return {
      status: 200,
      body: success({
        post: {
          id: post.id,
          channelId: post.channelId,
          authorUserId: post.authorUserId,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }
      })
    };
  }

  async updatePost(
    input: { sid?: string; channelId: string; postId: string; title?: string; content?: string; ifUpdatedAt: string },
    context: AuditContext
  ) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;
    if (resolved.membership.role !== "owner" && resolved.membership.role !== "manager") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const now = new Date().toISOString();
    const updated = await this.persistence.updateChannelPost({
      channelId: input.channelId,
      postId: input.postId,
      title: typeof input.title === "string" ? input.title.trim() : undefined,
      content: typeof input.content === "string" ? input.content.trim() : undefined,
      ifUpdatedAt: input.ifUpdatedAt,
      updatedAt: now
    });
    if (updated.state === "not_found") {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_POST_NOT_FOUND, "게시글을 찾을 수 없습니다") };
    }
    if (updated.state === "conflict") {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_POST_VERSION_CONFLICT, "게시글이 다른 요청에 의해 변경되었습니다") };
    }

    await this.auditLogs.record({
      eventType: "CHANNEL_POST_UPDATE",
      result: "SUCCESS",
      context,
      userId: resolved.actor.id,
      email: resolved.actor.email
    });

    return {
      status: 200,
      body: success({
        post: {
          id: updated.post.id,
          channelId: updated.post.channelId,
          authorUserId: updated.post.authorUserId,
          title: updated.post.title,
          content: updated.post.content,
          createdAt: updated.post.createdAt,
          updatedAt: updated.post.updatedAt
        }
      })
    };
  }

  async deletePost(input: { sid?: string; channelId: string; postId: string }, context: AuditContext) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;
    if (resolved.membership.role !== "owner" && resolved.membership.role !== "manager") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const deleted = await this.persistence.softDeleteChannelPost(input.channelId, input.postId, new Date().toISOString());
    if (!deleted) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_POST_NOT_FOUND, "게시글을 찾을 수 없습니다") };
    }

    await this.auditLogs.record({
      eventType: "CHANNEL_POST_DELETE",
      result: "SUCCESS",
      context,
      userId: resolved.actor.id,
      email: resolved.actor.email
    });
    return { status: 200, body: success({ message: "게시글이 삭제되었습니다" }) };
  }
}
