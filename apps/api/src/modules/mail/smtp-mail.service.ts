import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import type { MailService, PasswordResetMailInput, VerificationMailInput } from "./mail.service";

@Injectable()
export class SmtpMailService implements MailService {
  private readonly from = process.env.MAIL_FROM ?? "no-reply@localhost";
  private readonly appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  private readonly transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  });

  async sendVerificationMail(input: VerificationMailInput): Promise<void> {
    const verifyUrl = `${this.appBaseUrl}/verify-email?token=${encodeURIComponent(input.token)}`;
    await this.transport.sendMail({
      from: this.from,
      to: input.to,
      subject: "Verify your email",
      text: `Verify your account: ${verifyUrl}`
    });
  }

  async sendPasswordResetMail(input: PasswordResetMailInput): Promise<void> {
    const resetUrl = `${this.appBaseUrl}/reset-password?token=${encodeURIComponent(input.token)}`;
    await this.transport.sendMail({
      from: this.from,
      to: input.to,
      subject: "Reset your password",
      text: `Reset your password: ${resetUrl}`
    });
  }
}
