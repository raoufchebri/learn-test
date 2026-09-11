import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "src/learn-content.ts");
const outputPath = resolve(projectRoot, "public/retrieval/replit-learn-index.json");

let previousSourceIds = [];
let previousDeletedSourceIds = [];
let previousGeneratedAt = "";
let previousHash = "";
try {
  const previousManifest = JSON.parse(await readFile(outputPath, "utf8"));
  if (Array.isArray(previousManifest.sourceIds)) previousSourceIds = previousManifest.sourceIds;
  if (Array.isArray(previousManifest.deletedSourceIds)) previousDeletedSourceIds = previousManifest.deletedSourceIds;
  if (typeof previousManifest.generatedAt === "string") previousGeneratedAt = previousManifest.generatedAt;
  if (typeof previousManifest.hash === "string") previousHash = previousManifest.hash;
} catch {
  // The first generation has no earlier manifest to compare against.
}

const segment = (value) => value
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const compiledSource = await build({
  entryPoints: [sourcePath],
  bundle: true,
  write: false,
  format: "esm",
  target: "es2022",
});
const compiled = compiledSource.outputFiles[0].text;

const encoded = Buffer.from(`${compiled}\n//# sourceURL=${pathToFileURL(sourcePath).href}`).toString("base64");
const lessonsModule = await import(`data:text/javascript;base64,${encoded}`);
const allLessons = [
  ...lessonsModule.appFoundationLessons,
  ...Object.values(lessonsModule.courseLessons).flat(),
];

const welcomeUrl = "/learn";
const welcomeSourceId = createHash("sha256").update(welcomeUrl).digest("hex").slice(0, 20);
const chunks = [{
  id: `${welcomeSourceId}:000`,
  sourceId: welcomeSourceId,
  title: "Welcome to Replit Learn",
  heading: "Overview",
  text: [
    "Replit Learn",
    "Build with confidence.",
    "A practical learning path from a blank idea to a production-ready application.",
    "Learn how Replit projects fit together, how the Workspace supports your work, and how to build, publish, and share an app.",
  ].join("\n"),
  url: welcomeUrl,
  pageUrl: welcomeUrl,
  sourcePath: `src/main.tsx#${welcomeSourceId}`,
}];
for (const lesson of allLessons) {
  const pageUrl = `/learn/${segment(lesson.module)}/${segment(lesson.title)}`;
  const stableSourceId = createHash("sha256").update(pageUrl).digest("hex").slice(0, 20);
  const lessonSections = [
    {
      heading: "Overview",
      text: [lesson.module, lesson.summary, ...(lesson.introduction ?? []).flatMap((part) => typeof part === 'string' ? [part] : [part.text, ...part.items]), ...(lesson.outcomes ?? []), lesson.replitExample].join("\n"),
    },
    ...lesson.sections.map((section) => ({
      heading: section.heading,
      text: [lesson.module, section.body, ...(section.prompt ? [section.prompt] : []), ...(section.afterPrompt ? [section.afterPrompt] : []), ...(section.items ?? []), ...(section.image ? [section.image.alt, section.image.caption, section.image.source] : [])].join("\n"),
    })),
    ...(lesson.practice ? [{ heading: 'Your turn', text: [lesson.practice.prompt, ...lesson.practice.checks].join('\n') }] : []),
  ];

  lessonSections.forEach((section, slot) => {
    chunks.push({
      id: `${stableSourceId}:${String(slot).padStart(3, "0")}`,
      sourceId: stableSourceId,
      title: lessonsModule.learnDisplayTitle(lesson.title),
      heading: section.heading,
      text: section.text,
      url: slot === 0 ? pageUrl : `${pageUrl}#${section.id ?? segment(section.heading)}`,
      pageUrl,
      sourcePath: `src/learn-content.ts#${stableSourceId}`,
    });
  });
}

const seenIds = new Set();
for (const chunk of chunks) {
  if (!/^[a-f0-9]{20}:\d{3}$/.test(chunk.id)) throw new Error(`Invalid chunk id: ${chunk.id}`);
  if (!/^[a-f0-9]{20}$/.test(chunk.sourceId)) throw new Error(`Invalid source id: ${chunk.sourceId}`);
  if (!chunk.title || !chunk.heading || !chunk.text) throw new Error(`Incomplete chunk: ${chunk.id}`);
  if (!chunk.url.startsWith("/") || !chunk.pageUrl.startsWith("/")) throw new Error(`Invalid URL: ${chunk.url}`);
  if (seenIds.has(chunk.id)) throw new Error(`Duplicate chunk id: ${chunk.id}`);
  seenIds.add(chunk.id);
}

const sourceIds = [...new Set(chunks.map((chunk) => chunk.sourceId))].sort();
const deletedSourceIds = [...new Set([
  ...previousDeletedSourceIds,
  ...previousSourceIds.filter((sourceId) => !sourceIds.includes(sourceId)),
])].filter((sourceId) => !sourceIds.includes(sourceId)).sort();
const hash = createHash("sha256").update(JSON.stringify(chunks)).digest("hex");
const payload = {
  version: 2,
  generatedAt: previousHash === hash && previousGeneratedAt ? previousGeneratedAt : new Date().toISOString(),
  mode: "full",
  hash,
  sourceIds,
  deletedSourceIds,
  sourcePaths: [...new Set(chunks.map((chunk) => chunk.sourcePath))].sort(),
  chunks,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Generated ${chunks.length} Learn search chunks from ${allLessons.length} lessons and the Learn overview.`);
