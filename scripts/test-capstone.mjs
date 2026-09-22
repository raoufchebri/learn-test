import assert from "node:assert/strict";
import { build } from "esbuild";
const bundle = await build({ entryPoints: ["worker/index.ts"], bundle: true, write: false, platform: "node", format: "esm" });
const { default: worker, AuthSessionStore } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const original = globalThis.fetch;
try {
  const records = new Map([["session:test", { kind: "auth-session", user: { id: "learner" }, expiresAt: Date.now() + 1e7, oauthClientId: "test", mcpAccess: { accessToken: "test", expiresAt: Date.now() + 1e7 } }]]);
  const env = { AUTH_SESSIONS: { idFromName: id => id, get: id => new AuthSessionStore({ storage: {
    get: async () => records.get(id), put: async (_, value) => records.set(id, value), delete: async () => records.delete(id),
  } }) } };
  const ids = ["event", "form", "storage", "design", "process", "testing"];
  const review = (status = "passed") => JSON.stringify({ checks: ids.map(id => ({ id, status, feedback: "Evidence or next step.", ...(status !== "passed" ? { prompt: `Inspect the ${id} requirement and help me fix and test the missing part.` } : {}) })) });
  let answer = review();
  let calls = 0;
  globalThis.fetch = async (_, options) => {
    const rpc = JSON.parse(options.body);
    if (rpc.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (rpc.method === "initialize") return Response.json({ id: 1, result: { protocolVersion: "2025-11-25" } });
    if (rpc.params.name === "list_apps") return Response.json({ id: 2, result: { structuredContent: { apps: [{ replId: "picnic", title: "Picnic", replUrl: "https://replit.com/@test/picnic" }] } } });
    assert.equal(rpc.params.name, "ask_question");
    assert.equal(rpc.params.arguments.replId, "picnic");
    assert.match(rpc.params.arguments.question, /read-only/);
    calls++;
    return Response.json({ id: 2, result: { structuredContent: { phase: answer === "BUSY" ? "busy" : "paused", response: answer } } });
  };
  const request = (method = "POST", appId = "picnic", origin = "https://learn.test", cookie = "test") => worker.fetch(new Request("https://learn.test/api/activities/capstone", { method, headers: { origin, cookie: `replit_learn_session=${cookie}` }, ...(method === "POST" ? { body: JSON.stringify({ appId }) } : {}) }), env);
  assert.equal((await request("POST", "picnic", "https://evil.test")).status, 403);
  assert.equal((await request("POST", "picnic", "https://learn.test", "missing")).status, 401);
  assert.equal((await request("POST", "unauthorized")).status, 403);
  assert.equal(calls, 0);
  const success = await (await request()).json();
  assert.equal(success.submission.passed, true);
  assert.equal(success.submission.checks.length, 6);
  assert.equal((await (await request("GET")).json()).submission.appId, "picnic");
  answer = review("needs_work");
  assert.equal((await (await request()).json()).submission.passed, false);
  answer = JSON.stringify({ checks: ids.map((id, index) => ({ id, status: index === 0 ? "unverified" : "passed", feedback: "Check evidence.", ...(index === 0 ? { prompt: "Inspect the event details and test what is missing before making changes." } : {}) })) });
  assert.equal((await (await request()).json()).submission.passed, false);
  for (answer of ["YES", "YES, everything works", "yes", '{"answer":"YES"}', "NO\nYES", "", '{"checks":[]}',
    JSON.stringify({ checks: ids.map(() => ({ id: "event", status: "passed", feedback: "OK" })) }),
    review("unexpected"), JSON.stringify({ checks: ids.map(id => ({ id, status: "needs_work", feedback: "Missing prompt." })) }),
    JSON.stringify({ checks: ids.map(id => ({ id, status: "unverified", feedback: "Missing evidence.", prompt: "" })) }),
    JSON.stringify({ checks: ids.map(id => ({ id, status: "passed", feedback: "" })) })]) {
    assert.notEqual((await request()).status, 200);
    assert.equal((await (await request("GET")).json()).submission.passed, false);
  }
  answer = "BUSY";
  assert.equal((await request()).status, 409);
  console.log("PASS: auth, origin, project access, persisted checklists, mixed and unverified results, duplicate/missing/invalid checks fail closed, busy recovery.");
} finally { globalThis.fetch = original; }