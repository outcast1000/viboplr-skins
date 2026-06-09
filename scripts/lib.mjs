// Shared helpers for the Viboplr skin gallery automation.
// Zero npm dependencies — Node 20+ built-ins only.

/** The 15 required skin color keys, mirrored from the app's
 *  src/types/skin.ts SKIN_COLOR_KEYS. Order matters for documentation but the
 *  validator checks presence, not order. */
export const SKIN_COLOR_KEYS = [
  "bg-primary",
  "bg-secondary",
  "bg-tertiary",
  "bg-surface",
  "bg-hover",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "accent",
  "accent-dim",
  "border",
  "now-playing-bg",
  "success",
  "error",
  "warning",
];

/** The 4 colors shown as swatches in the gallery index tuple, in order:
 *  [bg-primary, bg-secondary, accent, bg-surface] — matches the live index.json. */
export const SWATCH_KEYS = ["bg-primary", "bg-secondary", "accent", "bg-surface"];

/** Parse a GitHub Issue Form body into a { lowercasedLabel: value } map. */
export function parseIssueForm(body) {
  const out = {};
  if (!body) return out;
  const text = body.replace(/\r\n/g, "\n");
  const parts = text.split(/\n###\s+/);
  parts[0] = parts[0].replace(/^###\s+/, "");
  for (const part of parts) {
    const nl = part.indexOf("\n");
    if (nl === -1) continue;
    const label = part.slice(0, nl).trim().toLowerCase();
    let value = part.slice(nl + 1).trim();
    if (value === "_No response_") value = "";
    if (label) out[label] = value;
  }
  return out;
}

/** A 3- or 6-digit hex color, with leading #. */
export function isHexColor(s) {
  return typeof s === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());
}

/** A plausible semver-ish numeric version (1, 1.2, 1.2.3). */
export function isVersionString(v) {
  return typeof v === "string" && /^\d+(\.\d+){0,3}$/.test(v.trim());
}

/** True if `s` is a plain https URL. */
export function isHttpsUrl(s) {
  try {
    return new URL(String(s)).protocol === "https:";
  } catch {
    return false;
  }
}

/** Reject strings carrying HTML markup characters. */
export function isCleanText(s) {
  return typeof s === "string" && !/[<>]/.test(s);
}

/** Slugify a skin name/id into a filesystem-safe, lowercase id. */
export function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Fetch text from a URL with a clear error on failure. */
export async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "viboplr-gallery-bot" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

/** Try to extract a JSON object from raw text that may be wrapped in a
 *  ```json fenced block (issue forms often add fences). Returns the object or
 *  throws. */
export function parseSkinJson(raw) {
  let text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}
