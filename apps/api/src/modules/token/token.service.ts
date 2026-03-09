import { Injectable } from "@nestjs/common";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_HOUR_SECONDS = 60 * 60;
const TOKEN_VERSION = "v1";

type AccessTokenPayload = {
  sid: string;
  sub: string;
  iat: number;
  exp: number;
};

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

  issueAccessToken(input: { sid: string; userId: string }): { token: string; expiresInSeconds: number } {
    const expiresInSeconds = this.accessTokenTtlSeconds();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload: AccessTokenPayload = {
      sid: input.sid,
      sub: input.userId,
      iat: nowSeconds,
      exp: nowSeconds + expiresInSeconds
    };
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(payloadEncoded);
    return {
      token: `${TOKEN_VERSION}.${payloadEncoded}.${signature}`,
      expiresInSeconds
    };
  }

  verifyAccessToken(token: string): { sid: string; userId: string } | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [version, payloadEncoded, signature] = parts;
    if (version !== TOKEN_VERSION || !payloadEncoded || !signature) return null;

    const expected = this.sign(payloadEncoded);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

    const payloadRaw = this.base64UrlDecode(payloadEncoded);
    if (!payloadRaw) return null;

    let payload: AccessTokenPayload;
    try {
      payload = JSON.parse(payloadRaw) as AccessTokenPayload;
    } catch {
      return null;
    }

    if (!payload?.sid || !payload?.sub || typeof payload.exp !== "number") return null;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) return null;

    return {
      sid: payload.sid,
      userId: payload.sub
    };
  }

  private accessTokenSecret(): string {
    const raw = process.env.AUTH_ACCESS_TOKEN_SECRET;
    if (raw && raw.trim()) return raw.trim();
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_ACCESS_TOKEN_SECRET is required in production");
    }
    return "dev-only-auth-access-token-secret-change-me";
  }

  private accessTokenTtlSeconds(): number {
    const raw = process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS;
    if (!raw) return ONE_HOUR_SECONDS;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return ONE_HOUR_SECONDS;
    return parsed;
  }

  private sign(payloadEncoded: string): string {
    return createHmac("sha256", this.accessTokenSecret()).update(payloadEncoded).digest("base64url");
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  private base64UrlDecode(value: string): string | null {
    try {
      return Buffer.from(value, "base64url").toString("utf8");
    } catch {
      return null;
    }
  }
}
