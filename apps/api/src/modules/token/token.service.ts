import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class TokenService {
  issueVerificationToken(): { token: string; tokenHash: string; expiresAt: number } {
    const token = randomBytes(24).toString("hex");
    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: Date.now() + ONE_DAY_MS
    };
  }

  issuePasswordResetToken(): { token: string; tokenHash: string; expiresAt: number } {
    const token = randomBytes(24).toString("hex");
    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: Date.now() + ONE_HOUR_MS
    };
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
