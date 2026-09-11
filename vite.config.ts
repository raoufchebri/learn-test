import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";

const execFileAsync = promisify(execFile);
const learnContentPath = fileURLToPath(new URL("./src/learn-content.ts", import.meta.url));
const foundationContentPath = fileURLToPath(new URL("./src/app-foundation-content.ts", import.meta.url));
const discoverContentPath = fileURLToPath(new URL("./src/discover-content.ts", import.meta.url));
const learnIndexScript = fileURLToPath(new URL("./scripts/generate-learn-index.mjs", import.meta.url));

const learnIndexDevelopmentPlugin = {
  name: "replit-learn-index",
  async handleHotUpdate({ file, server }: { file: string; server: { ws: { send(payload: { type: "full-reload" }): void } } }) {
    if (file !== learnContentPath && file !== foundationContentPath && file !== discoverContentPath) return;
    await execFileAsync(process.execPath, [learnIndexScript]);
    server.ws.send({ type: "full-reload" });
    return [];
  },
};

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      // Preserve the browser's host for OAuth callbacks and same-origin checks.
      '/api': { target: 'http://127.0.0.1:4173', changeOrigin: false },
    },
  },
  // Learn currently uses typed lesson data. Keeping the Fumadocs MDX compiler
  // here preserves the migration architecture for incremental MDX adoption.
  plugins: [learnIndexDevelopmentPlugin, fumadocsMdx(), react()],
});
