import { readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2];
const endpoint = process.env.RAG_INDEX_ENDPOINT;
const secret = process.env.RAG_INDEX_SECRET;

if (!manifestPath) throw new Error("Usage: node scripts/upsert-rag-manifest.mjs <manifest.json>");
if (!endpoint || !secret) throw new Error("RAG_INDEX_ENDPOINT and RAG_INDEX_SECRET are required.");

const manifest = JSON.parse(await readFile(path.resolve(manifestPath), "utf8"));
if (!Array.isArray(manifest.chunks) || !Array.isArray(manifest.sourceIds) || !Array.isArray(manifest.deletedSourceIds)) {
  throw new Error("Invalid Learn index manifest.");
}

async function post(body, attempt = 1) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return response.json();
  if (attempt < 4 && (response.status === 429 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** (attempt - 1)));
    return post(body, attempt + 1);
  }
  throw new Error(`Learn index request failed (${response.status}): ${await response.text()}`);
}

const sourceIds = process.env.RAG_SKIP_DELETE === "1"
  ? []
  : [...new Set([...manifest.sourceIds, ...manifest.deletedSourceIds])];

for (let offset = 0; offset < sourceIds.length; offset += 50) {
  await post({ deleteSourceIds: sourceIds.slice(offset, offset + 50), chunks: [] });
}

for (let offset = 0; offset < manifest.chunks.length; offset += 20) {
  const batch = manifest.chunks.slice(offset, offset + 20);
  await post({ chunks: batch, deleteSourceIds: [] });
  console.log(`Upserted ${Math.min(offset + batch.length, manifest.chunks.length)}/${manifest.chunks.length} chunks.`);
}

console.log(`Learn index complete: ${manifest.chunks.length} chunks, ${sourceIds.length} refreshed or deleted sources.`);
