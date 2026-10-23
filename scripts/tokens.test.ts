import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCss, TokenError } from "./tokens-lib.mjs";

const source = () => JSON.parse(readFileSync(new URL("../tokens/design.tokens.json", import.meta.url), "utf8"));

describe("design tokens", () => {
  it("builds CSS for both themes, with dark as the default", () => {
    const css = buildCss(source());
    expect(css).toContain(':root, [data-theme="dark"] {');
    expect(css).toContain('[data-theme="light"] {');
    expect(css).toContain("--color-bg-canvas: var(--primitive-color-neutral-950);");
    expect(css).toContain("--size-touch-target: 48px;");
    expect(css).toContain('--font-body: "Lato", sans-serif;');
  });

  it("fails the build on an unknown reference", () => {
    const doc = source();
    doc.theme.dark.bg.canvas.$value = "{color.neutral.999}";
    expect(() => buildCss(doc)).toThrow(TokenError);
    expect(() => buildCss(doc)).toThrow(/unknown token \{color\.neutral\.999\}/);
  });

  it("fails on a reference to a token of another type", () => {
    const doc = source();
    doc.theme.dark.text.primary.$value = "{space.small}";
    expect(() => buildCss(doc)).toThrow(/color token references dimension token/);
  });

  it("rejects legacy value properties", () => {
    const doc = source();
    doc.space.small = { value: { value: 8, unit: "px" } };
    expect(() => buildCss(doc)).toThrow(/legacy "value"/);
  });

  it("requires both themes to define the same tokens", () => {
    const doc = source();
    delete doc.theme.light.focus;
    expect(() => buildCss(doc)).toThrow(/does not match theme/);
  });
});
