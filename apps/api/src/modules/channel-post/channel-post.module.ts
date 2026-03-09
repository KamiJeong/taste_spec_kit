import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { DatabaseModule } from "../database/database.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { TokenModule } from "../token/token.module";
import { ChannelPostController } from "./channel-post.controller";
import { ChannelPostRepository } from "./channel-post.repository";
import { ChannelPostResolver } from "./channel-post.resolver";
import { ChannelPostService } from "./channel-post.service";

@Module({
  imports: [DatabaseModule, SessionModule, AuditLogModule, SharedModule, TokenModule],
  controllers: [ChannelPostController],
  providers: [ChannelPostRepository, ChannelPostService, ChannelPostResolver],
  exports: [ChannelPostService]
})
export class ChannelPostModule {}
