import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../database/database.service";
import { usersTable, type UserRow } from "../persistence/schema";

@Injectable()
export class UserRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserById(userId: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId)
    });
    return row ?? null;
  }

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.email, email)
    });
    return row ?? null;
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
}

