import { Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DatabaseService } from "../database/database.service";
import {
  passwordResetTokensTable,
  usersTable,
  verificationTokensTable,
  type PasswordResetTokenRow,
  type UserRow,
  type VerificationTokenRow
} from "../persistence/schema";

@Injectable()
export class AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.email, email)
    });
    return row ?? null;
  }

  async findUserById(userId: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId)
    });
    return row ?? null;
  }

  async createUser(input: UserRow): Promise<void> {
    await this.database.db.insert(usersTable).values(input);
  }

  async updateUser(input: UserRow): Promise<void> {
    await this.database.db
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
    await this.database.db.insert(verificationTokensTable).values(input);
  }

  async findVerificationToken(tokenHash: string): Promise<VerificationTokenRow | null> {
    const row = await this.database.db.query.verificationTokensTable.findFirst({
      where: eq(verificationTokensTable.tokenHash, tokenHash)
    });
    return row ?? null;
  }

  async markVerificationTokenUsed(tokenHash: string, usedAt: number): Promise<void> {
    await this.database.db
      .update(verificationTokensTable)
      .set({ usedAt })
      .where(and(eq(verificationTokensTable.tokenHash, tokenHash), sql`${verificationTokensTable.usedAt} IS NULL`));
  }

  async expireVerificationTokenForTest(tokenHash: string): Promise<void> {
    const expiresAt = Date.now() - 1;
    await this.database.db
      .update(verificationTokensTable)
      .set({ expiresAt })
      .where(eq(verificationTokensTable.tokenHash, tokenHash));
  }

  async storePasswordResetToken(input: PasswordResetTokenRow): Promise<void> {
    await this.database.db.insert(passwordResetTokensTable).values(input);
  }

  async findPasswordResetToken(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    const row = await this.database.db.query.passwordResetTokensTable.findFirst({
      where: eq(passwordResetTokensTable.tokenHash, tokenHash)
    });
    return row ?? null;
  }

  async markPasswordResetTokenUsed(tokenHash: string, usedAt: number): Promise<void> {
    await this.database.db
      .update(passwordResetTokensTable)
      .set({ usedAt })
      .where(and(eq(passwordResetTokensTable.tokenHash, tokenHash), sql`${passwordResetTokensTable.usedAt} IS NULL`));
  }

  async expirePasswordResetTokenForTest(tokenHash: string): Promise<void> {
    const expiresAt = Date.now() - 1;
    await this.database.db
      .update(passwordResetTokensTable)
      .set({ expiresAt })
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
  }
}

