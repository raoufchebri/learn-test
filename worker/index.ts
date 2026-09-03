import { createRemoteJWKSet, jwtVerify } from "jose";

type StoredUser = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified: boolean;
  profileImageUrl?: string;
};

type OAuthClientRecord = {
  kind: "oauth-client";
  clientId: string;
  registeredAt: number;
};

type PendingAuthorization = {
  kind: "pending-authorization";
  clientId: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
  returnTo: string;
  state: string;
  expiresAt: number;
};

type AuthSession = {
  kind: "auth-session";
  user: StoredUser;
  expiresAt: number;
  oauthClientId?: string;
  mcpAccess?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  };
};

type StoredRecord = OAuthClientRecord | PendingAuthorization | AuthSession;

type DurableObjectStorageLike = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
};

type DurableObjectStateLike = { storage: DurableObjectStorageLike };
type DurableObjectIdLike = object;
type DurableObjectStubLike = { fetch(request: Request): Promise<Response> };
type DurableObjectNamespaceLike = {
  idFromName(name: string): DurableObjectIdLike;
  get(id: DurableObjectIdLike): DurableObjectStubLike;
};

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AUTH_SESSIONS: DurableObjectNamespaceLike;
  OPENAI_API_KEY?: string;
  LEARN_VECTORIZE?: {
    query(vector: number[], options: Record<string, unknown>): Promise<{ matches?: Array<{ id: string; score: number }> }>;
    upsert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, string> }>): Promise<unknown>;
    deleteByIds(ids: string[]): Promise<unknown>;
  };
  RAG_INDEX_SECRET?: string;
  REPLIT_OIDC_ISSUER?: string;
  REPLIT_OIDC_CLIENT_ID?: string;
  REPLIT_MCP_URL?: string;
};

type DocsChunk = {
  id: string;
  sourceId: string;
  title: string;
  heading: string;
  text: string;
  url: string;
  pageUrl: string;
  sourcePath: string;
};

type DocsIndex = { version: number; hash: string; chunks: DocsChunk[]; deletedSourceIds?: string[] };
type RagSource = Pick<DocsChunk, "id" | "title" | "heading" | "url">;

type TokenResponse = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

const RECORD_KEY = "record";
const SESSION_COOKIE = "replit_learn_session";
const OAUTH_COOKIE = "replit_learn_oauth";
const DEFAULT_ISSUER = "https://replit.com/oidc";
const DEFAULT_MCP_URL = "https://replit-mcp.com/server/mcp";
const IDENTITY_SCOPES = "openid profile email";
const MCP_SCOPE = "apps:read";
const MCP_PROTOCOL_VERSION = "2025-11-25";
const TOKEN_REFRESH_SKEW_MS = 30_000;
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;
const AUTHORIZATION_LIFETIME_MS = 10 * 60 * 1_000;
const DOCS_INDEX_PATH = "/retrieval/replit-learn-index.json";
const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1536;
const ANSWER_MODEL = "gpt-5.6-luna";
let docsIndexCache: DocsIndex | undefined;

export class AuthSessionStore {
  constructor(private readonly state: DurableObjectStateLike) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === "GET") {
      const record = await this.state.storage.get<StoredRecord>(RECORD_KEY);
      return json(record ?? null);
    }

    if (request.method === "PUT") {
      const record = await request.json<StoredRecord>();
      await this.state.storage.put(RECORD_KEY, record);
      return new Response(null, { status: 204 });
    }

    if (request.method === "DELETE") {
      await this.state.storage.delete(RECORD_KEY);
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  }
}

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "private, no-store");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function randomToken(bytes = 32): string {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return base64Url(value);
}

function base64Url(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function sessionCookie(request: Request, name: string, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearCookie(request: Request, name: string): string {
  return sessionCookie(request, name, "", 0);
}

function safeReturnTo(value: string | null): string {
  if (!value) return "/learn";
  const base = new URL("https://replit-learn.invalid");
  try {
    const candidate = new URL(value, base);
    if (candidate.origin !== base.origin) return "/learn";
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return "/learn";
  }
}

function recordStub(env: Env, id: string): DurableObjectStubLike {
  return env.AUTH_SESSIONS.get(env.AUTH_SESSIONS.idFromName(id));
}

async function getRecord<T extends StoredRecord>(env: Env, id: string): Promise<T | undefined> {
  const response = await recordStub(env, id).fetch(new Request("https://sessions.internal/record"));
  const value = await response.json<StoredRecord | null>();
  return value?.kind ? value as T : undefined;
}

async function putRecord(env: Env, id: string, record: StoredRecord): Promise<void> {
  await recordStub(env, id).fetch(new Request("https://sessions.internal/record", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(record),
  }));
}

async function deleteRecord(env: Env, id: string): Promise<void> {
  await recordStub(env, id).fetch(new Request("https://sessions.internal/record", { method: "DELETE" }));
}

function issuer(env: Env): string {
  return (env.REPLIT_OIDC_ISSUER ?? DEFAULT_ISSUER).replace(/\/$/, "");
}

function mcpUrl(env: Env): string {
  return env.REPLIT_MCP_URL ?? DEFAULT_MCP_URL;
}

async function getOrRegisterClient(request: Request, env: Env): Promise<string> {
  if (env.REPLIT_OIDC_CLIENT_ID) return env.REPLIT_OIDC_CLIENT_ID;

  const origin = new URL(request.url).origin;
  const recordId = `oauth-client:${origin}:mcp`;
  const existing = await getRecord<OAuthClientRecord>(env, recordId);
  if (existing?.clientId) return existing.clientId;

  const redirectUri = `${origin}/api/auth/callback`;
  const response = await fetch(`${issuer(env)}/reg`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Replit Learn",
      application_type: "web",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });

  if (!response.ok) throw new Error(`OAuth client registration failed (${response.status})`);
  const registration = await response.json<{ client_id?: string }>();
  if (!registration.client_id) throw new Error("OAuth registration did not return a client ID");
  await putRecord(env, recordId, { kind: "oauth-client", clientId: registration.client_id, registeredAt: Date.now() });
  return registration.client_id;
}

async function startLogin(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const clientId = await getOrRegisterClient(request, env);
  const flowId = randomToken();
  const state = randomToken();
  const nonce = randomToken();
  const codeVerifier = randomToken(48);
  const redirectUri = `${requestUrl.origin}/api/auth/callback`;
  const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));

  await putRecord(env, `flow:${flowId}`, {
    kind: "pending-authorization",
    clientId,
    codeVerifier,
    nonce,
    redirectUri,
    returnTo,
    state,
    expiresAt: Date.now() + AUTHORIZATION_LIFETIME_MS,
  });

  const authorizationUrl = new URL(`${issuer(env)}/auth`);
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", `${IDENTITY_SCOPES} offline_access ${MCP_SCOPE}`);
  authorizationUrl.searchParams.set("resource", mcpUrl(env));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", await sha256(codeVerifier));
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const headers = new Headers({ location: authorizationUrl.toString(), "cache-control": "no-store" });
  headers.append("set-cookie", sessionCookie(request, OAUTH_COOKIE, flowId, AUTHORIZATION_LIFETIME_MS / 1_000));
  return new Response(null, { status: 302, headers });
}

async function exchangeCode(env: Env, flow: PendingAuthorization, code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: flow.clientId,
    code,
    code_verifier: flow.codeVerifier,
    redirect_uri: flow.redirectUri,
  });
  body.set("resource", mcpUrl(env));
  const response = await fetch(`${issuer(env)}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`OAuth token exchange failed (${response.status})`);
  return response.json<TokenResponse>();
}

async function userFromIdToken(env: Env, clientId: string, idToken: string, expectedNonce: string): Promise<StoredUser> {
  const jwks = createRemoteJWKSet(new URL(`${issuer(env)}/jwks`));
  const { payload } = await jwtVerify(idToken, jwks, { issuer: issuer(env), audience: clientId });
  if (payload.nonce !== expectedNonce) throw new Error("OIDC nonce mismatch");
  if (!payload.sub || typeof payload.sub !== "string") throw new Error("OIDC token is missing a subject");
  return {
    id: payload.sub,
    username: typeof payload.username === "string" ? payload.username : "Replit user",
    firstName: typeof payload.first_name === "string" ? payload.first_name : undefined,
    lastName: typeof payload.last_name === "string" ? payload.last_name : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
    profileImageUrl: typeof payload.profile_image_url === "string" ? payload.profile_image_url : undefined,
  };
}

async function finishLogin(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const flowId = cookieValue(request, OAUTH_COOKIE);
  if (!flowId) return authFailureRedirect(request, "missing_flow");
  const flow = await getRecord<PendingAuthorization>(env, `flow:${flowId}`);
  await deleteRecord(env, `flow:${flowId}`);
  if (!flow || flow.kind !== "pending-authorization" || flow.expiresAt < Date.now()) return authFailureRedirect(request, "expired_flow");
  if (requestUrl.searchParams.get("state") !== flow.state) return authFailureRedirect(request, "state_mismatch");
  const code = requestUrl.searchParams.get("code");
  if (!code || requestUrl.searchParams.has("error")) return authFailureRedirect(request, "authorization_denied");

  try {
    const tokens = await exchangeCode(env, flow, code);
    if (!tokens.id_token) throw new Error("OIDC token response did not include an ID token");
    const user = await userFromIdToken(env, flow.clientId, tokens.id_token, flow.nonce);
    if (!tokens.access_token) throw new Error("OIDC token response did not include an MCP access token");
    const sessionId = randomToken();
    await putRecord(env, `session:${sessionId}`, {
      kind: "auth-session",
      user,
      expiresAt: Date.now() + SESSION_LIFETIME_MS,
      oauthClientId: flow.clientId,
      mcpAccess: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + Math.max(1, tokens.expires_in ?? 3_600) * 1_000,
      },
    });
    const headers = new Headers({ location: flow.returnTo, "cache-control": "no-store" });
    headers.append("set-cookie", clearCookie(request, OAUTH_COOKIE));
    headers.append("set-cookie", sessionCookie(request, SESSION_COOKIE, sessionId, SESSION_LIFETIME_MS / 1_000));
    return new Response(null, { status: 302, headers });
  } catch {
    return authFailureRedirect(request, "callback_failed");
  }
}

function authFailureRedirect(request: Request, code: string): Response {
  const location = new URL("/learn", request.url);
  location.searchParams.set("authError", code);
  const headers = new Headers({ location: location.toString(), "cache-control": "no-store" });
  headers.append("set-cookie", clearCookie(request, OAUTH_COOKIE));
  return new Response(null, { status: 302, headers });
}

async function authenticatedSession(request: Request, env: Env): Promise<AuthSession | undefined> {
  const id = cookieValue(request, SESSION_COOKIE);
  if (!id) return undefined;
  const session = await getRecord<AuthSession>(env, `session:${id}`);
  if (!session || session.kind !== "auth-session" || session.expiresAt < Date.now()) {
    await deleteRecord(env, `session:${id}`);
    return undefined;
  }

  return session;
}

async function refreshMcpAccess(env: Env, sessionId: string, session: AuthSession): Promise<AuthSession | undefined> {
  const access = session.mcpAccess;
  if (!access || !session.oauthClientId) return undefined;
  if (access.expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) return session;
  if (!access.refreshToken) return undefined;

  const response = await fetch(`${issuer(env)}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: session.oauthClientId,
      refresh_token: access.refreshToken,
      resource: mcpUrl(env),
    }),
  });
  if (!response.ok) return undefined;
  const tokens = await response.json<TokenResponse>();
  if (!tokens.access_token) return undefined;

  const refreshed: AuthSession = {
    ...session,
    mcpAccess: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? access.refreshToken,
      expiresAt: Date.now() + Math.max(1, tokens.expires_in ?? 3_600) * 1_000,
    },
  };
  await putRecord(env, `session:${sessionId}`, refreshed);
  return refreshed;
}

type SafeApp = {
  id: string;
  title: string;
  url?: string;
  updatedAt?: string;
};

type McpEnvelope = {
  id?: string | number;
  result?: unknown;
  error?: { code?: number; message?: string };
};

class McpAuthorizationError extends Error {}

function safeString(value: unknown, maxLength: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : undefined;
}

function safeReplitUrl(value: unknown): string | undefined {
  const text = safeString(value, 2_048);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    return url.protocol === "https:" && (url.hostname === "replit.com" || url.hostname.endsWith(".replit.com"))
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function parseSseEnvelopes(text: string): McpEnvelope[] {
  return text.split(/\n\n+/).flatMap((block) => {
    const data = block.split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return [];
    try {
      return [JSON.parse(data) as McpEnvelope];
    } catch {
      return [];
    }
  });
}

async function mcpRpc(
  env: Env,
  accessToken: string,
  body: Record<string, unknown>,
  expectedId?: string | number,
  protocolVersion?: string,
  timeoutMs = 15_000,
): Promise<unknown> {
  const headers = new Headers({
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  });
  if (protocolVersion) headers.set("mcp-protocol-version", protocolVersion);

  const response = await fetch(mcpUrl(env), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status === 401 || response.status === 403) throw new McpAuthorizationError("MCP authorization expired");
  if (!response.ok) throw new Error(`MCP request failed (${response.status})`);
  if (response.status === 202 || expectedId === undefined) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const envelopes = contentType.includes("text/event-stream")
    ? parseSseEnvelopes(text)
    : [JSON.parse(text) as McpEnvelope];
  const envelope = envelopes.find((item) => item.id === expectedId) ?? envelopes[0];
  if (!envelope) throw new Error("MCP response did not include a JSON-RPC result");
  if (envelope.error) throw new Error(envelope.error.message ?? "MCP tool call failed");
  return envelope.result;
}

async function initializeMcp(env: Env, accessToken: string): Promise<string> {
  const initialized = await mcpRpc(env, accessToken, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "replit-learn-ask-ai", version: "0.1.0" },
    },
  }, 1);
  const negotiated = initialized && typeof initialized === "object"
    ? safeString((initialized as Record<string, unknown>).protocolVersion, 80) ?? MCP_PROTOCOL_VERSION
    : MCP_PROTOCOL_VERSION;
  await mcpRpc(env, accessToken, {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  }, undefined, negotiated);
  return negotiated;
}

function appsFromToolResult(value: unknown): unknown[] {
  if (!value || typeof value !== "object") return [];
  const result = value as Record<string, unknown>;
  const structured = result.structuredContent && typeof result.structuredContent === "object"
    ? result.structuredContent as Record<string, unknown>
    : undefined;
  if (Array.isArray(structured?.apps)) return structured.apps;

  if (!Array.isArray(result.content)) return [];
  for (const block of result.content) {
    if (!block || typeof block !== "object") continue;
    const text = (block as Record<string, unknown>).text;
    if (typeof text !== "string") continue;
    try {
      const parsed = JSON.parse(text) as { apps?: unknown[] };
      if (Array.isArray(parsed.apps)) return parsed.apps;
    } catch {
      // Presentation text can precede the JSON mirror; keep looking.
    }
  }
  return [];
}

function sanitizeApps(value: unknown[]): SafeApp[] {
  return value.slice(0, 20).flatMap((app) => {
    if (!app || typeof app !== "object") return [];
    const item = app as Record<string, unknown>;
    const id = safeString(item.replId, 160);
    if (!id) return [];
    return [{
      id,
      title: safeString(item.title, 160) ?? "Untitled app",
      url: safeReplitUrl(item.replUrl),
      updatedAt: safeString(item.timeUpdated, 80),
    }];
  });
}

async function listMcpApps(env: Env, accessToken: string): Promise<SafeApp[]> {
  const negotiated = await initializeMcp(env, accessToken);
  const result = await mcpRpc(env, accessToken, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "list_apps", arguments: { limit: 10 } },
  }, 2, negotiated);
  return sanitizeApps(appsFromToolResult(result));
}

function answerFromToolResult(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const result = value as Record<string, unknown>;
  if (result.structuredContent && typeof result.structuredContent === "object") {
    const structured = result.structuredContent as Record<string, unknown>;
    for (const key of ["answer", "response", "output", "text"]) {
      const answer = safeString(structured[key], 20_000)?.trim();
      if (answer) return answer;
    }
  }
  if (!Array.isArray(result.content)) return undefined;
  const text = result.content.flatMap((block) => {
    if (!block || typeof block !== "object") return [];
    const value = (block as Record<string, unknown>).text;
    return typeof value === "string" ? [value.trim()] : [];
  }).filter(Boolean).join("\n\n");
  return text || undefined;
}

async function askMcpQuestion(env: Env, accessToken: string, replId: string, question: string): Promise<string> {
  const negotiated = await initializeMcp(env, accessToken);
  const result = await mcpRpc(env, accessToken, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "ask_question", arguments: { replId, question } },
  }, 2, negotiated, 90_000);
  const answer = answerFromToolResult(result);
  if (!answer) throw new Error("MCP question did not return an answer");
  return answer;
}

async function mcpAppsResponse(request: Request, env: Env): Promise<Response> {
  const sessionId = cookieValue(request, SESSION_COOKIE);
  const session = await authenticatedSession(request, env);
  if (!session || !sessionId) return json({ error: "authentication_required" }, { status: 401 });
  if (!session.mcpAccess || !session.oauthClientId) return json({ status: "reauth_required" });

  const authorized = await refreshMcpAccess(env, sessionId, session);
  if (!authorized?.mcpAccess) return json({ status: "reauth_required" });
  try {
    const apps = await listMcpApps(env, authorized.mcpAccess.accessToken);
    return json({ status: "ready", apps });
  } catch (error) {
    if (error instanceof McpAuthorizationError) return json({ status: "reauth_required" });
    return json({ status: "temporarily_unavailable" }, { status: 503 });
  }
}

async function loadDocsIndex(request: Request, env: Env): Promise<DocsIndex> {
  if (docsIndexCache) return docsIndexCache;
  const response = await env.ASSETS.fetch(new Request(new URL(DOCS_INDEX_PATH, request.url)));
  if (!response.ok) throw new Error("Documentation index is unavailable");
  const index = await response.json<DocsIndex>();
  if (!Array.isArray(index.chunks) || !index.chunks.length) throw new Error("Documentation index is empty");
  docsIndexCache = index;
  return index;
}

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for", "from", "how", "i", "in", "is", "it", "my", "of", "on", "or", "the", "this", "to", "what", "when", "with"]);
const QUERY_EXPANSIONS: Record<string, string[]> = {
  app: ["project", "repl"], project: ["app", "repl"], deploy: ["publish", "deployment"], deployment: ["publish", "deploy"],
  publish: ["deploy", "deployment"], payment: ["billing", "subscription"], plan: ["billing", "subscription"],
};

function searchTerms(value: string): string[] {
  const terms = value.toLocaleLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];
  const useful = terms.filter((term) => !STOP_WORDS.has(term));
  return [...new Set(useful.flatMap((term) => [term, ...(QUERY_EXPANSIONS[term] ?? [])]))];
}

function lexicalDocsSearch(index: DocsIndex, question: string, preferredPaths: string[], currentPage?: string): DocsChunk[] {
  const terms = searchTerms(question);
  const phrase = question.toLocaleLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return index.chunks.map((chunk) => {
    const title = `${chunk.title} ${chunk.heading}`.toLocaleLowerCase();
    const body = chunk.text.toLocaleLowerCase();
    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 8;
      const occurrences = body.split(term).length - 1;
      score += Math.min(occurrences, 5) * 1.5;
    }
    if (phrase.length > 8 && body.includes(phrase)) score += 12;
    if (preferredPaths.some((item) => chunk.pageUrl === item || chunk.url.startsWith(`${item}#`))) score += 18;
    if (currentPage && chunk.pageUrl === currentPage) score += 3;
    return { chunk, score };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.chunk);
}

async function embedTexts(env: Env, texts: string[]): Promise<number[][] | undefined> {
  if (!env.OPENAI_API_KEY || !texts.length) return undefined;
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS, input: texts }),
  });
  if (!response.ok) throw new Error(`OpenAI embeddings failed (${response.status})`);
  const result = await response.json<{ data?: Array<{ embedding?: unknown }> }>();
  return result.data?.flatMap((item) => Array.isArray(item.embedding) && item.embedding.every((value) => typeof value === "number") ? [item.embedding as number[]] : []) ?? [];
}

async function semanticDocsSearch(env: Env, index: DocsIndex, question: string): Promise<DocsChunk[]> {
  if (!env.LEARN_VECTORIZE || !env.OPENAI_API_KEY) return [];
  try {
    const embeddings = await embedTexts(env, [question]);
    if (!embeddings?.[0]) return [];
    const result = await env.LEARN_VECTORIZE.query(embeddings[0], { topK: 8, returnMetadata: "none" });
    const byId = new Map(index.chunks.map((chunk) => [chunk.id, chunk]));
    return (result.matches ?? []).filter((match) => match.score >= 0.55).flatMap((match) => byId.get(match.id) ?? []);
  } catch {
    return [];
  }
}

async function retrieveDocs(request: Request, env: Env, question: string, preferredPaths: string[], currentPage?: string): Promise<DocsChunk[]> {
  const index = await loadDocsIndex(request, env);
  const [semantic, lexical] = await Promise.all([
    semanticDocsSearch(env, index, question),
    Promise.resolve(lexicalDocsSearch(index, question, preferredPaths, currentPage)),
  ]);
  const combined = [...semantic, ...lexical];
  return [...new Map(combined.map((chunk) => [chunk.id, chunk])).values()].slice(0, 6);
}

function extractiveDocsAnswer(question: string, chunks: DocsChunk[]): string {
  if (!chunks.length) return "I couldn’t find a relevant answer in the current Replit Learn content. Try naming the concept or lesson more specifically.";
  const passages = chunks.slice(0, 3).map((chunk) => {
    const sentences = chunk.text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) ?? [chunk.text];
    return sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 30).slice(0, 2).join(" ");
  }).filter(Boolean);
  return `Here’s what Replit Learn says about “${question}”:\n\n${passages.join("\n\n")}`;
}

async function groundedDocsAnswer(env: Env, question: string, history: Array<{ question: string; answer: string }>, chunks: DocsChunk[]): Promise<string> {
  if (!env.OPENAI_API_KEY || !chunks.length) return extractiveDocsAnswer(question, chunks);
  const context = chunks.map((chunk, index) => `[${index + 1}] ${chunk.title} — ${chunk.heading}\n${chunk.text}`).join("\n\n");
  const conversation = history.slice(-4).map((turn) => `User: ${turn.question}\nAssistant: ${turn.answer}`).join("\n\n");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: ANSWER_MODEL,
        instructions: "Answer questions using only the supplied Replit Learn sources. Give a direct, practical answer first, then concise steps when useful. Be honest about missing information. Do not invent URLs or capabilities.",
        input: `${conversation ? `${conversation}\n\n` : ""}Question: ${question}\n\nSources:\n${context}`,
        max_output_tokens: 700,
        store: false,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI response failed (${response.status})`);
    const result = await response.json<{ output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }>();
    const answer = result.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("").trim();
    return answer || extractiveDocsAnswer(question, chunks);
  } catch {
    return extractiveDocsAnswer(question, chunks);
  }
}

function streamedAnswer(answer: string, sources: RagSource[] = [], kind: "docs" | "project" = "project"): Response {
  const encoder = new TextEncoder();
  const words = answer.match(/\S+\s*/g) ?? [answer];
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "meta", kind, sources })}\n`));
      for (let index = 0; index < words.length; index += 4) {
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "delta", text: words.slice(index, index + 4).join("") })}\n`));
        if (index + 4 < words.length) await new Promise((resolve) => setTimeout(resolve, 22));
      }
      controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done" })}\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

async function indexVectorBatch(request: Request, env: Env): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!env.RAG_INDEX_SECRET || authorization !== `Bearer ${env.RAG_INDEX_SECRET}`) return json({ error: "not_found" }, { status: 404 });
  if (!env.OPENAI_API_KEY || !env.LEARN_VECTORIZE) return json({ error: "vector_bindings_required" }, { status: 503 });
  let body: { chunks?: unknown; deleteSourceIds?: unknown };
  try {
    body = await request.json<{ chunks?: unknown; deleteSourceIds?: unknown }>();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }
  const deleteSourceIds = Array.isArray(body.deleteSourceIds)
    ? body.deleteSourceIds.flatMap((value) => safeString(value, 40)?.match(/^[a-f0-9]{20}$/) ? [String(value)] : []).slice(0, 50)
    : [];
  const vectorIdsToDelete = deleteSourceIds.flatMap((sourceId) =>
    Array.from({ length: 256 }, (_, slot) => `${sourceId}:${String(slot).padStart(3, "0")}`),
  );
  for (let offset = 0; offset < vectorIdsToDelete.length; offset += 100) {
    await env.LEARN_VECTORIZE.deleteByIds(vectorIdsToDelete.slice(offset, offset + 100));
  }
  const chunks = Array.isArray(body.chunks) ? body.chunks.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const id = safeString(item.id, 64);
    const sourceId = safeString(item.sourceId, 40);
    const title = safeString(item.title, 300);
    const heading = safeString(item.heading, 300);
    const text = safeString(item.text, 2_500);
    const url = safeString(item.url, 700);
    if (!id?.match(/^[a-f0-9]{20}:\d{3}$/) || !sourceId?.match(/^[a-f0-9]{20}$/) || !title || !heading || !text || !url?.startsWith("/")) return [];
    return [{ id, sourceId, title, heading, text, url }];
  }).slice(0, 20) : [];
  if (chunks.length) {
    const embeddings = await embedTexts(env, chunks.map((chunk) => `${chunk.title}\n${chunk.heading}\n${chunk.text}`));
    if (!embeddings || embeddings.length !== chunks.length) throw new Error("Embedding batch failed");
    await env.LEARN_VECTORIZE.upsert(chunks.map((chunk, index) => ({
      id: chunk.id,
      values: embeddings[index],
      metadata: { sourceId: chunk.sourceId, title: chunk.title.slice(0, 200), heading: chunk.heading.slice(0, 200), url: chunk.url.slice(0, 500) },
    })));
  }
  return json({ ok: true, indexed: chunks.length, deletedSources: deleteSourceIds.length });
}

async function askResponse(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin" }, { status: 403 });
  const sessionId = cookieValue(request, SESSION_COOKIE);
  const session = await authenticatedSession(request, env);
  if (!session || !sessionId) return json({ error: "authentication_required" }, { status: 401 });
  if (!session.mcpAccess || !session.oauthClientId) return json({ error: "reauth_required" }, { status: 401 });

  let body: { appId?: unknown; question?: unknown; docs?: unknown; history?: unknown; currentPage?: unknown };
  try {
    body = await request.json<{ appId?: unknown; question?: unknown; docs?: unknown; history?: unknown; currentPage?: unknown }>();
  } catch {
    return json({ error: "invalid_request" }, { status: 400 });
  }
  const appId = safeString(body.appId, 160)?.trim();
  const question = safeString(body.question, 4_000)?.trim();
  if (!question) return json({ error: "question_required" }, { status: 400 });
  const currentPage = safeString(body.currentPage, 500)?.trim();
  const docs = Array.isArray(body.docs) ? body.docs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const label = safeString(record.label, 160)?.trim();
    const path = safeString(record.path, 500)?.trim();
    if (!label || !path || !path.startsWith("/") || path.startsWith("//")) return [];
    return [{ label, path }];
  }).slice(0, 5) : [];
  const history = Array.isArray(body.history) ? body.history.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const previousQuestion = safeString(record.question, 2_000)?.trim();
    const previousAnswer = safeString(record.answer, 4_000)?.trim();
    return previousQuestion && previousAnswer ? [{ question: previousQuestion, answer: previousAnswer }] : [];
  }).slice(-6) : [];
  if (!appId) {
    try {
      const chunks = await retrieveDocs(request, env, question, docs.map((doc) => doc.path), currentPage);
      const answer = await groundedDocsAnswer(env, question, history, chunks);
      const sources = [...new Map(
        chunks.map(({ id, title, heading, url }) => [url.split("#")[0], { id, title, heading, url }]),
      ).values()].slice(0, 4);
      return streamedAnswer(answer, sources, "docs");
    } catch {
      return json({ error: "rag_temporarily_unavailable" }, { status: 503 });
    }
  }

  const historyContext = history.length ? `Conversation so far:\n${history.map((turn) => `User: ${turn.question}\nAssistant: ${turn.answer}`).join("\n\n")}\n\n` : "";
  const docsContext = docs.length ? `\n\nThe learner attached these Replit Learn page references as additional context:\n${docs.map((doc) => `- ${doc.label}: ${doc.path}`).join("\n")}` : "";
  const contextualQuestion = `${historyContext}User's follow-up question: ${question}${docsContext}`;
  const authorized = await refreshMcpAccess(env, sessionId, session);
  if (!authorized?.mcpAccess) return json({ error: "reauth_required" }, { status: 401 });
  try {
    const answer = await askMcpQuestion(env, authorized.mcpAccess.accessToken, appId, contextualQuestion);
    return streamedAnswer(answer, [], "project");
  } catch (error) {
    if (error instanceof McpAuthorizationError) return json({ error: "reauth_required" }, { status: 401 });
    return json({ error: "ask_temporarily_unavailable" }, { status: 503 });
  }
}

async function sessionResponse(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticatedSession(request, env);
    if (!auth) return json({ authenticated: false });
    return json({
      authenticated: true,
      user: auth.user,
    });
  } catch {
    return json({ authenticated: false });
  }
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function logout(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin" }, { status: 403 });
  const id = cookieValue(request, SESSION_COOKIE);
  if (id) await deleteRecord(env, `session:${id}`);
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  headers.append("set-cookie", clearCookie(request, SESSION_COOKIE));
  return new Response(JSON.stringify({ ok: true }), { headers });
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/auth/login" && request.method === "GET") return startLogin(request, env);
  if (pathname === "/api/auth/callback" && request.method === "GET") return finishLogin(request, env);
  if (pathname === "/api/auth/session" && request.method === "GET") return sessionResponse(request, env);
  if (pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
  if (pathname === "/api/mcp/apps" && request.method === "GET") return mcpAppsResponse(request, env);
  if (pathname === "/api/rag/index" && request.method === "POST") return indexVectorBatch(request, env);
  if (pathname === "/api/ask" && request.method === "POST") return askResponse(request, env);
  if (pathname.startsWith("/api/")) return json({ error: "Not found" }, { status: 404 });
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withSecurityHeaders(await route(request, env));
    } catch (error) {
      console.error("Worker request failed", error);
      return withSecurityHeaders(json({ error: "The Replit connection is temporarily unavailable" }, { status: 503 }));
    }
  },
};
