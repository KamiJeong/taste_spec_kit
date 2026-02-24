import { Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module";
import { AuditLogService } from "./audit-log.service";

@Module({
  imports: [PersistenceModule],
  providers: [AuditLogService],
  exports: [AuditLogService]
})
export class AuditLogModule {}
