import { build } from "esbuild";

await build({
  entryPoints: ["server/index.mjs"], outfile: "server-dist/index.mjs",
  bundle: true, packages: "external", platform: "node", format: "esm", target: "node22",
});
