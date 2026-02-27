import { Injectable, Logger } from "@nestjs/common";
import type { MailService, PasswordResetMailInput, VerificationMailInput } from "./mail.service";

@Injectable()
export class LogMailService implements MailService {
  private readonly logger = new Logger(LogMailService.name);
  private readonly appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  async sendVerificationMail(input: VerificationMailInput): Promise<void> {
    const verifyUrl = `${this.appBaseUrl}/verify-email?token=${encodeURIComponent(input.token)}`;
    this.logger.log(`[mail:verification] to=${input.to} url=${verifyUrl}`);
  }

  async sendPasswordResetMail(input: PasswordResetMailInput): Promise<void> {
    const resetUrl = `${this.appBaseUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
    this.logger.log(`[mail:password-reset] to=${input.to} url=${resetUrl}`);
  }
}
