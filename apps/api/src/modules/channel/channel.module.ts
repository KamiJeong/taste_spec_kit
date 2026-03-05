import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { DatabaseModule } from "../database/database.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { TokenModule } from "../token/token.module";
import { ChannelController } from "./channel.controller";
import { ChannelRepository } from "./channel.repository";
import { ChannelResolver } from "./channel.resolver";
import { ChannelService } from "./channel.service";

@Module({
  imports: [DatabaseModule, SessionModule, AuditLogModule, SharedModule, TokenModule],
  controllers: [ChannelController],
  providers: [ChannelRepository, ChannelService, ChannelResolver],
  exports: [ChannelService]
})
export class ChannelModule {}
