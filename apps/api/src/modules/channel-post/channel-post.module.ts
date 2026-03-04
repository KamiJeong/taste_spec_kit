import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { PersistenceModule } from "../persistence/persistence.module";
import { SessionModule } from "../session/session.module";
import { SharedModule } from "../shared/shared.module";
import { ChannelPostController } from "./channel-post.controller";
import { ChannelPostService } from "./channel-post.service";

@Module({
  imports: [PersistenceModule, SessionModule, AuditLogModule, SharedModule],
  controllers: [ChannelPostController],
  providers: [ChannelPostService],
  exports: [ChannelPostService]
})
export class ChannelPostModule {}
