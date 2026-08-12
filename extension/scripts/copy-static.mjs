// Copia os arquivos estáticos (manifest, HTML, CSS, ícones) pra dist/,
// espelhando a mesma estrutura de pastas que o esbuild usa pro JS.
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });

cpSync(join(root, "manifest.json"), join(dist, "manifest.json"));
cpSync(join(root, "icons"), join(dist, "icons"), { recursive: true });

const staticFiles = [
  ["src/popup/popup.html", "popup/popup.html"],
  ["src/popup/popup.css", "popup/popup.css"],
  ["src/options/options.html", "options/options.html"],
  ["src/options/options.css", "options/options.css"],
  ["src/styles/tokens.css", "styles/tokens.css"],
];

for (const [from, to] of staticFiles) {
  const src = join(root, from);
  if (!existsSync(src)) continue;
  mkdirSync(dirname(join(dist, to)), { recursive: true });
  cpSync(src, join(dist, to));
}

console.log(`✓ Estáticos copiados pra ${dist}`);
