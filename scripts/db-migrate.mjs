// Applies db/migrations/*.sql in order, once each. Requires NEON_DATABASE_URL.
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) throw new Error("NEON_DATABASE_URL is not set");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const applied = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((row) => row.name));
  const dir = new URL("../db/migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()) {
    if (applied.has(name)) { console.log(`skip  ${name}`); continue; }
    await client.query("BEGIN");
    try {
      await client.query(await readFile(new URL(name, dir), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`apply ${name}`);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  }
} finally {
  client.release();
  await pool.end();
}
