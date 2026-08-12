import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const entryPoints = {
  "background/service-worker": "src/background/service-worker.ts",
  "content/content-script": "src/content/content-script.ts",
  "inject/wa-bridge": "src/inject/wa-bridge.ts",
  "popup/popup": "src/popup/popup.ts",
  "options/options": "src/options/options.ts",
};

const opts = {
  absWorkingDir: __dirname,
  entryPoints,
  outdir: "dist",
  bundle: true,
  format: "esm",
  target: "chrome111",
  sourcemap: false,
  minify: !watch,
  logLevel: "info",
  entryNames: "[dir]/[name]",
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log("👀 esbuild em modo watch...");
} else {
  await build(opts);
}
