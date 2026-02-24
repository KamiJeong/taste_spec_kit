import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { createClient, type RedisClientType } from "redis";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

interface SessionRow {
  userId: string;
}

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly allowInMemoryFallback = process.env.ALLOW_INMEMORY_FALLBACK === "true";
  private readonly sessions = new Map<string, SessionRow>();
  private readonly sessionsByUserId = new Map<string, Set<string>>();
  private readonly redisUrl = process.env.REDIS_URL;
  private client: RedisClientType | null = null;

  async onModuleInit(): Promise<void> {
    if (!this.redisUrl) {
      if (!this.allowInMemoryFallback) {
        throw new Error("REDIS_URL is required. In-memory fallback is disabled.");
      }
      this.logger.warn("REDIS_URL is not set; in-memory fallback enabled by ALLOW_INMEMORY_FALLBACK=true");
      return;
    }
    try {
      this.client = createClient({ url: this.redisUrl });
      await this.client.connect();
    } catch (error) {
      if (!this.allowInMemoryFallback) {
        throw error;
      }
      this.logger.warn("Redis connection failed; in-memory fallback enabled by ALLOW_INMEMORY_FALLBACK=true");
      if (this.client) {
        await this.client.quit();
      }
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  async create(userId: string): Promise<string> {
    const sid = randomBytes(24).toString("hex");
    if (this.client) {
      await this.client.set(this.toKey(sid), userId, { EX: SESSION_TTL_SECONDS });
      await this.client.sAdd(this.toUserSessionsKey(userId), sid);
      await this.client.expire(this.toUserSessionsKey(userId), SESSION_TTL_SECONDS);
      return sid;
    }
    this.sessions.set(sid, { userId });
    this.indexInMemorySession(userId, sid);
    return sid;
  }

  async getUserId(sid: string | undefined): Promise<string | null> {
    if (!sid) return null;
    if (this.client) {
      const userId = await this.client.get(this.toKey(sid));
      return userId ?? null;
    }
    return this.sessions.get(sid)?.userId ?? null;
  }

  async destroy(sid: string | undefined): Promise<void> {
    if (!sid) return;
    if (this.client) {
      const userId = await this.client.get(this.toKey(sid));
      await this.client.del(this.toKey(sid));
      if (userId) {
        await this.client.sRem(this.toUserSessionsKey(userId), sid);
      }
      return;
    }
    const userId = this.sessions.get(sid)?.userId;
    this.sessions.delete(sid);
    if (userId) {
      this.removeFromInMemoryIndex(userId, sid);
    }
  }

  async destroyAllForUser(userId: string): Promise<void> {
    if (this.client) {
      const userSessionsKey = this.toUserSessionsKey(userId);
      const sids = await this.client.sMembers(userSessionsKey);
      for (const sid of sids) {
        await this.client.del(this.toKey(sid));
      }
      await this.client.del(userSessionsKey);
      return;
    }
    const sids = this.sessionsByUserId.get(userId);
    if (!sids) return;
    for (const sid of sids) {
      this.sessions.delete(sid);
    }
    this.sessionsByUserId.delete(userId);
  }

  private toKey(sid: string): string {
    return `sess:${sid}`;
  }

  private toUserSessionsKey(userId: string): string {
    return `sess:user:${userId}`;
  }

  private indexInMemorySession(userId: string, sid: string): void {
    const userSessions = this.sessionsByUserId.get(userId);
    if (userSessions) {
      userSessions.add(sid);
      return;
    }
    this.sessionsByUserId.set(userId, new Set([sid]));
  }

  private removeFromInMemoryIndex(userId: string, sid: string): void {
    const userSessions = this.sessionsByUserId.get(userId);
    if (!userSessions) return;
    userSessions.delete(sid);
    if (userSessions.size === 0) {
      this.sessionsByUserId.delete(userId);
    }
  }
}
