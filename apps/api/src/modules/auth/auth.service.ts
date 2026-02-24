import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import { ERROR_CODES } from "@packages/contracts-auth";
import { AuditLogService, type AuditContext } from "../audit-log/audit-log.service";
import { MAIL_SERVICE, type MailService } from "../mail/mail.service";
import { PersistenceService } from "../persistence/persistence.service";
import { SessionService } from "../session/session.service";
import { TokenService } from "../token/token.service";
import { failure, success } from "../shared/http-contract";

const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const IDEMPOTENT_COOLDOWN_MS = 60 * 1000;
const LOGIN_RATE_LIMIT_MAX = 10;
const REQUEST_RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

@Injectable()
export class AuthService {
  private readonly resendCooldownByEmail = new Map<string, number>();
  private readonly forgotPasswordCooldownByEmail = new Map<string, number>();
  private readonly rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly persistence: PersistenceService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly auditLogs: AuditLogService,
    @Inject(MAIL_SERVICE) private readonly mailer: MailService,
    @Inject("CONTRACT_RUNTIME") private readonly _contracts: unknown
  ) {}

  private shouldExposeDebugTokens(): boolean {
    return process.env.NODE_ENV === "test" || process.env.MAIL_EXPOSE_TOKENS === "true";
  }

  private isRateLimited(key: string, max: number, windowMs = RATE_LIMIT_WINDOW_MS): boolean {
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

  async signup(input: { email: string; password: string; name?: string | null }, context: AuditContext) {
    const email = input.email.trim().toLowerCase();
    if (await this.persistence.findUserByEmail(email)) {
      await this.auditLogs.record({
        eventType: "AUTH_SIGNUP",
        result: "FAILURE",
        context,
        email,
        reasonCode: ERROR_CODES.USER_EMAIL_ALREADY_EXISTS
      });
      return {
        status: 409,
        body: failure(ERROR_CODES.USER_EMAIL_ALREADY_EXISTS, "이미 가입된 이메일입니다")
      };
    }

    const id = randomUUID();
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = {
      id,
      email,
      passwordHash,
      name: input.name ?? null,
      emailVerified: false,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      deletionScheduledAt: null,
      createdAt: new Date().toISOString()
    };
    await this.persistence.createUser(user);

    const tokenRow = this.tokens.issueVerificationToken();
    await this.persistence.storeVerificationToken({
      tokenHash: tokenRow.tokenHash,
      userId: user.id,
      expiresAt: tokenRow.expiresAt,
      usedAt: null
    });
    await this.mailer.sendVerificationMail({ to: user.email, token: tokenRow.token });
    await this.auditLogs.record({
      eventType: "AUTH_SIGNUP",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });

    return {
      status: 201,
      body: success({
        message: "이메일 인증 링크를 발송했습니다",
        accountState: "PENDING_VERIFICATION",
        ...(this.shouldExposeDebugTokens() ? { verificationToken: tokenRow.token } : {})
      })
    };
  }

  async verifyEmail(input: { token: string }, context: AuditContext) {
    const tokenHash = this.tokens.hashToken(input.token);
    const row = await this.persistence.findVerificationToken(tokenHash);
    if (!row || row.usedAt) {
      await this.auditLogs.record({
        eventType: "AUTH_VERIFY_EMAIL",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_INVALID
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_INVALID, "유효하지 않은 인증 토큰입니다")
      };
    }
    if (row.expiresAt <= Date.now()) {
      await this.auditLogs.record({
        eventType: "AUTH_VERIFY_EMAIL",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_EXPIRED
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_EXPIRED, "인증 링크가 만료되었습니다")
      };
    }
    const user = await this.persistence.findUserById(row.userId);
    if (!user) {
      await this.auditLogs.record({
        eventType: "AUTH_VERIFY_EMAIL",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_INVALID
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_INVALID, "유효하지 않은 인증 토큰입니다")
      };
    }
    await this.persistence.markVerificationTokenUsed(tokenHash, Date.now());
    user.emailVerified = true;
    await this.persistence.updateUser(user);
    await this.auditLogs.record({
      eventType: "AUTH_VERIFY_EMAIL",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });
    return {
      status: 200,
      body: success({ message: "계정이 활성화되었습니다", accountState: "ACTIVE" })
    };
  }

  // Test-only helper to force expiry for integration regression scenarios.
  async expireVerificationTokenForTest(token: string): Promise<void> {
    await this.persistence.expireVerificationTokenForTest(this.tokens.hashToken(token));
  }

  async resendVerification(input: { email: string }, context: AuditContext) {
    const email = input.email.trim().toLowerCase();
    const rateKey = `resend:${context.ip}:${email}`;
    if (this.isRateLimited(rateKey, REQUEST_RATE_LIMIT_MAX)) {
      return {
        status: 429,
        body: failure(ERROR_CODES.RATE_LIMIT_EXCEEDED, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요")
      };
    }
    const now = Date.now();
    const lastRequestedAt = this.resendCooldownByEmail.get(email);
    if (lastRequestedAt && now - lastRequestedAt < IDEMPOTENT_COOLDOWN_MS) {
      return {
        status: 200,
        body: success({ message: "재발송 요청이 접수되었습니다", cooldownActive: true })
      };
    }

    this.resendCooldownByEmail.set(email, now);
    const user = await this.persistence.findUserByEmail(email);
    if (!user || user.emailVerified) {
      return {
        status: 200,
        body: success({ message: "재발송 요청이 접수되었습니다" })
      };
    }
    const tokenRow = this.tokens.issueVerificationToken();
    await this.persistence.storeVerificationToken({
      tokenHash: tokenRow.tokenHash,
      userId: user.id,
      expiresAt: tokenRow.expiresAt,
      usedAt: null
    });
    await this.mailer.sendVerificationMail({ to: user.email, token: tokenRow.token });
    return {
      status: 200,
      body: success({
        message: "재발송 요청이 접수되었습니다",
        ...(this.shouldExposeDebugTokens() ? { verificationToken: tokenRow.token } : {})
      })
    };
  }

  async forgotPassword(input: { email: string }, context: AuditContext) {
    const email = input.email.trim().toLowerCase();
    const rateKey = `forgot:${context.ip}:${email}`;
    if (this.isRateLimited(rateKey, REQUEST_RATE_LIMIT_MAX)) {
      return {
        status: 429,
        body: failure(ERROR_CODES.RATE_LIMIT_EXCEEDED, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요")
      };
    }
    const now = Date.now();
    const lastRequestedAt = this.forgotPasswordCooldownByEmail.get(email);
    if (lastRequestedAt && now - lastRequestedAt < IDEMPOTENT_COOLDOWN_MS) {
      return {
        status: 200,
        body: success({ message: "비밀번호 재설정 링크를 이메일로 발송했습니다", cooldownActive: true })
      };
    }

    this.forgotPasswordCooldownByEmail.set(email, now);
    const user = await this.persistence.findUserByEmail(email);
    if (!user) {
      return {
        status: 200,
        body: success({ message: "비밀번호 재설정 링크를 이메일로 발송했습니다" })
      };
    }

    const tokenRow = this.tokens.issuePasswordResetToken();
    await this.persistence.storePasswordResetToken({
      tokenHash: tokenRow.tokenHash,
      userId: user.id,
      expiresAt: tokenRow.expiresAt,
      usedAt: null
    });
    await this.mailer.sendPasswordResetMail({ to: user.email, token: tokenRow.token });

    return {
      status: 200,
      body: success({
        message: "비밀번호 재설정 링크를 이메일로 발송했습니다",
        ...(this.shouldExposeDebugTokens() ? { resetToken: tokenRow.token } : {})
      })
    };
  }

  async resetPassword(input: { token: string; newPassword: string }, context: AuditContext) {
    const tokenHash = this.tokens.hashToken(input.token);
    const row = await this.persistence.findPasswordResetToken(tokenHash);
    if (!row || row.usedAt) {
      await this.auditLogs.record({
        eventType: "AUTH_RESET_PASSWORD",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_INVALID
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_INVALID, "유효하지 않은 재설정 토큰입니다")
      };
    }
    if (row.expiresAt <= Date.now()) {
      await this.auditLogs.record({
        eventType: "AUTH_RESET_PASSWORD",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_EXPIRED
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_EXPIRED, "재설정 링크가 만료되었습니다")
      };
    }
    const user = await this.persistence.findUserById(row.userId);
    if (!user) {
      await this.auditLogs.record({
        eventType: "AUTH_RESET_PASSWORD",
        result: "FAILURE",
        context,
        reasonCode: ERROR_CODES.AUTH_TOKEN_INVALID
      });
      return {
        status: 400,
        body: failure(ERROR_CODES.AUTH_TOKEN_INVALID, "유효하지 않은 재설정 토큰입니다")
      };
    }

    user.passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.persistence.updateUser(user);
    await this.persistence.markPasswordResetTokenUsed(tokenHash, Date.now());
    await this.auditLogs.record({
      eventType: "AUTH_RESET_PASSWORD",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });

    return {
      status: 200,
      body: success({ message: "비밀번호가 변경되었습니다" })
    };
  }

  // Test-only helper for reset token expiry regression tests.
  async expireResetTokenForTest(token: string): Promise<void> {
    await this.persistence.expirePasswordResetTokenForTest(this.tokens.hashToken(token));
    this.forgotPasswordCooldownByEmail.clear();
  }

  async login(input: { email: string; password: string }, context: AuditContext) {
    const loginEmail = input.email.trim().toLowerCase();
    const rateKey = `login:${context.ip}:${loginEmail}`;
    if (this.isRateLimited(rateKey, LOGIN_RATE_LIMIT_MAX)) {
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
        result: "FAILURE",
        context,
        email: loginEmail,
        reasonCode: ERROR_CODES.RATE_LIMIT_EXCEEDED
      });
      return {
        status: 429,
        body: failure(ERROR_CODES.RATE_LIMIT_EXCEEDED, "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요")
      };
    }
    const user = await this.persistence.findUserByEmail(loginEmail);
    if (!user) {
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
        result: "FAILURE",
        context,
        email: loginEmail,
        reasonCode: ERROR_CODES.AUTH_INVALID_CREDENTIALS
      });
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "이메일 또는 비밀번호가 올바르지 않습니다")
      };
    }
    const now = Date.now();
    if (user.lockedUntil && user.lockedUntil > now) {
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
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
    if (user.lockedUntil && user.lockedUntil <= now) {
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
      await this.persistence.updateUser(user);
    }

    const passwordOk = await argon2.verify(user.passwordHash, input.password);
    if (!passwordOk) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= LOGIN_LOCK_THRESHOLD) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = Date.now() + LOGIN_LOCK_MS;
      }
      await this.persistence.updateUser(user);
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
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

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.persistence.updateUser(user);

    if (!user.emailVerified) {
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
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
    if (!user.isActive) {
      await this.auditLogs.record({
        eventType: "AUTH_LOGIN",
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
    const sid = await this.sessions.create(user.id);
    await this.auditLogs.record({
      eventType: "AUTH_LOGIN",
      result: "SUCCESS",
      context,
      userId: user.id,
      email: user.email
    });
    return {
      status: 200,
      sid,
      csrfToken: randomUUID(),
      body: success({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        }
      })
    };
  }

  async me(input: { sid?: string }) {
    const userId = await this.sessions.getUserId(input.sid);
    if (!userId) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    const user = await this.persistence.findUserById(userId);
    if (!user) {
      return {
        status: 401,
        body: failure(ERROR_CODES.AUTH_SESSION_REQUIRED, "인증이 필요합니다")
      };
    }
    return {
      status: 200,
      body: success({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        }
      })
    };
  }

  async logout(input: { sid?: string }, context: AuditContext) {
    const userId = await this.sessions.getUserId(input.sid);
    const user = userId ? await this.persistence.findUserById(userId) : null;
    await this.sessions.destroy(input.sid);
    await this.auditLogs.record({
      eventType: "AUTH_LOGOUT",
      result: "SUCCESS",
      context,
      userId: user?.id ?? null,
      email: user?.email ?? null
    });
    return {
      status: 200,
      body: success({ message: "로그아웃되었습니다" })
    };
  }
}
