import { Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { DatabaseService } from "../database/database.service";
import { channelMembersTable, channelPostsTable, channelsTable, usersTable, type ChannelPostRow, type UserRow } from "../persistence/schema";

@Injectable()
export class ChannelPostRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserById(userId: string): Promise<UserRow | null> {
    const row = await this.database.db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId)
    });
    return row ?? null;
  }

  async findChannelById(channelId: string) {
    const row = await this.database.db.query.channelsTable.findFirst({
      where: eq(channelsTable.id, channelId)
    });
    return row ?? null;
  }

  async findChannelMember(channelId: string, userId: string) {
    const row = await this.database.db.query.channelMembersTable.findFirst({
      where: and(eq(channelMembersTable.channelId, channelId), eq(channelMembersTable.userId, userId))
    });
    return row ?? null;
  }

  async createChannelPost(input: ChannelPostRow): Promise<void> {
    await this.database.db.insert(channelPostsTable).values(input);
  }

  async listChannelPosts(input: { channelId: string; limit: number; cursor?: { createdAt: string; id: string } }): Promise<ChannelPostRow[]> {
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

    return this.database.db.query.channelPostsTable.findMany({
      where,
      orderBy: [desc(channelPostsTable.createdAt), desc(channelPostsTable.id)],
      limit: input.limit + 1
    });
  }

  async findChannelPostById(channelId: string, postId: string): Promise<ChannelPostRow | null> {
    const row = await this.database.db.query.channelPostsTable.findFirst({
      where: and(eq(channelPostsTable.id, postId), eq(channelPostsTable.channelId, channelId), isNull(channelPostsTable.deletedAt))
    });
    return row ?? null;
  }

  async updateChannelPost(input: {
    channelId: string;
    postId: string;
    title?: string;
    content?: string;
    ifUpdatedAt: string;
    updatedAt: string;
  }): Promise<{ state: "updated"; post: ChannelPostRow } | { state: "not_found" } | { state: "conflict" }> {
    const current = await this.database.db.query.channelPostsTable.findFirst({
      where: and(eq(channelPostsTable.id, input.postId), eq(channelPostsTable.channelId, input.channelId), isNull(channelPostsTable.deletedAt))
    });
    if (!current) return { state: "not_found" };
    if (current.updatedAt !== input.ifUpdatedAt) return { state: "conflict" };

    const result = await this.database.db
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
    const result = await this.database.db
      .update(channelPostsTable)
      .set({ deletedAt: updatedAt, updatedAt })
      .where(and(eq(channelPostsTable.id, postId), eq(channelPostsTable.channelId, channelId), isNull(channelPostsTable.deletedAt)));
    return (result.rowCount ?? 0) > 0;
  }
}

