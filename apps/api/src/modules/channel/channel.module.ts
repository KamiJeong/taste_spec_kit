import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { ChannelController } from "./channel.controller";
import { ChannelService } from "./channel.service";

@Module({
  imports: [PersistenceModule, SessionModule, AuditLogModule, SharedModule],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService]
})
export class ChannelModule {}
