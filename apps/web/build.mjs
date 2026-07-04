// Static site build for GitHub Pages: bundles the real suggestion-engine +
// venue-knowledge services to run client-side, and copies the character demo pages.
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "assets"), { recursive: true });

await build({
  entryPoints: [join(root, "src/main.ts")],
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: true,
  outfile: join(dist, "assets/main.js"),
});

await cp(join(root, "index.html"), join(dist, "index.html"));
await cp(join(root, "../../services/character-engine/assets"), join(dist, "demo"), { recursive: true });

console.log("built apps/web/dist");
