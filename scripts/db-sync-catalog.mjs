// Mirrors confirmed courses, their modules, and their lessons from src/course-structure.ts into Neon.
// Upserts everything in the code; anything no longer in the code is archived, never deleted.
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { Pool } from "@neondatabase/serverless";

const url = process.env.NEON_DATABASE_URL;
if (!url) throw new Error("NEON_DATABASE_URL is not set");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "src/course-structure.ts");
const compiled = (await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", target: "es2022" })).outputFiles[0].text;
const { catalogRows } = await import(`data:text/javascript;base64,${Buffer.from(`${compiled}\n//# sourceURL=${pathToFileURL(entry).href}`).toString("base64")}`);
const { courses, modules, lessons } = catalogRows();

const duplicates = lessons.map((lesson) => lesson.id).filter((id, index, all) => all.indexOf(id) !== index);
if (duplicates.length) throw new Error(`Duplicate lesson IDs: ${[...new Set(duplicates)].join(", ")}`);

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const c of courses) await client.query(
    `INSERT INTO courses (id, title, position, published) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET title = $2, position = $3, published = $4, archived_at = NULL, updated_at = now()`,
    [c.id, c.title, c.position, c.published]);
  for (const m of modules) await client.query(
    `INSERT INTO modules (id, course_id, title, position) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET course_id = $2, title = $3, position = $4, archived_at = NULL, updated_at = now()`,
    [m.id, m.courseId, m.title, m.position]);
  for (const p of lessons) await client.query(
    `INSERT INTO lessons (id, module_id, title, url_path, position, has_quiz) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET module_id = $2, title = $3, url_path = $4, position = $5, has_quiz = $6, archived_at = NULL, updated_at = now()`,
    [p.id, p.moduleId, p.title, p.urlPath, p.position, p.hasQuiz]);
  const archived = {
    lessons: (await client.query("UPDATE lessons SET archived_at = now() WHERE archived_at IS NULL AND NOT (id = ANY($1)) RETURNING id", [lessons.map((p) => p.id)])).rowCount,
    modules: (await client.query("UPDATE modules SET archived_at = now() WHERE archived_at IS NULL AND NOT (id = ANY($1)) RETURNING id", [modules.map((m) => m.id)])).rowCount,
    courses: (await client.query("UPDATE courses SET archived_at = now() WHERE archived_at IS NULL AND NOT (id = ANY($1)) RETURNING id", [courses.map((c) => c.id)])).rowCount,
  };
  await client.query("COMMIT");
  console.log(`synced ${courses.length} courses, ${modules.length} modules, ${lessons.length} lessons; archived ${archived.courses}/${archived.modules}/${archived.lessons}`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
