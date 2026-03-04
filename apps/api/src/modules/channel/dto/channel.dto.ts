import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateChannelDto {
  @ApiProperty({ example: "general" })
  name!: string;
}

export class AddManagerDto {
  @ApiProperty({ example: "user-id-123" })
  userId!: string;
}

export class KickMemberDto {
  @ApiProperty({ example: "user-id-123" })
  userId!: string;
}

export class TransferOwnershipDto {
  @ApiProperty({ example: "user-id-123" })
  targetUserId!: string;

  @ApiPropertyOptional({ enum: ["manager", "member"], default: "manager" })
  previousOwnerRole?: "manager" | "member";
}

export class ReorderChannelsDto {
  @ApiProperty({ type: [String], example: ["channel-a", "channel-b"] })
  channelIds!: string[];
}
