import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { database } from "../config/database.js";

const migrationsDirectory = join(process.cwd(), "migrations");

export async function runMigrations(): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = await database.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [migrationFile],
    );

    if (alreadyApplied.rowCount) continue;

    const sql = await readFile(join(migrationsDirectory, migrationFile), "utf8");
    const client = await database.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        migrationFile,
      ]);
      await client.query("COMMIT");
      console.log(`Applied migration ${migrationFile}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => database.end())
    .catch((error: unknown) => {
      console.error("Migration failed", error);
      process.exitCode = 1;
    });
}
