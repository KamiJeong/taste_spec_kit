import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuditLogRepository } from "./audit-log.repository";

export interface AuditContext {
  ip: string;
  userAgent: string;
}

export type AuditEventType =
  | "AUTH_SIGNUP"
  | "AUTH_VERIFY_EMAIL"
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_RESET_PASSWORD"
  | "USER_DEACTIVATE"
  | "CHANNEL_CREATE"
  | "CHANNEL_JOIN_REQUEST"
  | "CHANNEL_JOIN_REVIEW"
  | "CHANNEL_MANAGER_ASSIGN"
  | "CHANNEL_MANAGER_REMOVE"
  | "CHANNEL_KICK"
  | "CHANNEL_QUIT"
  | "CHANNEL_TRANSFER_OWNERSHIP"
  | "CHANNEL_POST_CREATE"
  | "CHANNEL_POST_UPDATE"
  | "CHANNEL_POST_DELETE";

@Injectable()
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async record(input: {
    eventType: AuditEventType;
    result: "SUCCESS" | "FAILURE";
    context: AuditContext;
    userId?: string | null;
    email?: string | null;
    reasonCode?: string | null;
  }): Promise<void> {
    await this.repository.storeAuditLog({
      eventId: randomUUID(),
      eventType: input.eventType,
      userId: input.userId ?? null,
      email: input.email ?? null,
      ip: input.context.ip,
      userAgent: input.context.userAgent,
      result: input.result,
      reasonCode: input.reasonCode ?? null,
      occurredAt: new Date().toISOString()
    });
  }
}
