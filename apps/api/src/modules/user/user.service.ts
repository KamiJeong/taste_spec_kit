import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { SessionService } from "../session/session.service";
import { fail } from "../shared/fail";
import { success } from "../shared/http-contract";
import { SUCCESS_CODES } from "../shared/success-codes";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly sessions: SessionService,
    private readonly auditLogs: AuditLogService,
    @Inject("CONTRACT_RUNTIME") private readonly _contracts: unknown
  ) {}

  private async resolveUserBySid(sid?: string) {
    const userId = await this.sessions.getUserId(sid);
    if (!userId) return null;
    return this.repository.findUserById(userId);
  }

  async getProfile(input: { sid?: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
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
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
      };
    }

    if (typeof input.name !== "undefined") {
      user.name = input.name.trim();
    }

    if (typeof input.email !== "undefined") {
      const nextEmail = input.email.trim().toLowerCase();
      const existing = await this.repository.findUserByEmail(nextEmail);
      if (existing && existing.id !== user.id) {
        return {
          status: 409,
          body: fail(ERROR_CODES.USER_EMAIL_ALREADY_EXISTS)
        };
      }
      if (nextEmail !== user.email) {
        user.email = nextEmail;
        user.emailVerified = false;
      }
    }
    await this.repository.updateUser(user);

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
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
      };
    }
    const ok = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!ok) {
      return {
        status: 401,
        body: fail(ERROR_CODES.AUTH_INVALID_CREDENTIALS)
      };
    }
    user.passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.repository.updateUser(user);
    return {
      status: 200,
      body: success({ message: SUCCESS_CODES.AUTH_PASSWORD_CHANGED })
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
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
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
        body: fail(ERROR_CODES.AUTH_INVALID_CREDENTIALS)
      };
    }
    user.isActive = false;
    await this.repository.updateUser(user);
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
        message: SUCCESS_CODES.USER_ACCOUNT_DEACTIVATED,
        accountState: "DEACTIVATED"
      })
    };
  }

  async requestDeletion(input: { sid?: string; password: string }) {
    const user = await this.resolveUserBySid(input.sid);
    if (!user) {
      return {
        status: 401,
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
      };
    }
    if (!user.isActive) {
      return {
        status: 403,
        body: fail(ERROR_CODES.USER_ACCOUNT_DEACTIVATED)
      };
    }
    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) {
      return {
        status: 401,
        body: fail(ERROR_CODES.AUTH_INVALID_CREDENTIALS)
      };
    }

    const now = new Date();
    const scheduledDeletionAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    user.deletionScheduledAt = scheduledDeletionAt;
    await this.repository.updateUser(user);

    return {
      status: 200,
      body: success({
        message: SUCCESS_CODES.USER_DELETION_SCHEDULED,
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
        body: fail(ERROR_CODES.AUTH_SESSION_REQUIRED)
      };
    }
    if (!user.isActive) {
      return {
        status: 403,
        body: fail(ERROR_CODES.USER_ACCOUNT_DEACTIVATED)
      };
    }
    user.deletionScheduledAt = null;
    await this.repository.updateUser(user);

    return {
      status: 200,
      body: success({
        message: SUCCESS_CODES.USER_DELETION_CANCELED,
        accountState: "ACTIVE"
      })
    };
  }
}
