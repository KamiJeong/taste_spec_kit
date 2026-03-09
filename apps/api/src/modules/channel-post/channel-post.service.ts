import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { SessionService } from "../session/session.service";
import { fail } from "../shared/fail";
import { success } from "../shared/http-contract";
import { SUCCESS_CODES } from "../shared/success-codes";
import { ChannelPostRepository } from "./channel-post.repository";

@Injectable()
export class ChannelPostService {
  constructor(
    private readonly repository: ChannelPostRepository,
    private readonly sessions: SessionService,
    private readonly auditLogs: AuditLogService,
    @Inject("CONTRACT_RUNTIME") private readonly _contracts: unknown
  ) {}

  private async resolveUser(input: { sid?: string; userId?: string }) {
    if (input.userId) {
      return this.repository.findUserById(input.userId);
    }
    const userId = await this.sessions.getUserId(input.sid);
    if (!userId) return null;
    return this.repository.findUserById(userId);
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

  private async getActorWithMembership(input: { sid?: string; userId?: string; channelId: string }) {
    const actor = await this.resolveUser({ sid: input.sid, userId: input.userId });
    if (!actor) {
      return { kind: "error" as const, response: { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) } };
    }
    const channel = await this.repository.findChannelById(input.channelId);
    if (!channel) {
      return { kind: "error" as const, response: { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) } };
    }
    const membership = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!membership) {
      return { kind: "error" as const, response: { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) } };
    }
    return { kind: "ok" as const, actor, membership };
  }

  async createPost(input: { sid?: string; userId?: string; channelId: string; title: string; content: string }, context: AuditContext) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, userId: input.userId, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;
    if (resolved.membership.role !== "owner" && resolved.membership.role !== "manager") {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const now = new Date().toISOString();
    const postId = randomUUID();
    await this.repository.createChannelPost({
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

  async listPosts(input: { sid?: string; userId?: string; channelId: string; limit: number; cursor?: string }) {
    const resolved = await this.getActorWithMembership({ sid: input.sid, userId: input.userId, channelId: input.channelId });
    if (resolved.kind === "error") return resolved.response;

    const decodedCursor = this.decodeCursor(input.cursor);
    if (input.cursor && !decodedCursor) {
      return { status: 400, body: fail(ERROR_CODES.VALIDATION_ERROR) };
    }

    const rows = await this.repository.listChannelPosts({
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

    const post = await this.repository.findChannelPostById(input.channelId, input.postId);
    if (!post) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_POST_NOT_FOUND) };
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
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const now = new Date().toISOString();
    const updated = await this.repository.updateChannelPost({
      channelId: input.channelId,
      postId: input.postId,
      title: typeof input.title === "string" ? input.title.trim() : undefined,
      content: typeof input.content === "string" ? input.content.trim() : undefined,
      ifUpdatedAt: input.ifUpdatedAt,
      updatedAt: now
    });
    if (updated.state === "not_found") {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_POST_NOT_FOUND) };
    }
    if (updated.state === "conflict") {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_POST_VERSION_CONFLICT) };
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
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const deleted = await this.repository.softDeleteChannelPost(input.channelId, input.postId, new Date().toISOString());
    if (!deleted) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_POST_NOT_FOUND) };
    }

    await this.auditLogs.record({
      eventType: "CHANNEL_POST_DELETE",
      result: "SUCCESS",
      context,
      userId: resolved.actor.id,
      email: resolved.actor.email
    });
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_POST_DELETED }) };
  }
}
