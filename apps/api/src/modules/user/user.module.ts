import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { DatabaseModule } from "../database/database.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { TokenModule } from "../token/token.module";
import { UserController } from "./user.controller";
import { UserRepository } from "./user.repository";
import { UserResolver } from "./user.resolver";
import { UserService } from "./user.service";

@Module({
  imports: [DatabaseModule, SessionModule, AuditLogModule, SharedModule, TokenModule],
  controllers: [UserController],
  providers: [UserRepository, UserService, UserResolver],
  exports: [UserService]
})
export class UserModule {}
