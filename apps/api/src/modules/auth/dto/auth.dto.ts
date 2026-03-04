import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SignupDto {
  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ minLength: 8, example: "Passw0rd!" })
  password!: string;

  @ApiPropertyOptional({ nullable: true, example: "Kami" })
  name?: string | null;
}

export class EmailDto {
  @ApiProperty({ example: "user@example.com" })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "token-123" })
  token!: string;

  @ApiProperty({ minLength: 8, example: "N3wPassw0rd!" })
  newPassword!: string;
}

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "Passw0rd!" })
  password!: string;
}
