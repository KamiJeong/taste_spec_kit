import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { SessionService } from "../session/session.service";
import { fail } from "../shared/fail";
import { success } from "../shared/http-contract";
import { SUCCESS_CODES } from "../shared/success-codes";
import { ChannelRepository, type ChannelPublicUser } from "./channel.repository";
import {
  canKickTarget,
  canManageManager,
  canQuit,
  canReviewJoinRequests,
  canTransferOwnership
} from "./channel-role.util";

const MAX_OWNED_CHANNELS = 10;
const DEFAULT_MAX_JOINED_CHANNELS = 200;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_JOIN_REQUEST_RATE_LIMIT_MAX = 10;
const DEFAULT_JOIN_REVIEW_RATE_LIMIT_MAX = 30;

type ChannelPublicMember = {
  user: ChannelPublicUser;
  role: "owner" | "manager" | "member";
  joinedAt: string;
  updatedAt: string;
};

type ChannelListEntry = {
  id: string;
  name: string;
  ownerUserId: string;
  role: "owner" | "manager" | "member";
  sortIndex: number | null;
  creator: ChannelPublicUser | null;
  users: ChannelPublicMember[];
};

@Injectable()
export class ChannelService {
  private readonly rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly repository: ChannelRepository,
    private readonly sessions: SessionService,
    private readonly auditLogs: AuditLogService,
    @Inject("CONTRACT_RUNTIME") private readonly _contracts: unknown
  ) {}

  private envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  private maxJoinedChannels(): number {
    return this.envInt("CHANNEL_MAX_JOINED", DEFAULT_MAX_JOINED_CHANNELS);
  }

  private isRateLimited(key: string, max: number, windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS): boolean {
    const now = Date.now();
    const current = this.rateLimitBuckets.get(key);
    if (!current || current.resetAt <= now) {
      this.rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    current.count += 1;
    this.rateLimitBuckets.set(key, current);
    return current.count > max;
  }

  private async resolveUser(input: { sid?: string; userId?: string }) {
    if (input.userId) {
      return this.repository.findUserById(input.userId);
    }
    const userId = await this.sessions.getUserId(input.sid);
    if (!userId) return null;
    return this.repository.findUserById(userId);
  }

  private sameSet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false;
    const set = new Set(left);
    if (set.size !== right.length) return false;
    for (const value of right) {
      if (!set.has(value)) return false;
    }
    return true;
  }

  async createChannel(input: { sid?: string; userId?: string; name: string }, context: AuditContext) {
    const user = await this.resolveUser({ sid: input.sid, userId: input.userId });
    if (!user) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }

    const owned = await this.repository.countOwnedChannels(user.id);
    if (owned >= MAX_OWNED_CHANNELS) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_CREATE_LIMIT_REACHED) };
    }

    const now = new Date().toISOString();
    const channelId = randomUUID();
    await this.repository.createChannelWithOwner({
      channel: {
        id: channelId,
        name: input.name.trim(),
        ownerUserId: user.id,
        createdAt: now,
        updatedAt: now
      },
      ownerMember: {
        channelId,
        userId: user.id,
        role: "owner",
        joinedAt: now,
        updatedAt: now
      }
    });
    await this.auditLogs.record({
      eventType: "CHANNEL_CREATE",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });

    return {
      status: 201,
      body: success({
        channel: {
          id: channelId,
          name: input.name.trim(),
          role: "owner"
        }
      })
    };
  }

  async listMyChannels(input: { sid?: string; userId?: string }) {
    const user = await this.resolveUser({ sid: input.sid, userId: input.userId });
    if (!user) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }

    const channels = await this.repository.listUserChannels(user.id);
    const channelIds = channels.map((row) => row.channel.id);
    const members = await this.repository.listChannelMembersWithUsers(channelIds);

    const membersByChannel = new Map<string, ChannelPublicMember[]>();
    for (const row of members) {
      const bucket = membersByChannel.get(row.channelId) ?? [];
      bucket.push({
        user: row.user,
        role: row.role,
        joinedAt: row.joinedAt,
        updatedAt: row.updatedAt
      });
      membersByChannel.set(row.channelId, bucket);
    }

    const orderedRoleWeight: Record<ChannelPublicMember["role"], number> = {
      owner: 0,
      manager: 1,
      member: 2
    };

    const channelItems: ChannelListEntry[] = channels.map((row) => {
      const channelMembers = (membersByChannel.get(row.channel.id) ?? []).sort((a, b) => {
        const roleDiff = orderedRoleWeight[a.role] - orderedRoleWeight[b.role];
        if (roleDiff !== 0) return roleDiff;
        return a.user.id.localeCompare(b.user.id);
      });
      const creator = channelMembers.find((member) => member.user.id === row.channel.ownerUserId)?.user ?? null;
      return {
        id: row.channel.id,
        name: row.channel.name,
        ownerUserId: row.channel.ownerUserId,
        role: row.role,
        sortIndex: row.sortIndex,
        creator,
        users: channelMembers
      };
    });

    return {
      status: 200,
      body: success({
        channels: channelItems
      })
    };
  }

  async createJoinRequest(input: { sid?: string; channelId: string }, context: AuditContext) {
    const user = await this.resolveUser({ sid: input.sid });
    if (!user) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }

    const joinRequestRateLimitMax = this.envInt("CHANNEL_JOIN_REQUEST_RATE_LIMIT_MAX", DEFAULT_JOIN_REQUEST_RATE_LIMIT_MAX);
    const rateLimitWindowMs = this.envInt("CHANNEL_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
    const joinRequestRateKey = `channel:join-request:${context.ip}:${user.id}:${input.channelId}`;
    if (this.isRateLimited(joinRequestRateKey, joinRequestRateLimitMax, rateLimitWindowMs)) {
      return {
        status: 429,
        body: fail(ERROR_CODES.RATE_LIMIT_EXCEEDED)
      };
    }

    const channel = await this.repository.findChannelById(input.channelId);
    if (!channel) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }

    const membership = await this.repository.findChannelMember(input.channelId, user.id);
    if (membership) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_ALREADY_MEMBER) };
    }

    const joinedCount = await this.repository.countMemberships(user.id);
    if (joinedCount >= this.maxJoinedChannels()) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED) };
    }

    const pending = await this.repository.findPendingJoinRequest(input.channelId, user.id);
    if (pending) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_JOIN_REQUEST_PENDING) };
    }

    const now = new Date().toISOString();
    await this.repository.createJoinRequest({
      id: randomUUID(),
      channelId: input.channelId,
      requesterUserId: user.id,
      status: "pending",
      reviewedByUserId: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now
    });
    await this.auditLogs.record({
      eventType: "CHANNEL_JOIN_REQUEST",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });
    return {
      status: 201,
      body: success({ message: SUCCESS_CODES.CHANNEL_JOIN_REQUEST_CREATED, requestState: "PENDING" })
    };
  }

  async listPendingRequests(input: { sid?: string; channelId: string }) {
    const user = await this.resolveUser({ sid: input.sid });
    if (!user) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const member = await this.repository.findChannelMember(input.channelId, user.id);
    if (!member || !canReviewJoinRequests(member.role)) {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const requests = await this.repository.listPendingJoinRequests(input.channelId);
    return {
      status: 200,
      body: success({
        requests: requests.map((row) => ({
          id: row.id,
          requesterUserId: row.requesterUserId,
          status: row.status,
          createdAt: row.createdAt
        }))
      })
    };
  }

  async reviewJoinRequest(
    input: { sid?: string; channelId: string; requestId: string; decision: "approved" | "rejected" },
    context: AuditContext
  ) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const joinReviewRateLimitMax = this.envInt("CHANNEL_JOIN_REVIEW_RATE_LIMIT_MAX", DEFAULT_JOIN_REVIEW_RATE_LIMIT_MAX);
    const rateLimitWindowMs = this.envInt("CHANNEL_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
    const joinReviewRateKey = `channel:join-review:${context.ip}:${actor.id}:${input.channelId}`;
    if (this.isRateLimited(joinReviewRateKey, joinReviewRateLimitMax, rateLimitWindowMs)) {
      return {
        status: 429,
        body: fail(ERROR_CODES.RATE_LIMIT_EXCEEDED)
      };
    }

    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || !canReviewJoinRequests(actorMember.role)) {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const request = await this.repository.findJoinRequestById(input.requestId);
    if (!request || request.channelId !== input.channelId || request.status !== "pending") {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND) };
    }

    if (input.decision === "approved") {
      const joinedCount = await this.repository.countMemberships(request.requesterUserId);
      if (joinedCount >= this.maxJoinedChannels()) {
        return { status: 409, body: fail(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED) };
      }
    }

    const now = new Date().toISOString();
    const changed = await this.repository.reviewJoinRequestAndMaybeAddMember({
      requestId: request.id,
      reviewedByUserId: actor.id,
      decision: input.decision,
      reviewedAt: now,
      approvedMember:
        input.decision === "approved"
          ? {
              channelId: request.channelId,
              userId: request.requesterUserId,
              role: "member",
              joinedAt: now,
              updatedAt: now
            }
          : undefined
    });
    if (!changed) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND) };
    }

    await this.auditLogs.record({
      eventType: "CHANNEL_JOIN_REVIEW",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });

    return {
      status: 200,
      body: success({
        message:
          input.decision === "approved"
            ? SUCCESS_CODES.CHANNEL_JOIN_REQUEST_APPROVED
            : SUCCESS_CODES.CHANNEL_JOIN_REQUEST_REJECTED
      })
    };
  }

  async addManager(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }
    if (!canManageManager(actorMember.role, targetMember.role)) {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    await this.repository.upsertChannelMember({ ...targetMember, role: "manager", updatedAt: new Date().toISOString() });
    await this.auditLogs.record({
      eventType: "CHANNEL_MANAGER_ASSIGN",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_MANAGER_ASSIGNED }) };
  }

  async removeManager(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember || targetMember.role !== "manager") {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }

    await this.repository.upsertChannelMember({ ...targetMember, role: "member", updatedAt: new Date().toISOString() });
    await this.auditLogs.record({
      eventType: "CHANNEL_MANAGER_REMOVE",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_MANAGER_REMOVED }) };
  }

  async kickMember(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || !canReviewJoinRequests(actorMember.role)) {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }
    if (!canKickTarget(actorMember.role, targetMember.role)) {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    await this.repository.deleteChannelMember(input.channelId, targetMember.userId);
    await this.auditLogs.record({
      eventType: "CHANNEL_KICK",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_MEMBER_KICKED }) };
  }

  async quitChannel(input: { sid?: string; channelId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }
    if (!canQuit(actorMember.role)) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_OWNER_TRANSFER_REQUIRED) };
    }
    await this.repository.deleteChannelMember(input.channelId, actor.id);
    await this.auditLogs.record({
      eventType: "CHANNEL_QUIT",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_QUIT }) };
  }

  async transferOwnership(
    input: { sid?: string; channelId: string; targetUserId: string; previousOwnerRole: "manager" | "member" },
    context: AuditContext
  ) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }
    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: fail(ERROR_CODES.CHANNEL_NOT_FOUND) };
    }
    if (!canTransferOwnership(actorMember.role, targetMember.role)) {
      return { status: 409, body: fail(ERROR_CODES.CHANNEL_PERMISSION_DENIED) };
    }

    const now = new Date().toISOString();
    await this.repository.transferOwnership({
      channelId: input.channelId,
      previousOwnerMember: actorMember,
      newOwnerMember: targetMember,
      previousOwnerNextRole: input.previousOwnerRole,
      updatedAt: now
    });
    await this.auditLogs.record({
      eventType: "CHANNEL_TRANSFER_OWNERSHIP",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return {
      status: 200,
      body: success({ message: SUCCESS_CODES.CHANNEL_OWNERSHIP_TRANSFERRED, ownerUserId: targetMember.userId })
    };
  }

  async reorderOwnedChannels(input: { sid?: string; channelIds: string[] }) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }

    const memberships = await this.repository.listUserChannels(actor.id);
    const ownedIds = memberships.filter((row) => row.role === "owner").map((row) => row.channel.id);
    if (!this.sameSet(ownedIds, input.channelIds)) {
      return { status: 400, body: fail(ERROR_CODES.VALIDATION_ERROR) };
    }

    await this.repository.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_OWNED_ORDER_SAVED }) };
  }

  async reorderMyChannels(input: { sid?: string; channelIds: string[] }) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED) };
    }

    const memberships = await this.repository.listUserChannels(actor.id);
    const myIds = memberships.map((row) => row.channel.id);
    if (!this.sameSet(myIds, input.channelIds)) {
      return { status: 400, body: fail(ERROR_CODES.VALIDATION_ERROR) };
    }

    await this.repository.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: SUCCESS_CODES.CHANNEL_MY_ORDER_SAVED }) };
  }
}
