import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { DatabaseModule } from "../database/database.module";
import { MailModule } from "../mail/mail.module";
import { SessionModule } from "../session/session.module";
import { TokenModule } from "../token/token.module";
import { SharedModule } from "../shared/shared.module";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [DatabaseModule, SessionModule, TokenModule, MailModule, AuditLogModule, SharedModule],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService],
  exports: [AuthService]
})
export class AuthModule {}
