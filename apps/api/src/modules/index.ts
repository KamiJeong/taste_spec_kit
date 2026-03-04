import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { ChannelModule } from "./channel/channel.module";
import { SessionModule } from "./session/session.module";
import { TokenModule } from "./token/token.module";
import { MailModule } from "./mail/mail.module";
import { QueueModule } from "./queue/queue.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { PersistenceModule } from "./persistence/persistence.module";
import { SharedModule } from "./shared/shared.module";

@Module({
  imports: [
    SharedModule,
    PersistenceModule,
    SessionModule,
    TokenModule,
    MailModule,
    QueueModule,
    AuditLogModule,
    AuthModule,
    UserModule,
    ChannelModule
  ]
})
export class ModulesRoot {}
