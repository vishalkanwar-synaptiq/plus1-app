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

  it("follows the Tailwind CSS default type scale", () => {
    const css = buildCss(source());
    const scale: [string, number, number][] = [
      ["xs", 12, 16], ["sm", 14, 20], ["base", 16, 24], ["lg", 18, 28], ["xl", 20, 28], ["2xl", 24, 32], ["3xl", 30, 36],
      ["4xl", 36, 40], ["5xl", 48, 48], ["6xl", 60, 60], ["7xl", 72, 72], ["8xl", 96, 96], ["9xl", 128, 128],
    ];
    for (const [step, size, lineHeight] of scale) {
      expect(css).toContain(`--font-size-${step}: ${size}px;`);
      expect(css).toContain(`--font-line-height-${step}: ${lineHeight}px;`);
    }
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
