// Validate a skin submission and derive both the file content and the index
// entry. Mirrors the app's validation (src/skinUtils.ts validateSkin +
// sanitizeCustomCSS): 18 hex color keys (15 required + 3 optional),
// type dark|light, and a customCSS that is size-capped and free of
// dangerous constructs.
//
// Input is the raw skin JSON text (pasted or fetched). Returns
// { ok, errors[], warnings[], skin, entry, id } where:
//   - skin  : the cleaned object to write to skins/<id>.json
//   - entry : the object to splice into index.json's skins[]
//   - id    : the chosen skin id (slug)

import {
  SKIN_COLOR_KEYS,
  OPTIONAL_SKIN_COLOR_KEYS,
  SWATCH_KEYS,
  isHexColor,
  isVersionString,
  isHttpsUrl,
  isCleanText,
  slugify,
  parseSkinJson,
} from "./lib.mjs";

const MAX_CSS = 10 * 1024; // 10KB, matching the app's customCSS cap.

// Patterns the app's sanitizeCustomCSS strips/blocks. We reject outright so the
// stored file is exactly what the app will accept.
const DANGEROUS_CSS = [
  { re: /@import/i, why: "@import is not allowed in customCSS." },
  { re: /javascript:/i, why: "javascript: URLs are not allowed in customCSS." },
  { re: /url\s*\(/i, why: "url(...) is not allowed in customCSS." },
  { re: /expression\s*\(/i, why: "expression(...) is not allowed in customCSS." },
  { re: /<\/?\s*script/i, why: "<script> is not allowed in customCSS." },
  { re: /behavior\s*:/i, why: "behavior: is not allowed in customCSS." },
];

export function validateSkinText(raw, { fallbackId } = {}) {
  const errors = [];
  const warnings = [];

  let skin;
  try {
    skin = parseSkinJson(raw);
  } catch (e) {
    errors.push(`Skin JSON did not parse: ${e.message}`);
    return { ok: false, errors, warnings, skin: null, entry: null, id: null };
  }
  if (!skin || typeof skin !== "object" || Array.isArray(skin)) {
    errors.push("Skin JSON must be a single object.");
    return { ok: false, errors, warnings, skin: null, entry: null, id: null };
  }

  // --- top-level fields ---
  if (!skin.name || !isCleanText(skin.name)) errors.push('"name" is required and must not contain markup.');
  if (!skin.author || !isCleanText(skin.author)) errors.push('"author" is required and must not contain markup.');
  if (skin.type !== "dark" && skin.type !== "light") errors.push('"type" must be exactly "dark" or "light".');
  if (skin.version != null && skin.version !== "" && typeof skin.version !== "string") {
    errors.push('"version" must be a string if present.');
  } else if (typeof skin.version === "string" && skin.version !== "" && !isVersionString(skin.version)) {
    // The app accepts any non-empty version string, but its auto-updater
    // compares versions numerically, so non-numeric versions won't update well.
    warnings.push(`"version" is not numeric (got: ${skin.version}); auto-update compares versions numerically.`);
  }
  if (skin.updateUrl != null && skin.updateUrl !== "" && !isHttpsUrl(skin.updateUrl)) {
    errors.push('"updateUrl" must be an https URL if present.');
  }

  // --- colors: 15 required + 3 optional, all hex, no extras ---
  const colors = skin.colors;
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) {
    errors.push('"colors" must be an object with the 15 required color keys.');
  } else {
    for (const key of SKIN_COLOR_KEYS) {
      if (!(key in colors)) {
        if (OPTIONAL_SKIN_COLOR_KEYS.includes(key)) {
          warnings.push(`colors is missing optional "${key}" — the app falls back to its default skin's value.`);
        } else {
          errors.push(`colors is missing "${key}".`);
        }
      } else if (!isHexColor(colors[key])) errors.push(`colors["${key}"] must be a hex color (got: ${colors[key]}).`);
    }
    const extras = Object.keys(colors).filter((k) => !SKIN_COLOR_KEYS.includes(k));
    if (extras.length) warnings.push(`Unknown color keys ignored: ${extras.join(", ")}.`);
  }

  // --- customCSS hygiene ---
  let cleanCss;
  if (skin.customCSS != null && skin.customCSS !== "") {
    if (typeof skin.customCSS !== "string") {
      errors.push('"customCSS" must be a string.');
    } else {
      if (skin.customCSS.length > MAX_CSS) {
        errors.push(`"customCSS" exceeds the ${MAX_CSS / 1024}KB limit (${(skin.customCSS.length / 1024).toFixed(1)}KB).`);
      }
      for (const { re, why } of DANGEROUS_CSS) {
        if (re.test(skin.customCSS)) errors.push(why);
      }
      cleanCss = skin.customCSS;
    }
  }

  if (errors.length) return { ok: false, errors, warnings, skin: null, entry: null, id: null };

  // --- derive id ---
  const id = slugify(skin.id || skin.name || fallbackId || "");
  if (!id) {
    errors.push("Could not derive a valid id from the skin name.");
    return { ok: false, errors, warnings, skin: null, entry: null, id: null };
  }

  const version =
    typeof skin.version === "string" && skin.version.trim() !== "" ? skin.version.trim() : "1.0.0";

  // The file the app downloads: top-level skin fields (no id/file — those are
  // gallery concerns). This matches the existing skins/*.json shape.
  const cleanSkin = {
    name: String(skin.name).trim(),
    author: String(skin.author).trim(),
    version,
    type: skin.type,
    colors: Object.fromEntries(SKIN_COLOR_KEYS.filter((k) => k in colors).map((k) => [k, colors[k]])),
  };
  if (cleanCss) cleanSkin.customCSS = cleanCss;
  if (skin.updateUrl) cleanSkin.updateUrl = String(skin.updateUrl);

  // The index entry, matching the live index.json shape exactly.
  const entry = {
    id,
    name: cleanSkin.name,
    author: cleanSkin.author,
    type: cleanSkin.type,
    version,
    file: `skins/${id}.json`,
    colors: SWATCH_KEYS.map((k) => colors[k]),
    // recommended is curator-controlled — never set from a submission.
  };

  return { ok: true, errors, warnings, skin: cleanSkin, entry, id };
}
