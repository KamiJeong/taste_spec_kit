import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { MailModule } from "../mail/mail.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SessionModule } from "../session/session.module";
import { TokenModule } from "../token/token.module";
import { SharedModule } from "../shared/shared.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [PersistenceModule, SessionModule, TokenModule, MailModule, AuditLogModule, SharedModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
