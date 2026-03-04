import { sql } from "drizzle-orm";
import { bigint, boolean, integer, pgEnum, pgTable, primaryKey, text, uniqueIndex, index } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: bigint("locked_until", { mode: "number" }),
  deletionScheduledAt: text("deletion_scheduled_at"),
  createdAt: text("created_at").notNull()
});

export const verificationTokensTable = pgTable("verification_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  usedAt: bigint("used_at", { mode: "number" })
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  usedAt: bigint("used_at", { mode: "number" })
});

export const auditLogsTable = pgTable("audit_logs", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: text("user_id"),
  email: text("email"),
  ip: text("ip").notNull(),
  userAgent: text("user_agent").notNull(),
  result: text("result").notNull(),
  reasonCode: text("reason_code"),
  occurredAt: text("occurred_at").notNull()
});

export const channelRoleEnum = pgEnum("channel_role", ["owner", "manager", "member"]);
export const channelJoinRequestStatusEnum = pgEnum("channel_join_request_status", ["pending", "approved", "rejected"]);

export const channelsTable = pgTable(
  "channels",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerUserId: text("owner_user_id").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [index("idx_channels_owner_user_id").on(table.ownerUserId)]
);

export const channelMembersTable = pgTable(
  "channel_members",
  {
    channelId: text("channel_id").notNull(),
    userId: text("user_id").notNull(),
    role: channelRoleEnum("role").notNull(),
    joinedAt: text("joined_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.channelId, table.userId], name: "pk_channel_members" }),
    index("idx_channel_members_user_id").on(table.userId),
    index("idx_channel_members_channel_role").on(table.channelId, table.role),
    uniqueIndex("uq_channel_single_owner").on(table.channelId).where(sql`${table.role} = 'owner'`)
  ]
);

export const channelJoinRequestsTable = pgTable(
  "channel_join_requests",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id").notNull(),
    requesterUserId: text("requester_user_id").notNull(),
    status: channelJoinRequestStatusEnum("status").notNull(),
    reviewedByUserId: text("reviewed_by_user_id"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    index("idx_channel_join_requests_channel_status_created").on(table.channelId, table.status, table.createdAt),
    index("idx_channel_join_requests_requester_created").on(table.requesterUserId, table.createdAt),
    uniqueIndex("uq_channel_join_requests_pending")
      .on(table.channelId, table.requesterUserId)
      .where(sql`${table.status} = 'pending'`)
  ]
);

export const userChannelOrdersTable = pgTable(
  "user_channel_orders",
  {
    userId: text("user_id").notNull(),
    channelId: text("channel_id").notNull(),
    sortIndex: integer("sort_index").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.channelId], name: "pk_user_channel_orders" }),
    index("idx_user_channel_orders_user_sort").on(table.userId, table.sortIndex),
    uniqueIndex("uq_user_channel_orders_user_sort").on(table.userId, table.sortIndex)
  ]
);

export const channelPostsTable = pgTable(
  "channel_posts",
  {
    id: text("id").primaryKey(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channelsTable.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at")
  },
  (table) => [
    index("idx_channel_posts_channel_created_id").on(table.channelId, table.createdAt, table.id),
    index("idx_channel_posts_author_created").on(table.authorUserId, table.createdAt),
    index("idx_channel_posts_channel_deleted").on(table.channelId, table.deletedAt)
  ]
);

export type UserRow = typeof usersTable.$inferSelect;
export type VerificationTokenRow = typeof verificationTokensTable.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokensTable.$inferSelect;
export type AuditLogRow = typeof auditLogsTable.$inferSelect;
export type ChannelRow = typeof channelsTable.$inferSelect;
export type ChannelMemberRow = typeof channelMembersTable.$inferSelect;
export type ChannelJoinRequestRow = typeof channelJoinRequestsTable.$inferSelect;
export type UserChannelOrderRow = typeof userChannelOrdersTable.$inferSelect;
export type ChannelPostRow = typeof channelPostsTable.$inferSelect;
