import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { PersistenceService } from "../persistence/persistence.service";
import { SessionService } from "../session/session.service";
import { failure, success } from "../shared/http-contract";

const MAX_OWNED_CHANNELS = 10;
const MAX_JOINED_CHANNELS = 200;

@Injectable()
export class ChannelService {
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

  private sameSet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false;
    const set = new Set(left);
    if (set.size !== right.length) return false;
    for (const value of right) {
      if (!set.has(value)) return false;
    }
    return true;
  }

  async createChannel(input: { sid?: string; name: string }, context: AuditContext) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const owned = await this.persistence.countOwnedChannels(user.id);
    if (owned >= MAX_OWNED_CHANNELS) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_CREATE_LIMIT_REACHED, "채널 생성 한도를 초과했습니다") };
    }

    const now = new Date().toISOString();
    const channelId = randomUUID();
    await this.persistence.createChannel({
      id: channelId,
      name: input.name.trim(),
      ownerUserId: user.id,
      createdAt: now,
      updatedAt: now
    });
    await this.persistence.upsertChannelMember({
      channelId,
      userId: user.id,
      role: "owner",
      joinedAt: now,
      updatedAt: now
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

  async listMyChannels(input: { sid?: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const channels = await this.persistence.listUserChannels(user.id);
    return {
      status: 200,
      body: success({
        channels: channels.map((row) => ({
          id: row.channel.id,
          name: row.channel.name,
          ownerUserId: row.channel.ownerUserId,
          role: row.role,
          sortIndex: row.sortIndex
        }))
      })
    };
  }

  async createJoinRequest(input: { sid?: string; channelId: string }, context: AuditContext) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const channel = await this.persistence.findChannelById(input.channelId);
    if (!channel) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "채널을 찾을 수 없습니다") };
    }

    const membership = await this.persistence.findChannelMember(input.channelId, user.id);
    if (membership) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_ALREADY_MEMBER, "이미 채널 멤버입니다") };
    }

    const joinedCount = await this.persistence.countMemberships(user.id);
    if (joinedCount >= MAX_JOINED_CHANNELS) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED, "가입 가능한 채널 수를 초과했습니다") };
    }

    const pending = await this.persistence.findPendingJoinRequest(input.channelId, user.id);
    if (pending) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_PENDING, "이미 처리 대기 중인 가입 요청이 있습니다") };
    }

    const now = new Date().toISOString();
    await this.persistence.createJoinRequest({
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
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const member = await this.persistence.findChannelMember(input.channelId, user.id);
    if (!member || (member.role !== "owner" && member.role !== "manager")) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const requests = await this.persistence.listPendingJoinRequests(input.channelId);
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember || (actorMember.role !== "owner" && actorMember.role !== "manager")) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const request = await this.persistence.findJoinRequestById(input.requestId);
    if (!request || request.channelId !== input.channelId || request.status !== "pending") {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND, "가입 요청을 찾을 수 없습니다") };
    }

    if (input.decision === "approved") {
      const joinedCount = await this.persistence.countMemberships(request.requesterUserId);
      if (joinedCount >= MAX_JOINED_CHANNELS) {
        return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_LIMIT_REACHED, "대상 사용자의 채널 가입 한도를 초과했습니다") };
      }
    }

    const now = new Date().toISOString();
    const changed = await this.persistence.reviewJoinRequest(request.id, actor.id, input.decision, now);
    if (!changed) {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_JOIN_REQUEST_NOT_FOUND, "이미 처리된 요청입니다") };
    }

    if (input.decision === "approved") {
      await this.persistence.upsertChannelMember({
        channelId: request.channelId,
        userId: request.requesterUserId,
        role: "member",
        joinedAt: now,
        updatedAt: now
      });
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.persistence.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (targetMember.role === "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "owner 권한은 변경할 수 없습니다") };
    }

    await this.persistence.upsertChannelMember({ ...targetMember, role: "manager", updatedAt: new Date().toISOString() });
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.persistence.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember || targetMember.role !== "manager") {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 매니저를 찾을 수 없습니다") };
    }

    await this.persistence.upsertChannelMember({ ...targetMember, role: "member", updatedAt: new Date().toISOString() });
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember || (actorMember.role !== "owner" && actorMember.role !== "manager")) {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }

    const targetMember = await this.persistence.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (targetMember.role === "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "owner는 강퇴할 수 없습니다") };
    }
    if (actorMember.role === "manager" && targetMember.role === "manager") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "manager는 manager를 강퇴할 수 없습니다") };
    }

    await this.persistence.deleteChannelMember(input.channelId, targetMember.userId);
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "참여 중인 채널이 아닙니다") };
    }
    if (actorMember.role === "owner") {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_OWNER_TRANSFER_REQUIRED, "owner는 소유권 이전 후 탈퇴할 수 있습니다") };
    }
    await this.persistence.deleteChannelMember(input.channelId, actor.id);
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }
    const actorMember = await this.persistence.findChannelMember(input.channelId, actor.id);
    if (!actorMember || actorMember.role !== "owner") {
      return { status: 403, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "권한이 없습니다") };
    }
    const targetMember = await this.persistence.findChannelMember(input.channelId, input.targetUserId);
    if (!targetMember) {
      return { status: 404, body: failure(ERROR_CODES.CHANNEL_NOT_FOUND, "대상 멤버를 찾을 수 없습니다") };
    }
    if (targetMember.role === "owner") {
      return { status: 409, body: failure(ERROR_CODES.CHANNEL_PERMISSION_DENIED, "이미 owner입니다") };
    }

    const now = new Date().toISOString();
    await this.persistence.upsertChannelMember({ ...actorMember, role: input.previousOwnerRole, updatedAt: now });
    await this.persistence.upsertChannelMember({ ...targetMember, role: "owner", updatedAt: now });
    await this.persistence.updateChannelOwner(input.channelId, targetMember.userId, now);
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
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const memberships = await this.persistence.listUserChannels(actor.id);
    const ownedIds = memberships.filter((row) => row.role === "owner").map((row) => row.channel.id);
    if (!this.sameSet(ownedIds, input.channelIds)) {
      return { status: 400, body: failure(ERROR_CODES.VALIDATION_ERROR, "소유 채널 전체 id 순서를 전달해야 합니다") };
    }

    await this.persistence.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: "소유 채널 순서가 저장되었습니다" }) };
  }

  async reorderMyChannels(input: { sid?: string; channelIds: string[] }) {
    const actor = await this.resolveUserBySid(input.sid);
    if (!actor) {
      return { status: 401, body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다") };
    }

    const memberships = await this.persistence.listUserChannels(actor.id);
    const myIds = memberships.map((row) => row.channel.id);
    if (!this.sameSet(myIds, input.channelIds)) {
      return { status: 400, body: failure(ERROR_CODES.VALIDATION_ERROR, "참여 채널 전체 id 순서를 전달해야 합니다") };
    }

    await this.persistence.saveUserChannelOrder(actor.id, input.channelIds, new Date().toISOString());
    return { status: 200, body: success({ message: "내 채널 순서가 저장되었습니다" }) };
  }
}
