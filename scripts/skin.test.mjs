// No-deps tests for the skin validator. Run: node scripts/skin.test.mjs
import assert from "node:assert/strict";
import { validateSkinText } from "./validate-skin.mjs";
import { SKIN_COLOR_KEYS, slugify, isHexColor, parseSkinJson } from "./lib.mjs";

let pass = 0;
function t(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
}

const goodColors = Object.fromEntries(SKIN_COLOR_KEYS.map((k) => [k, "#123456"]));
const goodSkin = { name: "Test Skin", author: "Me", type: "dark", version: "1.0.0", colors: goodColors };

t("valid skin passes and derives entry+file", () => {
  const r = validateSkinText(JSON.stringify(goodSkin));
  assert.ok(r.ok, r.errors.join("; "));
  assert.equal(r.id, "test-skin");
  assert.equal(r.entry.file, "skins/test-skin.json");
  assert.equal(r.entry.colors.length, 4);
  assert.equal(r.skin.colors["accent"], "#123456");
});

t("missing a color key fails", () => {
  const bad = JSON.parse(JSON.stringify(goodSkin));
  delete bad.colors["accent"];
  const r = validateSkinText(JSON.stringify(bad));
  assert.ok(!r.ok);
  assert.ok(r.errors.some((e) => e.includes("accent")));
});

t("non-hex color fails", () => {
  const bad = JSON.parse(JSON.stringify(goodSkin));
  bad.colors["accent"] = "rebeccapurple";
  const r = validateSkinText(JSON.stringify(bad));
  assert.ok(!r.ok);
});

t("bad type fails", () => {
  const bad = { ...goodSkin, type: "neon" };
  const r = validateSkinText(JSON.stringify(bad));
  assert.ok(!r.ok);
});

t("dangerous customCSS is rejected", () => {
  for (const css of ["@import url(x);", "a{background:url(http://x)}", "a{x:expression(alert(1))}", "a:hover{color:javascript:1}"]) {
    const r = validateSkinText(JSON.stringify({ ...goodSkin, customCSS: css }));
    assert.ok(!r.ok, `expected rejection for: ${css}`);
  }
});

t("oversized customCSS is rejected", () => {
  const r = validateSkinText(JSON.stringify({ ...goodSkin, customCSS: "a".repeat(10241) }));
  assert.ok(!r.ok);
});

t("safe customCSS passes and is preserved", () => {
  const css = ":root { --ds-radius: 0px; }";
  const r = validateSkinText(JSON.stringify({ ...goodSkin, customCSS: css }));
  assert.ok(r.ok, r.errors.join("; "));
  assert.equal(r.skin.customCSS, css);
});

t("non-numeric version warns but passes, preserved verbatim", () => {
  const r = validateSkinText(JSON.stringify({ ...goodSkin, version: "v2-beta" }));
  assert.ok(r.ok, r.errors.join("; "));
  assert.equal(r.skin.version, "v2-beta");
  assert.ok(r.warnings.some((w) => w.includes("numeric")));
});

t("fenced JSON block is unwrapped", () => {
  const fenced = "```json\n" + JSON.stringify(goodSkin) + "\n```";
  const r = validateSkinText(fenced);
  assert.ok(r.ok, r.errors.join("; "));
});

t("recommended is never set from submission", () => {
  const r = validateSkinText(JSON.stringify({ ...goodSkin, recommended: true }));
  assert.ok(r.ok);
  assert.equal(r.entry.recommended, undefined);
});

t("slugify + isHexColor + parseSkinJson sanity", () => {
  assert.equal(slugify("Catppuccin Mocha!"), "catppuccin-mocha");
  assert.ok(isHexColor("#fff"));
  assert.ok(isHexColor("#a1b2c3"));
  assert.ok(!isHexColor("#ggg"));
  assert.deepEqual(parseSkinJson('{"a":1}'), { a: 1 });
});

console.log(`\n${pass} passed`);
