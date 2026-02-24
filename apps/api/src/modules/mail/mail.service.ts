export const MAIL_SERVICE = "MAIL_SERVICE";

export interface VerificationMailInput {
  to: string;
  token: string;
}

export interface PasswordResetMailInput {
  to: string;
  token: string;
}

export interface MailService {
  sendVerificationMail(input: VerificationMailInput): Promise<void>;
  sendPasswordResetMail(input: PasswordResetMailInput): Promise<void>;
}
