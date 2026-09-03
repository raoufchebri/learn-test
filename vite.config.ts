import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";

const execFileAsync = promisify(execFile);
const learnContentPath = fileURLToPath(new URL("./src/learn-content.ts", import.meta.url));
const learnIndexScript = fileURLToPath(new URL("./scripts/generate-learn-index.mjs", import.meta.url));

const learnIndexDevelopmentPlugin = {
  name: "replit-learn-index",
  async handleHotUpdate({ file, server }: { file: string; server: { ws: { send(payload: { type: "full-reload" }): void } } }) {
    if (file !== learnContentPath) return;
    await execFileAsync(process.execPath, [learnIndexScript]);
    server.ws.send({ type: "full-reload" });
    return [];
  },
};

export default defineConfig({
  // Learn currently uses typed lesson data. Keeping the Fumadocs MDX compiler
  // here preserves the migration architecture for incremental MDX adoption.
  plugins: [learnIndexDevelopmentPlugin, fumadocsMdx(), react()],
});
