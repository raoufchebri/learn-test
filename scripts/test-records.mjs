import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createRecordStore } from "../server/records.mjs";

const namespace = `test-${randomUUID()}`;
const sql = neon(process.env.NEON_DATABASE_URL);
const open = () => createRecordStore(process.env.NEON_DATABASE_URL, process.env.SESSION_SECRET, namespace);
const request = (method, value, path = "/record") => new Request(`https://sessions.internal${path}`, {
  method, body: value === undefined ? undefined : JSON.stringify(value),
});
try {
  const first = await open();
  const session = { kind: "auth-session", expiresAt: Date.now() + 60_000, user: { id: "test" }, mcpAccess: { accessToken: "test-only-token" } };
  await first.get("session:test").fetch(request("PUT", session));
  const second = await open();
  assert.deepEqual(await (await second.get("session:test").fetch(request("GET"))).json(), session);
  const [raw] = await sql`SELECT value FROM learn_runtime_records WHERE namespace=${namespace} AND id='session:test'`;
  assert.ok(!raw.value.includes("test-only-token"));
  await first.get("expired").fetch(request("PUT", { ...session, expiresAt: Date.now() - 1000 }));
  assert.equal(await (await second.get("expired").fetch(request("GET"))).json(), null);
  const claims = await Promise.all(Array.from({ length: 8 }, async () =>
    (await first.get("build:test").fetch(request("POST", undefined, "/claim-build"))).json()));
  assert.equal(claims.filter((c) => c.claimed).length, 1);
  await second.get("session:test").fetch(request("DELETE"));
  assert.equal(await (await first.get("session:test").fetch(request("GET"))).json(), null);
  console.log("PASS: persistent records, encrypted tokens, expiry, atomic build claim, session deletion");
} finally {
  await sql`DELETE FROM learn_runtime_records WHERE namespace=${namespace}`;
}
