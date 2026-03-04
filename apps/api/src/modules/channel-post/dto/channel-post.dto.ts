import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateChannelPostDto {
  @ApiProperty({ example: "Notice: weekly maintenance" })
  title!: string;

  @ApiProperty({ example: "Service will be unavailable from 01:00 to 02:00 UTC." })
  content!: string;
}

export class UpdateChannelPostDto {
  @ApiPropertyOptional({ example: "Updated notice title" })
  title?: string;

  @ApiPropertyOptional({ example: "Updated notice content." })
  content?: string;

  @ApiProperty({ example: "2026-03-04T08:00:00.000Z" })
  ifUpdatedAt!: string;
}
