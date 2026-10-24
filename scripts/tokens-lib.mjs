// Validates DTCG 2025.10 design tokens and turns them into CSS custom properties.
// Kept dependency-free so it runs before `next dev` / `next build` and in tests.

const SUPPORTED_TYPES = new Set(["color", "dimension", "fontFamily", "fontWeight", "number"]);
const REFERENCE = /^\{([^{}]+)\}$/;

export class TokenError extends Error {}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Walk the tree and collect every token with its resolved $type (types inherit from groups). */
function collect(node, path, inheritedType, out) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (child === null || typeof child !== "object" || Array.isArray(child)) {
      throw new TokenError(`${[...path, key].join(".")}: expected a token or group object`);
    }
    const here = [...path, key];
    if ("value" in child && !("$value" in child)) {
      throw new TokenError(`${here.join(".")}: uses legacy "value"; DTCG tokens must use "$value"`);
    }
    if ("$value" in child) {
      if ("value" in child) throw new TokenError(`${here.join(".")}: mixes "value" and "$value"`);
      const type = child.$type ?? inheritedType;
      if (!type) throw new TokenError(`${here.join(".")}: no $type on the token or any parent group`);
      if (!SUPPORTED_TYPES.has(type)) throw new TokenError(`${here.join(".")}: unsupported $type "${type}"`);
      out.set(here.join("."), { path: here, type, raw: child.$value });
    } else {
      collect(child, here, child.$type ?? inheritedType, out);
    }
  }
}

function checkLiteral(token) {
  const { type, raw, path } = token;
  const where = path.join(".");
  const fail = (msg) => { throw new TokenError(`${where}: ${msg}`); };
  switch (type) {
    case "color": {
      if (raw?.colorSpace !== "srgb") fail("colors must use colorSpace \"srgb\"");
      const c = raw.components;
      if (!Array.isArray(c) || c.length !== 3 || c.some((n) => typeof n !== "number" || n < 0 || n > 1)) fail("srgb components must be three numbers from 0 to 1");
      if (raw.alpha !== undefined && (typeof raw.alpha !== "number" || raw.alpha < 0 || raw.alpha > 1)) fail("alpha must be from 0 to 1");
      break;
    }
    case "dimension":
      if (typeof raw?.value !== "number" || !["px", "rem"].includes(raw?.unit)) fail("dimensions need a numeric value and unit px or rem");
      break;
    case "fontFamily":
      if (!(typeof raw === "string" || (Array.isArray(raw) && raw.length > 0 && raw.every((f) => typeof f === "string")))) fail("fontFamily must be a string or non-empty string array");
      break;
    case "fontWeight":
      if (!(typeof raw === "number" && raw >= 1 && raw <= 1000)) fail("fontWeight must be a number from 1 to 1000");
      break;
    case "number":
      if (typeof raw !== "number") fail("number tokens need a numeric $value");
      break;
  }
}

/** Resolve references, rejecting unknown targets, type mismatches and cycles. */
function resolveAll(tokens) {
  const resolved = new Map();
  const resolve = (name, stack) => {
    if (resolved.has(name)) return resolved.get(name);
    const token = tokens.get(name);
    if (stack.includes(name)) throw new TokenError(`circular reference: ${[...stack, name].join(" -> ")}`);
    let value = token.raw;
    let ref = null;
    if (typeof value === "string") {
      const m = value.match(REFERENCE);
      if (m) {
        ref = m[1];
        const target = tokens.get(ref);
        if (!target) throw new TokenError(`${name}: references unknown token {${ref}}`);
        if (target.type !== token.type) throw new TokenError(`${name}: ${token.type} token references ${target.type} token {${ref}}`);
        value = resolve(ref, [...stack, name]).value;
      }
    }
    if (!ref) checkLiteral(token);
    const result = { ...token, value, ref };
    resolved.set(name, result);
    return result;
  };
  for (const name of tokens.keys()) resolve(name, []);
  return resolved;
}

const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");

function cssValue(token) {
  const v = token.value;
  switch (token.type) {
    case "color": {
      const [r, g, b] = v.components;
      const a = v.alpha ?? 1;
      return a === 1 ? `#${toHex(r)}${toHex(g)}${toHex(b)}` : `rgb(${[r, g, b].map((n) => Math.round(n * 255)).join(" ")} / ${a})`;
    }
    case "dimension":
      return `${v.value}${v.unit}`;
    case "fontFamily":
      return (Array.isArray(v) ? v : [v]).map((f) => (/^[a-z-]+$/.test(f) ? f : `"${f}"`)).join(", ");
    default:
      return String(v);
  }
}

/** CSS variable name for a token path. Theme tokens drop the theme name; primitives get a prefix. */
export function cssVarName(path) {
  if (path[0] === "theme") return `--color-${path.slice(2).map(kebab).join("-")}`;
  if (path[0] === "color") return `--primitive-${path.map(kebab).join("-")}`;
  return `--${path.map(kebab).join("-")}`;
}

/** Validate a parsed DTCG document and return the generated stylesheet. Throws TokenError when invalid. */
export function buildCss(doc, { defaultTheme = "dark" } = {}) {
  const tokens = new Map();
  collect(doc, [], undefined, tokens);
  const resolved = resolveAll(tokens);

  const themes = Object.keys(doc.theme ?? {}).filter((k) => !k.startsWith("$"));
  if (!themes.includes(defaultTheme)) throw new TokenError(`default theme "${defaultTheme}" is not defined under theme`);
  const themeKeys = themes.map((t) => new Set([...resolved.values()].filter((r) => r.path[1] === t && r.path[0] === "theme").map((r) => r.path.slice(2).join("."))));
  for (let i = 1; i < themeKeys.length; i++) {
    const missing = [...themeKeys[0]].filter((k) => !themeKeys[i].has(k));
    const extra = [...themeKeys[i]].filter((k) => !themeKeys[0].has(k));
    if (missing.length || extra.length) throw new TokenError(`theme "${themes[i]}" does not match theme "${themes[0]}" (missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"})`);
  }

  const line = (r) => `  ${cssVarName(r.path)}: ${r.ref && r.path[0] === "theme" ? `var(${cssVarName(r.ref.split("."))})` : cssValue(r)};`;
  const shared = [...resolved.values()].filter((r) => r.path[0] !== "theme");
  const blocks = [`/* Generated by scripts/build-tokens.mjs from tokens/design.tokens.json. Do not edit. */`, `:root {\n${shared.map(line).join("\n")}\n}`];
  for (const theme of themes) {
    const selector = theme === defaultTheme ? `:root, [data-theme="${theme}"]` : `[data-theme="${theme}"]`;
    const rows = [...resolved.values()].filter((r) => r.path[0] === "theme" && r.path[1] === theme);
    blocks.push(`${selector} {\n  color-scheme: ${theme === "light" ? "light" : "dark"};\n${rows.map(line).join("\n")}\n}`);
  }
  return blocks.join("\n\n") + "\n";
}
