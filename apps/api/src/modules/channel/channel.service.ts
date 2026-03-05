import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { SessionService } from "../session/session.service";
import { failure, success } from "../shared/http-contract";
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
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const owned = await this.repository.countOwnedChannels(user.id);
    if (owned >= MAX_OWNED_CHANNELS) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_CREATE_LIMIT_REACHED, "채널 생성 한도를 초과했습니다") };
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
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
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
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const joinRequestRateLimitMax = this.envInt("CHANNEL_JOIN_REQUEST_RATE_LIMIT_MAX", DEFAULT_JOIN_REQUEST_RATE_LIMIT_MAX);
    const rateLimitWindowMs = this.envInt("CHANNEL_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
    const joinRequestRateKey = `channel:join-request:${context.ip}:${user.id}:${input.channelId}`;
    if (this.isRateLimited(joinRequestRateKey, joinRequestRateLimitMax, rateLimitWindowMs)) {
      return {
        status: 429,
        body: failure(ERROR_CODES.RATE_LIMIT_EXCEEDED, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요")
      };
    }

    const channel = await this.repository.findChannelById(input.channelId);
    if (!channel) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "채널을 찾을 수 없습니다") };
    }

    const membership = await this.repository.findChannelMember(input.channelId, user.id);
    if (membership) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_ALREADY_MEMBER, "이미 채널 멤버입니다") };
    }

    const joinedCount = await this.repository.countMemberships(user.id);
    if (joinedCount >= this.maxJoinedChannels()) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED, "가입 가능한 채널 수를 초과했습니다") };
    }

    const pending = await this.repository.findPendingJoinRequest(input.channelId, user.id);
    if (pending) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_PENDING, "이미 처리 대기 중인 가입 요청이 있습니다") };
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
    return { status: 201, body: success({ message: "가입 요청이 생성되었습니다", requestState: "PENDING" }) };
  }

  async listPendingRequests(input: { sid?: string; channelId: string }) {
    const user = await this.resolveUser({ sid: input.sid });
    if (!user) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const member = await this.repository.findChannelMember(input.channelId, user.id);
    if (!member || !canReviewJoinRequests(member.role)) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
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
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const joinReviewRateLimitMax = this.envInt("CHANNEL_JOIN_REVIEW_RATE_LIMIT_MAX", DEFAULT_JOIN_REVIEW_RATE_LIMIT_MAX);
    const rateLimitWindowMs = this.envInt("CHANNEL_RATE_LIMIT_WINDOW_MS", DEFAULT_RATE_LIMIT_WINDOW_MS);
    const joinReviewRateKey = `channel:join-review:${context.ip}:${actor.id}:${input.channelId}`;
    if (this.isRateLimited(joinReviewRateKey, joinReviewRateLimitMax, rateLimitWindowMs)) {
      return {
        status: 429,
        body: failure(ERROR_CODES.RATE_LIMIT_EXCEEDED, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요")
      };
    }

    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || !canReviewJoinRequests(actorMember.role)) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const request = await this.repository.findJoinRequestById(input.requestId);
    if (!request || request.channelId !== input.channelId || request.status !== "pending") {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND, "가입 요청을 찾을 수 없습니다") };
    }

    if (input.decision === "approved") {
      const joinedCount = await this.repository.countMemberships(request.requesterUserId);
      if (joinedCount >= this.maxJoinedChannels()) {
        return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED, "대상 사용자의 채널 가입 한도를 초과했습니다") };
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
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND, "이미 처리된 요청입니다") };
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
      body: success({ message: `가입 요청이 ${input.decision === "approved" ? "승인" : "거절"}되었습니다` })
    };
  }

  async addManager(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (!canManageManager(actorMember.role, targetMember.role)) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "owner 권한은 변경할 수 없습니다") };
    }

    await this.repository.upsertChannelMember({ ...targetMember, role: "manager", updatedAt: new Date().toISOString() });
    await this.auditLogs.record({
      eventType: "CHANNEL_MANAGER_ASSIGN",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: "매니저가 지정되었습니다" }) };
  }

  async removeManager(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember || targetMember.role !== "manager") {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 매니저를 찾을 수 없습니다") };
    }

    await this.repository.upsertChannelMember({ ...targetMember, role: "member", updatedAt: new Date().toISOString() });
    await this.auditLogs.record({
      eventType: "CHANNEL_MANAGER_REMOVE",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: "매니저 권한이 해제되었습니다" }) };
  }

  async kickMember(input: { sid?: string; channelId: string; targetUserId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || !canReviewJoinRequests(actorMember.role)) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (!canKickTarget(actorMember.role, targetMember.role)) {
      const message =
        targetMember.role === "owner" ? "owner는 강퇴할 수 없습니다" : "manager는 manager를 강퇴할 수 없습니다";
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, message) };
    }

    await this.repository.deleteChannelMember(input.channelId, targetMember.userId);
    await this.auditLogs.record({
      eventType: "CHANNEL_KICK",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: "멤버가 강퇴되었습니다" }) };
  }

  async quitChannel(input: { sid?: string; channelId: string }, context: AuditContext) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "참여 중인 채널이 아닙니다") };
    }
    if (!canQuit(actorMember.role)) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_OWNER_TRANSFER_REQUIRED, "owner는 소유권 이전 후 탈퇴할 수 있습니다") };
    }
    await this.repository.deleteChannelMember(input.channelId, actor.id);
    await this.auditLogs.record({
      eventType: "CHANNEL_QUIT",
      result: "SUCCESS",
      context,
      userId: actor.id,
      email: actor.email
    });
    return { status: 200, body: success({ message: "채널에서 탈퇴했습니다" }) };
  }

  async transferOwnership(
    input: { sid?: string; channelId: string; targetUserId: string; previousOwnerRole: "manager" | "member" },
    context: AuditContext
  ) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.repository.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }
    const targetMember = await this.repository.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (!canTransferOwnership(actorMember.role, targetMember.role)) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "이미 owner입니다") };
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
    return { status: 200, body: success({ message: "소유권이 이전되었습니다", ownerUserId: targetMember.userId }) };
  }

  async reorderOwnedChannels(input: { sid?: string; channelIds: string[] }) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const memberships = await this.repository.listUserChannels(actor.id);
    const ownedIds = memberships.filter((row) => row.role === "owner").map((row) => row.channel.id);
    if (!this.sameSet(ownedIds, input.channelIds)) {
      return { status: 400, body: failure(ERROR_CODES.VALIDATION_ERROR, "소유 채널 전체 id 순서를 전달해야 합니다") };
    }

    await this.repository.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: "소유 채널 순서가 저장되었습니다" }) };
  }

  async reorderMyChannels(input: { sid?: string; channelIds: string[] }) {
    const actor = await this.resolveUser({ sid: input.sid });
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const memberships = await this.repository.listUserChannels(actor.id);
    const myIds = memberships.map((row) => row.channel.id);
    if (!this.sameSet(myIds, input.channelIds)) {
      return { status: 400, body: failure(ERROR_CODES.VALIDATION_ERROR, "참여 채널 전체 id 순서를 전달해야 합니다") };
    }

    await this.repository.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: "내 채널 순서가 저장되었습니다" }) };
  }
}
