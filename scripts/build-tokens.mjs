import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCss, TokenError } from "./tokens-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "tokens/design.tokens.json");
const target = resolve(root, "src/styles/tokens.css");

try {
  const css = buildCss(JSON.parse(readFileSync(source, "utf8")));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, css);
  console.log(`tokens: wrote ${target.replace(root + "/", "")}`);
} catch (err) {
  if (err instanceof TokenError || err instanceof SyntaxError) {
    console.error(`tokens: build failed: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
