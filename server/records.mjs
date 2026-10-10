import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

// The same Neon database can serve preview and production without sharing sessions.
export async function createRecordStore(databaseUrl, secret, namespace) {
  if (!databaseUrl || !secret) throw new Error("NEON_DATABASE_URL and SESSION_SECRET are required");
  const sql = neon(databaseUrl);
  const key = createHash("sha256").update(secret).digest();
  const encrypt = (record) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(record)), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
  };
  const decrypt = (value) => {
    const bytes = Buffer.from(value, "base64");
    const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString());
  };
  await sql`CREATE TABLE IF NOT EXISTS learn_runtime_records (
    namespace text NOT NULL,
    id text NOT NULL,
    value text NOT NULL,
    expires_at timestamptz,
    PRIMARY KEY (namespace, id)
  )`;
  // Remove only expired runtime records, never learner progress.
  await sql`DELETE FROM learn_runtime_records WHERE namespace = ${namespace} AND expires_at < now()`;
  const reply = (value, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { "content-type": "application/json" },
  });
  return {
    idFromName: (id) => id,
    get: (id) => ({
      async fetch(request) {
        if (request.method === "POST" && new URL(request.url).pathname === "/claim-build") {
          const build = { kind: "recipe-build", status: "submitting", startedAt: Date.now() };
          const inserted = await sql`INSERT INTO learn_runtime_records (namespace,id,value)
            VALUES (${namespace},${id},${encrypt(build)})
            ON CONFLICT (namespace,id) DO NOTHING RETURNING id`;
          if (inserted.length) return reply({ claimed: true, build });
          const [row] = await sql`SELECT value FROM learn_runtime_records WHERE namespace=${namespace} AND id=${id}`;
          return reply({ claimed: false, build: row ? decrypt(row.value) : null });
        }
        if (request.method === "GET") {
          const [row] = await sql`SELECT value FROM learn_runtime_records
            WHERE namespace=${namespace} AND id=${id} AND (expires_at IS NULL OR expires_at > now())`;
          return reply(row ? decrypt(row.value) : null);
        }
        if (request.method === "PUT") {
          const record = await request.json();
          const expires = typeof record.expiresAt === "number" ? new Date(record.expiresAt).toISOString() : null;
          await sql`INSERT INTO learn_runtime_records (namespace,id,value,expires_at)
            VALUES (${namespace},${id},${encrypt(record)},${expires})
            ON CONFLICT (namespace,id) DO UPDATE SET value=EXCLUDED.value, expires_at=EXCLUDED.expires_at`;
          return new Response(null, { status: 204 });
        }
        if (request.method === "DELETE") {
          await sql`DELETE FROM learn_runtime_records WHERE namespace=${namespace} AND id=${id}`;
          return new Response(null, { status: 204 });
        }
        return reply({ error: "Method not allowed" }, 405);
      },
    }),
  };
}
