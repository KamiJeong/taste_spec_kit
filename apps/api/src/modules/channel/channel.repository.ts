import { Injectable } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DatabaseService } from "../database/database.service";
import {
  channelJoinRequestsTable,
  channelMembersTable,
  channelsTable,
  userChannelOrdersTable,
  usersTable,
  type ChannelJoinRequestRow,
  type ChannelMemberRow,
  type ChannelRow,
  type UserRow
} from "../persistence/schema";

export interface ChannelPublicUser {
  id: string;
  email: string;
  name: string | null;
}

@Injectable()
export class ChannelRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserById(userId: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId)
    });
    return row ?? null;
  }

  async countOwnedChannels(userId: string): Promise<number> {
    const rows = await this.database.db
      .select({ count: sql<number>`count(*)::int` })
      .from(channelsTable)
      .where(eq(channelsTable.ownerUserId, userId));
    return rows[0]?.count ?? 0;
  }

  async createChannelWithOwner(input: { channel: ChannelRow; ownerMember: ChannelMemberRow }): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      await tx.insert(channelsTable).values(input.channel);
      await tx.insert(channelMembersTable).values(input.ownerMember);
    });
  }

  async listUserChannels(userId: string): Promise<Array<{ channel: ChannelRow; role: ChannelMemberRow["role"]; sortIndex: number | null }>> {
    const memberships = await this.database.db.query.channelMembersTable.findMany({
      where: eq(channelMembersTable.userId, userId),
      columns: { channelId: true, role: true }
    });
    if (memberships.length === 0) return [];

    const channelIds = [...new Set(memberships.map((row) => row.channelId))];
    const channels = await this.database.db.query.channelsTable.findMany({
      where: inArray(channelsTable.id, channelIds)
    });
    const channelsById = new Map(channels.map((row) => [row.id, row] as const));

    const orders = await this.database.db.query.userChannelOrdersTable.findMany({
      where: eq(userChannelOrdersTable.userId, userId),
      columns: { channelId: true, sortIndex: true }
    });
    const sortIndexByChannelId = new Map(orders.map((row) => [row.channelId, row.sortIndex] as const));

    const rows: Array<{ channel: ChannelRow; role: ChannelMemberRow["role"]; sortIndex: number | null }> = [];
    for (const member of memberships) {
      const channel = channelsById.get(member.channelId);
      if (!channel) continue;
      rows.push({
        channel,
        role: member.role,
        sortIndex: sortIndexByChannelId.get(member.channelId) ?? null
      });
    }

    rows.sort((a, b) => {
      if (a.sortIndex === null && b.sortIndex === null) return a.channel.createdAt.localeCompare(b.channel.createdAt);
      if (a.sortIndex === null) return 1;
      if (b.sortIndex === null) return -1;
      return a.sortIndex - b.sortIndex;
    });

    return rows;
  }

  async listChannelMembersWithUsers(
    channelIds: string[]
  ): Promise<Array<{ channelId: string; role: ChannelMemberRow["role"]; joinedAt: string; updatedAt: string; user: ChannelPublicUser }>> {
    if (channelIds.length === 0) return [];

    const members = await this.database.db.query.channelMembersTable.findMany({
      where: inArray(channelMembersTable.channelId, channelIds),
      columns: { channelId: true, userId: true, role: true, joinedAt: true, updatedAt: true }
    });
    if (members.length === 0) return [];

    const userIds = [...new Set(members.map((row) => row.userId))];
    const users = await this.database.db.query.usersTable.findMany({
      where: inArray(usersTable.id, userIds),
      columns: { id: true, email: true, name: true }
    });
    const usersById = new Map(users.map((row) => [row.id, row] as const));

    const rows: Array<{ channelId: string; role: ChannelMemberRow["role"]; joinedAt: string; updatedAt: string; user: ChannelPublicUser }> = [];
    for (const member of members) {
      const user = usersById.get(member.userId);
      if (!user) continue;
      rows.push({
        channelId: member.channelId,
        role: member.role,
        joinedAt: member.joinedAt,
        updatedAt: member.updatedAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? null
        }
      });
    }
    return rows;
  }

  async findChannelById(channelId: string): Promise<ChannelRow | null> {
    const row = await this.database.db.query.channelsTable.findFirst({
      where: eq(channelsTable.id, channelId)
    });
    return row ?? null;
  }

  async findChannelMember(channelId: string, userId: string): Promise<ChannelMemberRow | null> {
    const row = await this.database.db.query.channelMembersTable.findFirst({
      where: and(eq(channelMembersTable.channelId, channelId), eq(channelMembersTable.userId, userId))
    });
    return row ?? null;
  }

  async countMemberships(userId: string): Promise<number> {
    const rows = await this.database.db
      .select({ count: sql<number>`count(*)::int` })
      .from(channelMembersTable)
      .where(eq(channelMembersTable.userId, userId));
    return rows[0]?.count ?? 0;
  }

  async findPendingJoinRequest(channelId: string, requesterUserId: string): Promise<ChannelJoinRequestRow | null> {
    const row = await this.database.db.query.channelJoinRequestsTable.findFirst({
      where: and(
        eq(channelJoinRequestsTable.channelId, channelId),
        eq(channelJoinRequestsTable.requesterUserId, requesterUserId),
        eq(channelJoinRequestsTable.status, "pending")
      )
    });
    return row ?? null;
  }

  async createJoinRequest(input: ChannelJoinRequestRow): Promise<void> {
    await this.database.db.insert(channelJoinRequestsTable).values(input);
  }

  listPendingJoinRequests(channelId: string): Promise<ChannelJoinRequestRow[]> {
    return this.database.db.query.channelJoinRequestsTable.findMany({
      where: and(eq(channelJoinRequestsTable.channelId, channelId), eq(channelJoinRequestsTable.status, "pending")),
      orderBy: channelJoinRequestsTable.createdAt
    });
  }

  async findJoinRequestById(id: string): Promise<ChannelJoinRequestRow | null> {
    const row = await this.database.db.query.channelJoinRequestsTable.findFirst({
      where: eq(channelJoinRequestsTable.id, id)
    });
    return row ?? null;
  }

  async reviewJoinRequestAndMaybeAddMember(input: {
    requestId: string;
    reviewedByUserId: string;
    decision: "approved" | "rejected";
    reviewedAt: string;
    approvedMember?: ChannelMemberRow;
  }): Promise<boolean> {
    return this.database.db.transaction(async (tx) => {
      const updated = await tx
        .update(channelJoinRequestsTable)
        .set({
          status: input.decision,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: input.reviewedAt,
          updatedAt: input.reviewedAt
        })
        .where(and(eq(channelJoinRequestsTable.id, input.requestId), eq(channelJoinRequestsTable.status, "pending")));
      const changed = (updated.rowCount ?? 0) > 0;
      if (!changed) return false;
      if (input.decision === "approved" && input.approvedMember) {
        await tx
          .insert(channelMembersTable)
          .values(input.approvedMember)
          .onConflictDoUpdate({
            target: [channelMembersTable.channelId, channelMembersTable.userId],
            set: { role: input.approvedMember.role, updatedAt: input.approvedMember.updatedAt }
          });
      }
      return true;
    });
  }

  async upsertChannelMember(input: ChannelMemberRow): Promise<void> {
    await this.database.db
      .insert(channelMembersTable)
      .values(input)
      .onConflictDoUpdate({
        target: [channelMembersTable.channelId, channelMembersTable.userId],
        set: { role: input.role, updatedAt: input.updatedAt }
      });
  }

  async deleteChannelMember(channelId: string, userId: string): Promise<void> {
    await this.database.db
      .delete(channelMembersTable)
      .where(and(eq(channelMembersTable.channelId, channelId), eq(channelMembersTable.userId, userId)));
  }

  async transferOwnership(input: {
    channelId: string;
    previousOwnerMember: ChannelMemberRow;
    newOwnerMember: ChannelMemberRow;
    previousOwnerNextRole: "manager" | "member";
    updatedAt: string;
  }): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      await tx
        .insert(channelMembersTable)
        .values({
          ...input.previousOwnerMember,
          role: input.previousOwnerNextRole,
          updatedAt: input.updatedAt
        })
        .onConflictDoUpdate({
          target: [channelMembersTable.channelId, channelMembersTable.userId],
          set: { role: input.previousOwnerNextRole, updatedAt: input.updatedAt }
        });

      await tx
        .insert(channelMembersTable)
        .values({
          ...input.newOwnerMember,
          role: "owner",
          updatedAt: input.updatedAt
        })
        .onConflictDoUpdate({
          target: [channelMembersTable.channelId, channelMembersTable.userId],
          set: { role: "owner", updatedAt: input.updatedAt }
        });

      await tx
        .update(channelsTable)
        .set({ ownerUserId: input.newOwnerMember.userId, updatedAt: input.updatedAt })
        .where(eq(channelsTable.id, input.channelId));
    });
  }

  async saveUserChannelOrder(userId: string, orderedChannelIds: string[], updatedAt: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
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
