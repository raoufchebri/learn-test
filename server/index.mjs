import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import worker from "../worker/index.ts";
import { createRecordStore } from "./records.mjs";

const root = resolve(import.meta.dirname, "../dist");
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain",
  ".pdf": "application/pdf", ".mp4": "video/mp4",
};
async function assets(request) {
  if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405 });
  let path;
  try { path = resolve(root, "." + decodeURIComponent(new URL(request.url).pathname)); }
  catch { return new Response("Bad request", { status: 400 }); }
  if (path !== root && !path.startsWith(root + sep)) return new Response("Forbidden", { status: 403 });
  try { if (!(await stat(path)).isFile()) throw new Error("Not a file"); }
  catch {
    if (extname(path)) return new Response("Not found", { status: 404 });
    path = resolve(root, "index.html");
  }
  return new Response(request.method === "HEAD" ? null : await readFile(path), {
    headers: {
      "content-type": mime[extname(path)] ?? "application/octet-stream",
      "cache-control": path.startsWith(resolve(root, "assets") + sep)
        ? "public, max-age=31536000, immutable" : "no-cache",
    },
  });
}

const env = {
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RAG_INDEX_SECRET: process.env.RAG_INDEX_SECRET,
  REPLIT_OIDC_ISSUER: process.env.REPLIT_OIDC_ISSUER ?? process.env.ISSUER_URL ?? "https://replit.com/oidc",
  REPLIT_OIDC_CLIENT_ID: process.env.REPLIT_OIDC_CLIENT_ID,
  REPLIT_MCP_URL: process.env.REPLIT_MCP_URL,
  ASSETS: { fetch: assets },
  AUTH_SESSIONS: await createRecordStore(
    process.env.NEON_DATABASE_URL, process.env.SESSION_SECRET,
    process.env.NODE_ENV === "production" ? "production" : "development",
  ),
};
const pending = new Set();
const ctx = {
  waitUntil(promise) {
    const task = Promise.resolve(promise).catch(() => console.error("Background operation failed"));
    pending.add(task);
    task.finally(() => pending.delete(task));
  },
  passThroughOnException() {},
};
const server = createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host;
    if (!host || !incoming.url?.startsWith("/") || incoming.url.startsWith("//")) {
      outgoing.writeHead(400).end(); return;
    }
    const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    const url = new URL(incoming.url, `${local ? "http" : "https"}://${host}`);
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) { outgoing.writeHead(413).end(); return; }
      chunks.push(chunk);
    }
    const method = incoming.method ?? "GET";
    const request = new Request(url, {
      method, headers, body: ["GET", "HEAD"].includes(method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env, ctx);
    outgoing.statusCode = response.status;
    response.headers.forEach((value, name) => { if (name !== "set-cookie") outgoing.setHeader(name, value); });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) outgoing.setHeader("set-cookie", cookies);
    if (!response.body || method === "HEAD") outgoing.end();
    else await pipeline(Readable.fromWeb(response.body), outgoing);
  } catch {
    console.error("HTTP request failed");
    if (!outgoing.headersSent) outgoing.writeHead(500, { "content-type": "application/json", "cache-control": "no-store" });
    outgoing.end('{"error":"Request failed"}');
  }
});
server.listen(Number(process.env.PORT ?? 4173), "0.0.0.0", () => console.log("Replit Learn server ready"));
process.on("SIGTERM", () => {
  server.close(async () => { await Promise.allSettled([...pending]); process.exit(0); });
  setTimeout(() => process.exit(0), 10_000).unref();
});
