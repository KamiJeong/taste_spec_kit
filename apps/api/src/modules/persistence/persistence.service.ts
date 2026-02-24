import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  auditLogsTable,
  passwordResetTokensTable,
  usersTable,
  verificationTokensTable,
  type AuditLogRow,
  type PasswordResetTokenRow,
  type UserRow,
  type VerificationTokenRow
} from "./schema";

type PersistenceSchema = {
  usersTable: typeof usersTable;
  verificationTokensTable: typeof verificationTokensTable;
  passwordResetTokensTable: typeof passwordResetTokensTable;
  auditLogsTable: typeof auditLogsTable;
};

@Injectable()
export class PersistenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PersistenceService.name);
  private readonly allowInMemoryFallback = process.env.ALLOW_INMEMORY_FALLBACK === "true";
  private readonly usersById = new Map<string, UserRow>();
  private readonly usersByEmail = new Map<string, UserRow>();
  private readonly verificationTokens = new Map<string, VerificationTokenRow>();
  private readonly passwordResetTokens = new Map<string, PasswordResetTokenRow>();
  private readonly auditLogs: AuditLogRow[] = [];

  private readonly databaseUrl = process.env.DATABASE_URL;
  private pool: Pool | null = null;
  private db: NodePgDatabase<PersistenceSchema> | null = null;

  async onModuleInit(): Promise<void> {
    if (!this.databaseUrl) {
      if (!this.allowInMemoryFallback) {
        throw new Error("DATABASE_URL is required. In-memory fallback is disabled.");
      }
      this.logger.warn("DATABASE_URL is not set; in-memory fallback enabled by ALLOW_INMEMORY_FALLBACK=true");
      return;
    }
    try {
      this.pool = new Pool({ connectionString: this.databaseUrl });
      this.db = drizzle(this.pool, {
        schema: {
          usersTable,
          verificationTokensTable,
          passwordResetTokensTable,
          auditLogsTable
        }
      });
    } catch (error) {
      if (!this.allowInMemoryFallback) {
        throw error;
      }
      this.logger.warn("PostgreSQL connection failed; in-memory fallback enabled by ALLOW_INMEMORY_FALLBACK=true");
      this.db = null;
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async findUserById(userId: string): Promise<UserRow | null> {
    if (!this.db) {
      return this.usersById.get(userId) ?? null;
    }
    const row = await this.db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId)
    });
    return row ?? null;
  }

  async findUserByEmail(email: string): Promise<UserRow | null> {
    if (!this.db) {
      return this.usersByEmail.get(email) ?? null;
    }
    const row = await this.db.query.usersTable.findFirst({
      where: eq(usersTable.email, email)
    });
    return row ?? null;
  }

  async createUser(input: UserRow): Promise<void> {
    if (!this.db) {
      this.usersById.set(input.id, input);
      this.usersByEmail.set(input.email, input);
      return;
    }
    await this.db.insert(usersTable).values(input);
  }

  async updateUser(input: UserRow): Promise<void> {
    if (!this.db) {
      this.usersById.set(input.id, input);
      this.usersByEmail.set(input.email, input);
      return;
    }
    await this.db
      .update(usersTable)
      .set({
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        emailVerified: input.emailVerified,
        isActive: input.isActive,
        failedLoginAttempts: input.failedLoginAttempts,
        lockedUntil: input.lockedUntil,
        deletionScheduledAt: input.deletionScheduledAt
      })
      .where(eq(usersTable.id, input.id));
  }

  async storeVerificationToken(input: VerificationTokenRow): Promise<void> {
    if (!this.db) {
      this.verificationTokens.set(input.tokenHash, input);
      return;
    }
    await this.db.insert(verificationTokensTable).values(input);
  }

  async findVerificationToken(tokenHash: string): Promise<VerificationTokenRow | null> {
    if (!this.db) {
      return this.verificationTokens.get(tokenHash) ?? null;
    }
    const row = await this.db.query.verificationTokensTable.findFirst({
      where: eq(verificationTokensTable.tokenHash, tokenHash)
    });
    return row ?? null;
  }

  async markVerificationTokenUsed(tokenHash: string, usedAt: number): Promise<void> {
    if (!this.db) {
      const row = this.verificationTokens.get(tokenHash);
      if (!row) return;
      this.verificationTokens.set(tokenHash, { ...row, usedAt });
      return;
    }
    await this.db
      .update(verificationTokensTable)
      .set({ usedAt })
      .where(and(eq(verificationTokensTable.tokenHash, tokenHash), sql`${verificationTokensTable.usedAt} IS NULL`));
  }

  async expireVerificationTokenForTest(tokenHash: string): Promise<void> {
    const expiresAt = Date.now() - 1;
    if (!this.db) {
      const row = this.verificationTokens.get(tokenHash);
      if (!row) return;
      this.verificationTokens.set(tokenHash, { ...row, expiresAt });
      return;
    }
    await this.db.update(verificationTokensTable).set({ expiresAt }).where(eq(verificationTokensTable.tokenHash, tokenHash));
  }

  async storePasswordResetToken(input: PasswordResetTokenRow): Promise<void> {
    if (!this.db) {
      this.passwordResetTokens.set(input.tokenHash, input);
      return;
    }
    await this.db.insert(passwordResetTokensTable).values(input);
  }

  async findPasswordResetToken(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    if (!this.db) {
      return this.passwordResetTokens.get(tokenHash) ?? null;
    }
    const row = await this.db.query.passwordResetTokensTable.findFirst({
      where: eq(passwordResetTokensTable.tokenHash, tokenHash)
    });
    return row ?? null;
  }

  async markPasswordResetTokenUsed(tokenHash: string, usedAt: number): Promise<void> {
    if (!this.db) {
      const row = this.passwordResetTokens.get(tokenHash);
      if (!row) return;
      this.passwordResetTokens.set(tokenHash, { ...row, usedAt });
      return;
    }
    await this.db
      .update(passwordResetTokensTable)
      .set({ usedAt })
      .where(and(eq(passwordResetTokensTable.tokenHash, tokenHash), sql`${passwordResetTokensTable.usedAt} IS NULL`));
  }

  async expirePasswordResetTokenForTest(tokenHash: string): Promise<void> {
    const expiresAt = Date.now() - 1;
    if (!this.db) {
      const row = this.passwordResetTokens.get(tokenHash);
      if (!row) return;
      this.passwordResetTokens.set(tokenHash, { ...row, expiresAt });
      return;
    }
    await this.db
      .update(passwordResetTokensTable)
      .set({ expiresAt })
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
  }

  async storeAuditLog(input: AuditLogRow): Promise<void> {
    if (!this.db) {
      this.auditLogs.push(input);
      return;
    }
    await this.db.insert(auditLogsTable).values(input);
  }
}
