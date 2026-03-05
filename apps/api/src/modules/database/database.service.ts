import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  auditLogsTable,
  channelJoinRequestsTable,
  channelMembersTable,
  channelPostsTable,
  channelsTable,
  passwordResetTokensTable,
  userChannelOrdersTable,
  usersTable,
  verificationTokensTable
} from "../persistence/schema";

export type AppDatabaseSchema = {
  usersTable: typeof usersTable;
  verificationTokensTable: typeof verificationTokensTable;
  passwordResetTokensTable: typeof passwordResetTokensTable;
  auditLogsTable: typeof auditLogsTable;
  channelsTable: typeof channelsTable;
  channelMembersTable: typeof channelMembersTable;
  channelJoinRequestsTable: typeof channelJoinRequestsTable;
  userChannelOrdersTable: typeof userChannelOrdersTable;
  channelPostsTable: typeof channelPostsTable;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly databaseUrl = process.env.DATABASE_URL;
  private pool: Pool | null = null;
  private _db: NodePgDatabase<AppDatabaseSchema> | null = null;

  get db(): NodePgDatabase<AppDatabaseSchema> {
    if (!this._db) {
      throw new Error("Database is not initialized");
    }
    return this._db;
  }

  async onModuleInit(): Promise<void> {
    if (!this.databaseUrl) {
      throw new Error("DATABASE_URL is required.");
    }
    this.pool = new Pool({ connectionString: this.databaseUrl });
    this._db = drizzle(this.pool, {
      schema: {
        usersTable,
        verificationTokensTable,
        passwordResetTokensTable,
        auditLogsTable,
        channelsTable,
        channelMembersTable,
        channelJoinRequestsTable,
        userChannelOrdersTable,
        channelPostsTable
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this._db = null;
    }
  }
}

