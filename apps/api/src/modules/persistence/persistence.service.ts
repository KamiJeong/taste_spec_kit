import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  auditLogsTable,
  channelJoinRequestsTable,
  channelMembersTable,
  channelPostsTable,
  channelsTable,
  passwordResetTokensTable,
  userChannelOrdersTable,
  usersTable,
  verificationTokensTable,
  type AuditLogRow,
  type ChannelJoinRequestRow,
  type ChannelMemberRow,
  type ChannelPostRow,
  type ChannelRow,
  type PasswordResetTokenRow,
  type UserRow,
  type UserChannelOrderRow,
  type VerificationTokenRow
} from "./schema";

type PersistenceSchema = {
  usersTable: typeof usersTable;
  verificationTokensTable: typeof verificationTokensTable;
  passwordResetTokensTable: typeof passwordResetTokensTable;
  auditLogsTable: typeof auditLogsTable;
  channelsTable: typeof channelsTable;
  channelMembersTable: typeof channelMembersTable;
  channelJoinRequestsTable: typeof channelJoinRequestsTable;
  userChannelOrdersTable: typeof userChannelOrdersTable;
  channelPostsTable: typeof channelPostsTable;
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
  private readonly channelsById = new Map<string, ChannelRow>();
  private readonly channelMembers = new Map<string, ChannelMemberRow>();
  private readonly channelJoinRequestsById = new Map<string, ChannelJoinRequestRow>();
  private readonly userChannelOrders = new Map<string, UserChannelOrderRow>();
  private readonly channelPostsById = new Map<string, ChannelPostRow>();

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
          auditLogsTable,
          channelsTable,
          channelMembersTable,
          channelJoinRequestsTable,
          userChannelOrdersTable,
          channelPostsTable
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
      const previous = this.usersById.get(input.id);
      if (previous && previous.email !== input.email) {
        this.usersByEmail.delete(previous.email);
      }
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

  private channelMemberKey(channelId: string, userId: string): string {
    return `${channelId}:${userId}`;
  }

  private userChannelOrderKey(userId: string, channelId: string): string {
    return `${userId}:${channelId}`;
  }

  async countOwnedChannels(userId: string): Promise<number> {
    if (!this.db) {
      let count = 0;
      for (const channel of this.channelsById.values()) {
        if (channel.ownerUserId === userId) count += 1;
      }
      return count;
    }
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(channelsTable)
      .where(eq(channelsTable.ownerUserId, userId));
    return rows[0]?.count ?? 0;
  }

  async countMemberships(userId: string): Promise<number> {
    if (!this.db) {
      let count = 0;
      for (const member of this.channelMembers.values()) {
        if (member.userId === userId) count += 1;
      }
      return count;
    }
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(channelMembersTable)
      .where(eq(channelMembersTable.userId, userId));
    return rows[0]?.count ?? 0;
  }

  async createChannel(input: ChannelRow): Promise<void> {
    if (!this.db) {
      this.channelsById.set(input.id, input);
      return;
    }
    await this.db.insert(channelsTable).values(input);
  }

  async updateChannelOwner(channelId: string, ownerUserId: string, updatedAt: string): Promise<void> {
    if (!this.db) {
      const row = this.channelsById.get(channelId);
      if (!row) return;
      this.channelsById.set(channelId, { ...row, ownerUserId, updatedAt });
      return;
    }
    await this.db.update(channelsTable).set({ ownerUserId, updatedAt }).where(eq(channelsTable.id, channelId));
  }

  async findChannelById(channelId: string): Promise<ChannelRow | null> {
    if (!this.db) return this.channelsById.get(channelId) ?? null;
    const row = await this.db.query.channelsTable.findFirst({ where: eq(channelsTable.id, channelId) });
    return row ?? null;
  }

  async upsertChannelMember(input: ChannelMemberRow): Promise<void> {
    if (!this.db) {
      this.channelMembers.set(this.channelMemberKey(input.channelId, input.userId), input);
      return;
    }
    await this.db
      .insert(channelMembersTable)
      .values(input)
      .onConflictDoUpdate({
        target: [channelMembersTable.channelId, channelMembersTable.userId],
        set: { role: input.role, updatedAt: input.updatedAt }
      });
  }

  async findChannelMember(channelId: string, userId: string): Promise<ChannelMemberRow | null> {
    if (!this.db) return this.channelMembers.get(this.channelMemberKey(channelId, userId)) ?? null;
    const row = await this.db.query.channelMembersTable.findFirst({
      where: and(eq(channelMembersTable.channelId, channelId), eq(channelMembersTable.userId, userId))
    });
    return row ?? null;
  }

  async deleteChannelMember(channelId: string, userId: string): Promise<void> {
    if (!this.db) {
      this.channelMembers.delete(this.channelMemberKey(channelId, userId));
      return;
    }
    await this.db
      .delete(channelMembersTable)
      .where(and(eq(channelMembersTable.channelId, channelId), eq(channelMembersTable.userId, userId)));
  }

  async listUserChannels(userId: string): Promise<Array<{ channel: ChannelRow; role: ChannelMemberRow["role"]; sortIndex: number | null }>> {
    if (!this.db) {
      const rows: Array<{ channel: ChannelRow; role: ChannelMemberRow["role"]; sortIndex: number | null }> = [];
      for (const member of this.channelMembers.values()) {
        if (member.userId !== userId) continue;
        const channel = this.channelsById.get(member.channelId);
        if (!channel) continue;
        const order = this.userChannelOrders.get(this.userChannelOrderKey(userId, member.channelId));
        rows.push({ channel, role: member.role, sortIndex: order?.sortIndex ?? null });
      }
      rows.sort((a, b) => {
        if (a.sortIndex === null && b.sortIndex === null) return a.channel.createdAt.localeCompare(b.channel.createdAt);
        if (a.sortIndex === null) return 1;
        if (b.sortIndex === null) return -1;
        return a.sortIndex - b.sortIndex;
      });
      return rows;
    }

    const rows = await this.db
      .select({
        channel: channelsTable,
        role: channelMembersTable.role,
        sortIndex: userChannelOrdersTable.sortIndex
      })
      .from(channelMembersTable)
      .innerJoin(channelsTable, eq(channelMembersTable.channelId, channelsTable.id))
      .leftJoin(
        userChannelOrdersTable,
        and(
          eq(userChannelOrdersTable.channelId, channelsTable.id),
          eq(userChannelOrdersTable.userId, channelMembersTable.userId)
        )
      )
      .where(eq(channelMembersTable.userId, userId))
      .orderBy(userChannelOrdersTable.sortIndex, channelsTable.createdAt);

    return rows.map((row) => ({ channel: row.channel, role: row.role, sortIndex: row.sortIndex ?? null }));
  }

  async createJoinRequest(input: ChannelJoinRequestRow): Promise<void> {
    if (!this.db) {
      this.channelJoinRequestsById.set(input.id, input);
      return;
    }
    await this.db.insert(channelJoinRequestsTable).values(input);
  }

  async findPendingJoinRequest(channelId: string, requesterUserId: string): Promise<ChannelJoinRequestRow | null> {
    if (!this.db) {
      for (const row of this.channelJoinRequestsById.values()) {
        if (row.channelId === channelId && row.requesterUserId === requesterUserId && row.status === "pending") return row;
      }
      return null;
    }
    const row = await this.db.query.channelJoinRequestsTable.findFirst({
      where: and(
        eq(channelJoinRequestsTable.channelId, channelId),
        eq(channelJoinRequestsTable.requesterUserId, requesterUserId),
        eq(channelJoinRequestsTable.status, "pending")
      )
    });
    return row ?? null;
  }

  async findJoinRequestById(id: string): Promise<ChannelJoinRequestRow | null> {
    if (!this.db) return this.channelJoinRequestsById.get(id) ?? null;
    const row = await this.db.query.channelJoinRequestsTable.findFirst({ where: eq(channelJoinRequestsTable.id, id) });
    return row ?? null;
  }

  async listPendingJoinRequests(channelId: string): Promise<ChannelJoinRequestRow[]> {
    if (!this.db) {
      return [...this.channelJoinRequestsById.values()]
        .filter((row) => row.channelId === channelId && row.status === "pending")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return this.db.query.channelJoinRequestsTable.findMany({
      where: and(eq(channelJoinRequestsTable.channelId, channelId), eq(channelJoinRequestsTable.status, "pending")),
      orderBy: channelJoinRequestsTable.createdAt
    });
  }

  async reviewJoinRequest(id: string, reviewedByUserId: string, decision: "approved" | "rejected", reviewedAt: string): Promise<boolean> {
    if (!this.db) {
      const row = this.channelJoinRequestsById.get(id);
      if (!row || row.status !== "pending") return false;
      this.channelJoinRequestsById.set(id, {
        ...row,
        status: decision,
        reviewedByUserId,
        reviewedAt,
        updatedAt: reviewedAt
      });
      return true;
    }

    const result = await this.db
      .update(channelJoinRequestsTable)
      .set({
        status: decision,
        reviewedByUserId,
        reviewedAt,
        updatedAt: reviewedAt
      })
      .where(and(eq(channelJoinRequestsTable.id, id), eq(channelJoinRequestsTable.status, "pending")));
    return (result.rowCount ?? 0) > 0;
  }

  async createChannelPost(input: ChannelPostRow): Promise<void> {
    if (!this.db) {
      this.channelPostsById.set(input.id, input);
      return;
    }
    await this.db.insert(channelPostsTable).values(input);
  }

  async findChannelPostById(channelId: string, postId: string): Promise<ChannelPostRow | null> {
    if (!this.db) {
      const row = this.channelPostsById.get(postId);
      if (!row || row.channelId !== channelId || row.deletedAt) return null;
      return row;
    }
    const row = await this.db.query.channelPostsTable.findFirst({
      where: and(
        eq(channelPostsTable.id, postId),
        eq(channelPostsTable.channelId, channelId),
        isNull(channelPostsTable.deletedAt)
      )
    });
    return row ?? null;
  }

  async listChannelPosts(input: {
    channelId: string;
    limit: number;
    cursor?: { createdAt: string; id: string };
  }): Promise<ChannelPostRow[]> {
    if (!this.db) {
      const rows = [...this.channelPostsById.values()]
        .filter((row) => row.channelId === input.channelId && row.deletedAt === null)
        .sort((a, b) => {
          if (a.createdAt === b.createdAt) return b.id.localeCompare(a.id);
          return b.createdAt.localeCompare(a.createdAt);
        });
      if (!input.cursor) return rows.slice(0, input.limit + 1);
      const filtered = rows.filter((row) => {
        if (row.createdAt < input.cursor!.createdAt) return true;
        if (row.createdAt === input.cursor!.createdAt && row.id < input.cursor!.id) return true;
        return false;
      });
      return filtered.slice(0, input.limit + 1);
    }

    const where = input.cursor
      ? and(
          eq(channelPostsTable.channelId, input.channelId),
          isNull(channelPostsTable.deletedAt),
          or(
            lt(channelPostsTable.createdAt, input.cursor.createdAt),
            and(eq(channelPostsTable.createdAt, input.cursor.createdAt), lt(channelPostsTable.id, input.cursor.id))
          )
        )
      : and(eq(channelPostsTable.channelId, input.channelId), isNull(channelPostsTable.deletedAt));

    return this.db.query.channelPostsTable.findMany({
      where,
      orderBy: [desc(channelPostsTable.createdAt), desc(channelPostsTable.id)],
      limit: input.limit + 1
    });
  }

  async updateChannelPost(input: {
    channelId: string;
    postId: string;
    title?: string;
    content?: string;
    ifUpdatedAt: string;
    updatedAt: string;
  }): Promise<{ state: "updated"; post: ChannelPostRow } | { state: "not_found" } | { state: "conflict" }> {
    if (!this.db) {
      const row = this.channelPostsById.get(input.postId);
      if (!row || row.channelId !== input.channelId || row.deletedAt !== null) return { state: "not_found" };
      if (row.updatedAt !== input.ifUpdatedAt) return { state: "conflict" };
      const next: ChannelPostRow = {
        ...row,
        title: input.title ?? row.title,
        content: input.content ?? row.content,
        updatedAt: input.updatedAt
      };
      this.channelPostsById.set(input.postId, next);
      return { state: "updated", post: next };
    }

    const current = await this.db.query.channelPostsTable.findFirst({
      where: and(
        eq(channelPostsTable.id, input.postId),
        eq(channelPostsTable.channelId, input.channelId),
        isNull(channelPostsTable.deletedAt)
      )
    });
    if (!current) return { state: "not_found" };
    if (current.updatedAt !== input.ifUpdatedAt) return { state: "conflict" };

    const result = await this.db
      .update(channelPostsTable)
      .set({
        title: input.title ?? current.title,
        content: input.content ?? current.content,
        updatedAt: input.updatedAt
      })
      .where(
        and(
          eq(channelPostsTable.id, input.postId),
          eq(channelPostsTable.channelId, input.channelId),
          eq(channelPostsTable.updatedAt, input.ifUpdatedAt),
          isNull(channelPostsTable.deletedAt)
        )
      )
      .returning();
    if (!result[0]) return { state: "conflict" };
    return { state: "updated", post: result[0] };
  }

  async softDeleteChannelPost(channelId: string, postId: string, updatedAt: string): Promise<boolean> {
    if (!this.db) {
      const row = this.channelPostsById.get(postId);
      if (!row || row.channelId !== channelId || row.deletedAt !== null) return false;
      this.channelPostsById.set(postId, { ...row, deletedAt: updatedAt, updatedAt });
      return true;
    }

    const result = await this.db
      .update(channelPostsTable)
      .set({ deletedAt: updatedAt, updatedAt })
      .where(and(eq(channelPostsTable.id, postId), eq(channelPostsTable.channelId, channelId), isNull(channelPostsTable.deletedAt)));
    return (result.rowCount ?? 0) > 0;
  }

  async saveUserChannelOrder(userId: string, orderedChannelIds: string[], updatedAt: string): Promise<void> {
    if (!this.db) {
      orderedChannelIds.forEach((channelId, idx) => {
        this.userChannelOrders.set(this.userChannelOrderKey(userId, channelId), {
          userId,
          channelId,
          sortIndex: idx,
          updatedAt
        });
      });
      return;
    }

    await this.db.transaction(async (tx) => {
      for (let idx = 0; idx < orderedChannelIds.length; idx += 1) {
        const channelId = orderedChannelIds[idx]!;
        await tx
          .insert(userChannelOrdersTable)
          .values({ userId, channelId, sortIndex: idx, updatedAt })
          .onConflictDoUpdate({
            target: [userChannelOrdersTable.userId, userChannelOrdersTable.channelId],
            set: { sortIndex: idx, updatedAt }
          });
      }
    });
  }
}
