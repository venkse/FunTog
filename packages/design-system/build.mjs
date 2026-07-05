// Build: ESM JS bundle (react external) + concatenated stylesheet + .d.ts via tsc.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await build({
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  format: "esm",
  target: ["es2019"],
  external: ["react", "react-dom", "react/jsx-runtime"],
  outfile: join(dist, "index.js"),
  sourcemap: true,
});

// stylesheet: fonts import must stay first for CSS validity
const tokens = await readFile(join(root, "src/tokens.css"), "utf8");
const components = await readFile(join(root, "src/components.css"), "utf8");
const fonts = `@import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap");\n`;
await writeFile(join(dist, "styles.css"), fonts + "\n" + tokens + "\n" + components);

execSync("npx tsc -p tsconfig.json", { cwd: root, stdio: "inherit" });

console.log("built @funtog/design-system -> dist/");
