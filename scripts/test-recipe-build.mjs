import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

// No requests reach Replit. Every network call is stubbed below.
const bundle = await build({ entryPoints: ["worker/index.ts"], bundle: true, write: false, platform: "node", format: "esm" });
const { default: worker, AuthSessionStore } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

function harness({ canCreate = true, mode = "success" } = {}) {
  const records = new Map();
  const objects = new Map();
  const calls = [];
  const session = (id) => ({ kind: "auth-session", user: { id }, expiresAt: Date.now() + 1e7, oauthClientId: "test-client", canCreateApps: canCreate, mcpAccess: { accessToken: "test-access", expiresAt: Date.now() + 1e7 } });
  records.set("session:test", session("one"));
  records.set("session:other", session("two"));
  const env = { AUTH_SESSIONS: {
    idFromName: (id) => id,
    get(id) {
      if (!objects.has(id)) objects.set(id, new AuthSessionStore({ storage: {
        get: async () => records.get(id),
        put: async (_key, value) => records.set(id, value),
        delete: async () => records.delete(id),
      } }));
      return objects.get(id);
    },
  } };
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("/sse")) {
      assert.equal(options.headers.authorization, "Bearer test-encrypted");
      assert.match(String(url), /turnId=test-turn/);
      const done = { kind: 'done', url: mode === 'unsafe-preview' ? 'https://evil.example/preview' : 'https://fixture.replit.dev/?token=private', token: 'private', riverToken: 'private' };
      const payload = `data: {"kind":"events","events":[]}\n\ndata: ${JSON.stringify(done)}\n\n`;
      return new Response(payload, { headers: { "content-type": "text/event-stream" } });
    }
    const body = JSON.parse(options.body);
    if (body.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (body.method === "initialize") return Response.json({ id: 1, result: { protocolVersion: "2025-11-25" } });
    calls.push(body.params);
    if (body.params.name === "replit_widget_get_auth_token") return Response.json({ id: 2, result: { structuredContent: { status: "ok", authnToken: "test-encrypted" } } });
    if (body.params.name === 'ask_question') {
      const output = { phase: mode.startsWith('ask-busy') ? 'busy' : 'paused', response: 'The actual recipe form lives in src/App.tsx.' };
      return Response.json({ id: 2, result: mode === 'ask-error' ? { isError: true, content: [{ text: 'Unavailable' }] } : mode === 'ask-busy-text' ? { content: [{ text: JSON.stringify(output) }] } : { structuredContent: output } });
    }
    if (body.params.name === 'update_app_using_prompt') {
      assert.equal(body.params.arguments.replId, 'test-app');
      assert.equal(body.params.arguments.changeDescription, 'Keep the current recipe features, but add a way to mark favorites.');
      if (mode === 'update-timeout') throw new Error('Connection lost');
      return Response.json({ id: 2, result: { structuredContent: { phase: 'updating', replId: 'test-app', turnId: 'update-turn' } } });
    }
    assert.equal(body.params.name, "create_app_from_prompt");
    if (mode === "timeout") throw new Error("Network interrupted");
    if (mode === "denied") return new Response(null, { status: 403 });
    const output = { phase: "creating", replId: "test-app", replUrl: "https://replit.com/@test/recipe", turnId: "test-turn" };
    return Response.json({ id: 2, result: mode === "text" ? { content: [{ text: JSON.stringify(output) }] } : { structuredContent: output } });
  };
  const request = (method = "GET", path = "/api/activities/recipe", cookie = "test", origin = "http://localhost") => worker.fetch(new Request(`http://localhost${path}`, { method, headers: { origin, cookie: `replit_learn_session=${cookie}` }, ...(path === '/api/ask' ? { body: JSON.stringify({ appId: 'test-app', question: 'Show the recipe form, read only.' }) } : {}) }), env);
  const freshRequest = () => worker.fetch(new Request('http://localhost/api/activities/recipe', { method: 'POST', headers: { origin: 'http://localhost', cookie: 'replit_learn_session=test', 'content-type': 'application/json' }, body: JSON.stringify({ fresh: true }) }), env);
  return { request, freshRequest, calls, records };
}

test("recipe creation workflow", async (t) => {
  const originalFetch = globalThis.fetch;
  try {
    await t.test('an explicit fresh test creates a new app despite a saved build', async () => {
      const h = harness();
      await h.request('POST');
      assert.equal((await h.freshRequest()).status, 200);
      assert.equal(h.calls.filter(call => call.name === 'create_app_from_prompt').length, 2);
    });
    await t.test('updates only the completed recipe app, once, with origin and consent checks', async () => {
      const h = harness();
      const path = '/api/activities/recipe/iterate';
      assert.equal((await h.request('POST', path)).status, 409);
      await h.request('POST');
      await (await h.request('GET', '/api/activities/recipe/events')).text();
      assert.equal((await h.request('POST', path, 'test', 'https://other.example')).status, 403);
      assert.equal((await h.request('POST', path, 'other')).status, 409);
      assert.equal((await (await h.request('POST', path)).json()).accepted, true);
      assert.equal((await (await h.request('POST', path)).json()).accepted, true);
      assert.equal(h.calls.filter(call => call.name === 'update_app_using_prompt').length, 1);
    });
    await t.test('does not repeat an uncertain update or report it accepted', async () => {
      const h = harness({ mode: 'update-timeout' });
      await h.request('POST');
      await (await h.request('GET', '/api/activities/recipe/events')).text();
      assert.equal((await h.request('POST', '/api/activities/recipe/iterate')).status, 409);
      assert.equal((await h.request('POST', '/api/activities/recipe/iterate')).status, 409);
      assert.equal(h.calls.filter(call => call.name === 'update_app_using_prompt').length, 1);
    });
    await t.test("requires sign-in, write consent, and same origin", async () => {
      const h = harness({ canCreate: false });
      assert.equal((await h.request("POST", undefined, "missing")).status, 401);
      assert.equal((await h.request("POST")).status, 401);
      assert.equal((await h.request("POST", undefined, "test", "https://other.example")).status, 403);
      assert.equal(h.calls.length, 0);
    });
    await t.test("sends the fixed personal prompt once and persists across refresh and repeat clicks", async () => {
      const h = harness();
      const first = await (await h.request("POST")).json();
      assert.equal(first.build.status, "creating");
      await h.request("POST");
      assert.equal(h.calls.length, 1);
      assert.equal(h.calls[0].arguments.app_stack, "react_website");
      assert.match(h.calls[0].arguments.appDescription, /save my recipes in this browser. No sign-in needed/);
      assert.equal((await (await h.request()).json()).build.replId, "test-app");
      assert.equal((await (await h.request("GET", undefined, "other")).json()).build.status, "idle");
      assert.equal((await h.request("GET", "/api/activities/recipe/events", "other")).status, 404);
    });
    await t.test("accepts mirrored JSON text from MCP", async () => {
      const h = harness({ mode: "text" });
      assert.equal((await (await h.request("POST")).json()).build.status, "creating");
    });
    await t.test("does not retry an uncertain mutation", async () => {
      const h = harness({ mode: "timeout" });
      assert.equal((await (await h.request("POST")).json()).build.status, "unknown");
      await h.request("POST");
      assert.equal(h.calls.length, 1);
    });
    await t.test("permission rejection permits reauthorization without a stuck claim", async () => {
      const h = harness({ mode: "denied" });
      assert.equal((await h.request("POST")).status, 401);
      assert.equal((await (await h.request()).json()).build.status, "idle");
    });
    await t.test("streams real completion, persists it, and never exposes tokens", async () => {
      const h = harness();
      await h.request("POST");
      const response = await h.request("GET", "/api/activities/recipe/events");
      const text = await response.text();
      assert.match(text, /"status":"complete"/);
      assert.doesNotMatch(text, /test-access|test-encrypted/);
      assert.equal((await (await h.request()).json()).build.status, "complete");
      assert.equal((await (await h.request()).json()).build.previewUrl, 'https://fixture.replit.dev');
      assert.doesNotMatch(JSON.stringify(await (await h.request()).json()), /private/);
    });
    await t.test('rejects foreign preview hosts', async () => {
      const h = harness({ mode: 'unsafe-preview' });
      await h.request('POST');
      await (await h.request('GET', '/api/activities/recipe/events')).text();
      assert.equal((await (await h.request()).json()).build.previewUrl, undefined);
    });
    await t.test('uses read-only project questions and propagates tool errors', async () => {
      const h = harness();
      const response = await h.request('POST', '/api/ask');
      assert.equal(response.status, 200);
      assert.match(await response.text(), /src\/App.tsx/);
      assert.equal(h.calls[0].name, 'ask_question');
      assert.equal(h.calls[0].arguments.replId, 'test-app');
      const failed = harness({ mode: 'ask-error' });
      assert.equal((await failed.request('POST', '/api/ask')).status, 503);
      for (const mode of ['ask-busy', 'ask-busy-text']) {
        const busy = harness({ mode });
        assert.equal((await busy.request('POST', '/api/ask')).status, 409);
      }
    });
    await t.test("an abandoned claim becomes unknown, not a fresh creation", async () => {
      const h = harness();
      h.records.set("recipe-build:v1:one", { kind: "recipe-build", status: "submitting", startedAt: Date.now() - 180000 });
      assert.equal((await (await h.request("POST")).json()).build.status, "unknown");
      assert.equal(h.calls.length, 0);
    });
  } finally { globalThis.fetch = originalFetch; }
});
