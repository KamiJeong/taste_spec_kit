import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [PersistenceModule, SessionModule, AuditLogModule, SharedModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
