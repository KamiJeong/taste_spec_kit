import { Module } from "@nestjs/common";
import { ApiGraphqlModule } from "./graphql/graphql.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { ChannelModule } from "./channel/channel.module";
import { ChannelPostModule } from "./channel-post/channel-post.module";
import { SessionModule } from "./session/session.module";
import { TokenModule } from "./token/token.module";
import { MailModule } from "./mail/mail.module";
import { QueueModule } from "./queue/queue.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { DatabaseModule } from "./database/database.module";
import { SharedModule } from "./shared/shared.module";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isGraphqlEnabled(): boolean {
  return envBool("API_GRAPHQL_ENABLED", true);
}

@Module({
  imports: [
    ...(isGraphqlEnabled() ? [ApiGraphqlModule] : []),
    SharedModule,
    DatabaseModule,
    SessionModule,
    TokenModule,
    MailModule,
    QueueModule,
    AuditLogModule,
    AuthModule,
    UserModule,
    ChannelModule,
    ChannelPostModule
  ]
})
export class ModulesRoot {}
