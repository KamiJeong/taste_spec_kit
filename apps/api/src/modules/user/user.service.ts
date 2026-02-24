import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { PersistenceService } from "../persistence/persistence.service";
import { SessionService } from "../session/session.service";
import { failure, success } from "../shared/http-contract";

@Injectable()
export class UserService {
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

  async getProfile(input: { sid?: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    return {
      status: 200,
      body: success({
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        }
      })
    };
  }

  async patchProfile(input: { sid?: string; name?: string; email?: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }

    if (typeof input.name !== "undefined") {
      user.name = input.name.trim();
    }

    if (typeof input.email !== "undefined") {
      const nextEmail = input.email.trim().toLowerCase();
      const existing = await this.persistence.findUserByEmail(nextEmail);
      if (existing && existing.id !== user.id) {
        return {
          status: 409,
          body: failure(ERROR_CODES.USER_EMAIL_ALREADY_EXISTS, "이미 가입된 이메일입니다")
        };
      }
      if (nextEmail !== user.email) {
        user.email = nextEmail;
        user.emailVerified = false;
      }
    }
    await this.persistence.updateUser(user);

    return {
      status: 200,
      body: success({
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        }
      })
    };
  }

  async changePassword(input: { sid?: string; currentPassword: string; newPassword: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    const ok = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!ok) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "이메일 또는 비밀번호가 올바르지 않습니다")
      };
    }
    user.passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.persistence.updateUser(user);
    return {
      status: 200,
      body: success({ message: "비밀번호가 변경되었습니다" })
    };
  }

  async deactivate(input: { sid?: string; password: string }, context: AuditContext) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      await this.auditLogs.record({
        eventType: "USER_DEACTIVATE",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_SESSION_REQUIRED
      });
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      await this.auditLogs.record({
        eventType: "USER_DEACTIVATE",
        result: "FAILURE",
        context,
        userId: user.id,
        email: user.email,
        reasonCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS
      });
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "이메일 또는 비밀번호가 올바르지 않습니다")
      };
    }
    user.isActive = false;
    await this.persistence.updateUser(user);
    await this.sessions.destroyAllForUser(user.id);
    await this.auditLogs.record({
      eventType: "USER_DEACTIVATE",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });
    return {
      status: 200,
      body: success({
        message: "계정이 비활성화되었습니다",
        accountState: "DEACTIVATED"
      })
    };
  }

  async requestDeletion(input: { sid?: string; password: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    if (!user.isActive) {
      return {
        status: 403,
        body: failure(ERROR_CODES.USER_ACCOUNT_DEACTIVATED, "비활성화된 계정입니다")
      };
    }
    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "이메일 또는 비밀번호가 올바르지 않습니다")
      };
    }

    const now = new Date();
    const scheduledDeletionAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    user.deletionScheduledAt = scheduledDeletionAt;
    await this.persistence.updateUser(user);

    return {
      status: 200,
      body: success({
        message: "계정 삭제가 예약되었습니다",
        accountState: "DELETION_SCHEDULED",
        scheduledDeletionAt
      })
    };
  }

  async cancelDeletion(input: { sid?: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    if (!user.isActive) {
      return {
        status: 403,
        body: failure(ERROR_CODES.USER_ACCOUNT_DEACTIVATED, "비활성화된 계정입니다")
      };
    }
    user.deletionScheduledAt = null;
    await this.persistence.updateUser(user);

    return {
      status: 200,
      body: success({
        message: "계정 삭제 예약이 취소되었습니다",
        accountState: "ACTIVE"
      })
    };
  }
}
