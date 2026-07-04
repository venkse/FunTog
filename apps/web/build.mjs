// Static site build for GitHub Pages: bundles the real suggestion-engine +
// venue-knowledge services to run client-side, and copies the character demo pages.
import { build } from "esbuild";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
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
  // down-level modern syntax (?., ??, class fields) for older mobile browsers
  target: ["es2019", "safari13"],
  outfile: join(dist, "assets/main.js"),
});

await cp(join(root, "index.html"), join(dist, "index.html"));
await cp(join(root, "../../services/character-engine/assets"), join(dist, "demo"), { recursive: true });

// build stamp: the post-deploy checkout polls this to know the CDN serves THIS build
await writeFile(join(dist, "version.json"), JSON.stringify({
  commit: process.env.GITHUB_SHA ?? "dev",
  builtAt: new Date().toISOString(),
}));

console.log("built apps/web/dist");
