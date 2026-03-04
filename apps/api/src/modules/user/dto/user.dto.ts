import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PatchProfileDto {
  @ApiPropertyOptional({ example: "New Name" })
  name?: string;

  @ApiPropertyOptional({ example: "new-email@example.com" })
  email?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: "CurrentPass!" })
  currentPassword!: string;

  @ApiProperty({ minLength: 8, example: "N3wPassw0rd!" })
  newPassword!: string;
}

export class PasswordDto {
  @ApiProperty({ example: "Passw0rd!" })
  password!: string;
}
