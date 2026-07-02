// Runs inside the "Submit a skin" GitHub Action.
//
// Reads the submission issue, validates the skin, then EITHER comments errors
// back on the issue, OR opens a PR that writes skins/<id>.json AND splices the
// derived entry into index.json. Approval == a maintainer merging the PR.
//
// Unlike the plugin gallery (index-only), this repo HOSTS the skin files, so a
// submission produces two changes in one commit: the file and the index entry.
//
// Env: ISSUE_NUMBER, ISSUE_BODY, ISSUE_USER, GITHUB_TOKEN, GITHUB_REPOSITORY

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parseIssueForm, fetchText, isHttpsUrl } from "./lib.mjs";
import { validateSkinText } from "./validate-skin.mjs";

const INDEX = "index.json";

const issueNumber = process.env.ISSUE_NUMBER;
const issueBody = process.env.ISSUE_BODY || "";
const issueUser = process.env.ISSUE_USER || "a contributor";

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}
function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
}
function comment(md) {
  gh(["issue", "comment", issueNumber, "--body", md]);
}
function label(name) {
  try {
    gh(["issue", "edit", issueNumber, "--add-label", name]);
  } catch {}
}
function fmtList(items) {
  return items.map((s) => `- ${s}`).join("\n");
}

const form = parseIssueForm(issueBody);
const pasted = (form["skin json"] || form["skin json (paste here)"] || "").trim();
const url = (form["skin json url"] || form["url"] || "").trim();

let raw = pasted;
if (!raw && url) {
  if (!isHttpsUrl(url)) {
    comment(`### ❌ Validation failed\n\nThe Skin JSON URL must be an https URL (got: ${url}).`);
    label("needs-changes");
    process.exit(0);
  }
  try {
    raw = await fetchText(url);
  } catch (e) {
    comment(`### ❌ Validation failed\n\nCould not fetch the skin JSON from the URL: ${e.message}`);
    label("needs-changes");
    process.exit(0);
  }
}

if (!raw) {
  comment(
    `### ❌ Validation failed\n\nNo skin JSON found. Paste your skin's JSON into the **Skin JSON** field, ` +
      `or provide a **Skin JSON URL**.`,
  );
  label("needs-changes");
  process.exit(0);
}

const result = validateSkinText(raw, { fallbackId: `skin-issue-${issueNumber}` });

if (!result.ok) {
  let body = `### ❌ Validation failed\n\nThanks @${issueUser}! Your skin couldn't be validated yet:\n\n`;
  body += fmtList(result.errors);
  if (result.warnings.length) body += `\n\n**Warnings**\n${fmtList(result.warnings)}`;
  body += `\n\nFix the issues above, then comment \`/retry\` (or edit the issue) and I'll re-check.`;
  comment(body);
  label("needs-changes");
  console.log("Validation failed — commented on issue.");
  process.exit(0);
}

const { id, skin, entry } = result;
const filePath = `skins/${id}.json`;

// --- write the skin file ---
writeFileSync(filePath, JSON.stringify(skin, null, 2) + "\n");

// --- splice into index.json (dedup by id) ---
const index = JSON.parse(readFileSync(INDEX, "utf8"));
if (!Array.isArray(index.skins)) throw new Error("index.json is malformed: skins[] missing");
const existingIdx = index.skins.findIndex((s) => s.id === id);
const isUpdate = existingIdx !== -1;
if (isUpdate) {
  if (index.skins[existingIdx].recommended) entry.recommended = true;
  index.skins[existingIdx] = entry;
} else {
  index.skins.push(entry);
}
// Stable order: recommended first, then alphabetical by name.
index.skins.sort((a, b) => {
  const r = (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
  return r !== 0 ? r : a.name.localeCompare(b.name);
});
writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n");

// --- open the PR ---
const branch = `submission/skin-${id}-issue-${issueNumber}`;
git(["config", "user.name", "viboplr-gallery-bot"]);
git(["config", "user.email", "bot@viboplr.com"]);
git(["checkout", "-B", branch]);
git(["add", filePath, INDEX]);
const verb = isUpdate ? "Update" : "Add";
git(["commit", "-m", `${verb} ${entry.name} (${id}) skin\n\nCloses #${issueNumber}`]);
git(["push", "-f", "origin", branch]);

let warnBlock = "";
if (result.warnings.length) warnBlock = `\n\n**Warnings (non-blocking)**\n${fmtList(result.warnings)}`;

const swatches = entry.colors.map((c) => `\`${c}\``).join(" ");
const prBody =
  `Automated submission from #${issueNumber} by @${issueUser}.\n\n` +
  `**${verb}:** \`${id}\` — ${entry.name} by ${entry.author} (${entry.type})\n\n` +
  `Swatches: ${swatches}\n\n` +
  `Writes \`${filePath}\` and adds the index entry. Validated against the app's 18-key ` +
  `color schema and customCSS rules.${warnBlock}\n\n` +
  `Merging publishes it. To feature it, add \`"recommended": true\` to the index entry before merge.\n\n` +
  `Closes #${issueNumber}`;

const prTitle = `${verb} ${entry.name} (${id}) skin`;
let prUrl = "";
try {
  prUrl = gh(["pr", "create", "--title", prTitle, "--body", prBody, "--head", branch, "--base", "main"]).trim();
} catch {
  prUrl = gh(["pr", "list", "--head", branch, "--json", "url", "--jq", ".[0].url"]).trim();
}

let okBody = `### ✅ Validated\n\nThanks @${issueUser}! Your skin passed validation and a PR is open: ${prUrl}\n\nA maintainer will review and merge it.`;
if (result.warnings.length) okBody += `\n\n**Warnings (non-blocking)**\n${fmtList(result.warnings)}`;
comment(okBody);
label("validated");
console.log("Opened/updated PR:", prUrl, existsSync(filePath) ? "(file written)" : "");
