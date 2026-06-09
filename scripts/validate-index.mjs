// CI gate: validate index.json AND that every referenced skins/*.json file
// exists, parses, and is itself a valid skin whose swatch tuple matches the
// index entry. This catches manual edits and orphaned/typo'd file paths. Exits
// non-zero on any error.

import { readFileSync, existsSync } from "node:fs";
import { SWATCH_KEYS, isHexColor, isCleanText } from "./lib.mjs";
import { validateSkinText } from "./validate-skin.mjs";

const INDEX = "index.json";
const errors = [];

let index;
try {
  index = JSON.parse(readFileSync(INDEX, "utf8"));
} catch (e) {
  console.error(`index.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(index.skins)) {
  errors.push('index.json "skins" must be an array.');
} else {
  const ids = new Set();
  index.skins.forEach((s, i) => {
    const at = `skins[${i}] (${s.id || "?"})`;
    if (!s.id || !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) errors.push(`${at}: invalid or missing id.`);
    else if (ids.has(s.id)) errors.push(`${at}: duplicate id "${s.id}".`);
    else ids.add(s.id);
    if (!s.name || !isCleanText(s.name)) errors.push(`${at}: name missing or contains markup.`);
    if (!s.author || !isCleanText(s.author)) errors.push(`${at}: author missing or contains markup.`);
    if (s.type !== "dark" && s.type !== "light") errors.push(`${at}: type must be dark|light.`);
    if (typeof s.version !== "string" || !s.version) errors.push(`${at}: version missing.`);
    if (s.recommended != null && typeof s.recommended !== "boolean") errors.push(`${at}: recommended must be boolean.`);

    // swatch tuple
    if (!Array.isArray(s.colors) || s.colors.length !== 4 || !s.colors.every(isHexColor)) {
      errors.push(`${at}: colors must be a 4-tuple of hex strings.`);
    }

    // file must exist, parse, and validate; swatches must match the file.
    if (typeof s.file !== "string" || !s.file.startsWith("skins/") || !s.file.endsWith(".json")) {
      errors.push(`${at}: file must be "skins/<id>.json".`);
    } else if (s.file !== `skins/${s.id}.json`) {
      errors.push(`${at}: file "${s.file}" should be "skins/${s.id}.json".`);
    } else if (!existsSync(s.file)) {
      errors.push(`${at}: referenced file "${s.file}" does not exist.`);
    } else {
      let fileText;
      try {
        fileText = readFileSync(s.file, "utf8");
      } catch (e) {
        errors.push(`${at}: cannot read "${s.file}": ${e.message}`);
        return;
      }
      const v = validateSkinText(fileText, { fallbackId: s.id });
      if (!v.ok) {
        errors.push(`${at}: "${s.file}" is not a valid skin:\n      ${v.errors.join("\n      ")}`);
      } else if (Array.isArray(s.colors)) {
        // swatch tuple must equal the file's [bg-primary, bg-secondary, accent, bg-surface]
        const expected = SWATCH_KEYS.map((k) => v.skin.colors[k]);
        const mismatch = expected.some((c, idx) => c.toLowerCase() !== String(s.colors[idx]).toLowerCase());
        if (mismatch) {
          errors.push(`${at}: index swatches [${s.colors}] don't match file swatches [${expected}].`);
        }
      }
    }
  });
}

if (errors.length) {
  console.error("index.json validation FAILED:\n" + errors.map((s) => "  - " + s).join("\n"));
  process.exit(1);
}
console.log(`index.json OK — ${index.skins.length} skins, all files present and valid.`);
