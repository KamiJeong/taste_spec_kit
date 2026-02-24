import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PersistenceService } from "../persistence/persistence.service";

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
  | "USER_DEACTIVATE";

@Injectable()
export class AuditLogService {
  constructor(private readonly persistence: PersistenceService) {}

  async record(input: {
    eventType: AuditEventType;
    result: "SUCCESS" | "FAILURE";
    context: AuditContext;
    userId?: string | null;
    email?: string | null;
    reasonCode?: string | null;
  }): Promise<void> {
    await this.persistence.storeAuditLog({
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
