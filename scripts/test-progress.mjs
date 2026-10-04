// Progress API test against the real Neon database with a throwaway user (deleted at the end). Requires NEON_DATABASE_URL.
import { build } from "esbuild";
import { neon } from "@neondatabase/serverless";
const out = await build({ entryPoints: ["worker/index.ts"], bundle: true, write: false, format: "esm", platform: "node", target: "es2022" });
const worker = (await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`)).default;
const COOKIE = process.argv[2];
const userId = "e2e-progress-test";
const records = { "session:test-session": { kind: "auth-session", user: { id: userId, username: "e2e-progress", emailVerified: false }, expiresAt: Date.now() + 3600e3 } };
const env = {
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  AUTH_SESSIONS: { idFromName: (id) => id, get: (id) => ({ fetch: async (req) => req.method === "DELETE" ? new Response("null") : new Response(JSON.stringify(records[id] ?? null)) }) },
  ASSETS: { fetch: async () => new Response("asset") },
};
const ctx = { waitUntil() {}, passThroughOnException() {} };
const call = async (method, path, body, headers = {}) => {
  const res = await worker.fetch(new Request(`http://localhost${path}`, { method, headers: { cookie: `${COOKIE}=test-session`, origin: "http://localhost", "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined }), env, ctx);
  return { status: res.status, body: await res.json().catch(() => null) };
};
const P = (slug) => `/learn/replit-101/${slug}`;
const log = (label, r) => console.log(label.padEnd(34), r.status, JSON.stringify(r.body).slice(0, 150), r.body && "welcomeDismissed" in r.body ? `welcome=${r.body.welcomeDismissed} imported=${r.body.progressImported}` : "");
try {
  log("GET progress (empty)", await call("GET", "/api/progress"));
  log("complete page 2 before page 1", await call("POST", "/api/progress/complete", { page: P("from-conversation-to-outcome") }));
  log("seen page 1", await call("POST", "/api/progress/seen", { page: P("what-you-can-do-with-replit") }));
  log("complete page 1", await call("POST", "/api/progress/complete", { page: P("what-you-can-do-with-replit") }));
  log("complete page 1 again", await call("POST", "/api/progress/complete", { page: P("what-you-can-do-with-replit") }));
  log("seen page 2", await call("POST", "/api/progress/seen", { page: P("from-conversation-to-outcome") }));
  log("unknown page", await call("POST", "/api/progress/complete", { page: "/learn/replit-101/nope" }));
  log("unpublished course page", await call("POST", "/api/progress/seen", { page: "/learn/work-with-agent/x" }));
  log("cross-origin write", await call("POST", "/api/progress/seen", { page: P("what-you-can-do-with-replit") }, { origin: "https://evil.example" }));
  log("no session", await (async () => { const r = await worker.fetch(new Request("http://localhost/api/progress"), env, ctx); return { status: r.status, body: await r.json() }; })());
  // import: claims pages 1,2 and a later page 5 (gap) -> only page 2 should be added (page 1 already done)
  const sql = neon(process.env.NEON_DATABASE_URL);
  const order = await sql`SELECT p.url_path FROM pages p JOIN modules m ON m.id = p.module_id WHERE m.course_id = 'discover' AND p.archived_at IS NULL ORDER BY m.position, p.position LIMIT 6`;
  const urls = order.map((r) => r.url_path);
  log("import [p1,p2,p5] (gap at p3)", await call("POST", "/api/progress/import", { pages: [urls[0], urls[1], urls[4]] }));
  log("import again (already imported)", await call("POST", "/api/progress/import", { pages: [urls[2], urls[3]] }));
  log("dismiss welcome", await call("POST", "/api/onboarding/welcome-dismissed"));
  log("GET progress (final)", await call("GET", "/api/progress"));
  const [state] = await sql`SELECT last_page_id FROM user_course_state WHERE user_id = ${userId}`;
  console.log("last_page_id:", state?.last_page_id);
} finally {
  const sql = neon(process.env.NEON_DATABASE_URL);
  await sql`DELETE FROM users WHERE id = ${userId}`;
  const [left] = await sql`SELECT (SELECT count(*) FROM user_page_progress WHERE user_id = ${userId}) + (SELECT count(*) FROM user_course_state WHERE user_id = ${userId}) AS n`;
  console.log("cleanup, rows left:", left.n);
}
