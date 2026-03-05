import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { auditLogsTable } from "../persistence/schema";
import type { AuditLogRow } from "../persistence/schema";

@Injectable()
export class AuditLogRepository {
  constructor(private readonly database: DatabaseService) {}

  async storeAuditLog(input: AuditLogRow): Promise<void> {
    await this.database.db.insert(auditLogsTable).values(input);
  }
}
