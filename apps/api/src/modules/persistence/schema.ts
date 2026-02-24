import { bigint, boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

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

export type UserRow = typeof usersTable.$inferSelect;
export type VerificationTokenRow = typeof verificationTokensTable.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokensTable.$inferSelect;
export type AuditLogRow = typeof auditLogsTable.$inferSelect;
