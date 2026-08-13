import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const database = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

database.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

export async function checkDatabaseConnection(): Promise<void> {
  await database.query("SELECT 1");
}
