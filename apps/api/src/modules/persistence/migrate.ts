import { resolve } from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadApiEnv } from "../../config/load-env";

async function run(): Promise<void> {
  loadApiEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for db:migrate");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: resolve(__dirname, "../../../drizzle") });
    console.log("db:migrate ok");
  } finally {
    await pool.end();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
