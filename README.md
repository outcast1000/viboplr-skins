# Viboplr Skins

Community color skins for [Viboplr](https://github.com/outcast1000/viboplr). Browse and install these directly from the app via **Settings > Skins > Browse Gallery**.

## Available Skins

| Skin | Type | Preview |
|------|------|---------|
| Nord | Dark | `#2e3440` `#88c0d0` |
| Dracula | Dark | `#282a36` `#bd93f9` |
| Solarized Dark | Dark | `#002b36` `#268bd2` |
| Solarized Light | Light | `#fdf6e3` `#268bd2` |
| Monokai | Dark | `#272822` `#a6e22e` |
| Catppuccin Mocha | Dark | `#1e1e2e` `#cba6f7` |
| Catppuccin Latte | Light | `#eff1f5` `#8839ef` |
| Tokyo Night | Dark | `#1a1b26` `#7aa2f7` |
| Gruvbox | Dark | `#282828` `#fabd2f` |
| Rose Pine | Dark | `#191724` `#ebbcba` |

## Submitting a skin

You don't edit `index.json` by hand. Instead:

1. **Get your skin JSON.** Export from the app (Settings → Skins → Export) or
   hand-write one in the format below. It needs `name`, `author`, `type`, and a
   `colors` object with **all 18 keys** (3 are optional — see Color Tokens).
2. **Open a [Submit a skin](../../issues/new?template=submit-skin.yml) issue**
   and paste the JSON (or link to a raw `.json` URL).
3. A bot **validates** it — the hex colors, `type`, and `customCSS` hygiene —
   and either comments what's wrong or opens a PR that writes
   `skins/<id>.json` and adds the index entry. Comment `/retry` after fixing.
4. A maintainer reviews and **merges the PR** — that publishes your skin to the
   gallery and to [viboplr.com/skins](https://viboplr.com/skins.html).

### Skin JSON Format

```json
{
  "name": "My Skin",
  "author": "your-username",
  "version": "1.0.0",
  "type": "dark",
  "colors": {
    "bg-primary": "#1a1a2e",
    "bg-secondary": "#16213e",
    "bg-tertiary": "#1d2748",
    "bg-surface": "#0f3460",
    "bg-hover": "#1a3a6e",
    "text-primary": "#e0e0e0",
    "text-secondary": "#a0a0b0",
    "text-tertiary": "#70708a",
    "accent": "#53a8ff",
    "accent-dim": "#3a7bd5",
    "accent-text": "#ffffff",
    "border": "#2a2a4a",
    "now-playing-bg": "#0d1b2a",
    "success": "#4caf50",
    "error": "#f44336",
    "warning": "#ff9500",
    "like": "#ff4d6a",
    "dislike": "#ff9500"
  },
  "customCSS": ""
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `author` | Yes | Your name or username |
| `version` | No | Version string (defaults to `1.0.0`). Use numeric (`1.2.0`) so auto-update works. |
| `type` | Yes | `"dark"` or `"light"` — controls overlay contrast behavior |
| `colors` | Yes | The 18 color tokens (see below; 3 are optional) |
| `customCSS` | No | Optional raw CSS overrides (max 10KB; no `@import`, `url(...)`, `javascript:`, or `expression(...)`) |

### Color Tokens

| Token | Description |
|-------|-------------|
| `bg-primary` | Main app background |
| `bg-secondary` | Sidebar, secondary panels |
| `bg-tertiary` | Tertiary surfaces |
| `bg-surface` | Active/focused elements |
| `bg-hover` | Hover state backgrounds |
| `text-primary` | Main text color |
| `text-secondary` | Labels, secondary text |
| `text-tertiary` | Faint/tertiary text |
| `accent` | Primary accent (buttons, links, highlights) |
| `accent-dim` | Dimmed accent variant |
| `accent-text` | Text rendered on accent backgrounds (e.g. primary buttons) — optional |
| `border` | Borders and dividers |
| `now-playing-bg` | Now-playing bar background |
| `success` | Success indicators |
| `error` | Error/destructive indicators |
| `warning` | Warning indicators |
| `like` | Like (heart) buttons/indicators — optional |
| `dislike` | Dislike buttons/indicators — optional |

All color values must be hex format (`#rgb` or `#rrggbb`). The three tokens
marked *optional* postdate the original schema: skins that omit them still
validate and install, and the app falls back to its default skin's values.
New skins should define all 18.

### Index Entry Format (generated for you)

The bot derives this entry automatically:

```json
{
  "id": "my-skin",
  "name": "My Skin",
  "author": "your-username",
  "type": "dark",
  "version": "1.0.0",
  "file": "skins/my-skin.json",
  "colors": ["#1a1a2e", "#16213e", "#53a8ff", "#0f3460"],
  "recommended": false
}
```

The `colors` array has 4 preview swatches in this order: `bg-primary`,
`bg-secondary`, `accent`, `bg-surface`. `recommended` is **curator-controlled** —
maintainers flip it in the PR to feature a skin (the app shows a "Recommended"
badge); it is preserved across re-submissions.

## Maintainer tooling

- `scripts/validate-skin.mjs` — validates one skin's JSON.
- `scripts/process-submission.mjs` — run by the submission workflow.
- `scripts/validate-index.mjs` — PR gate; checks `index.json` and that every
  `skins/*.json` file exists, validates, and matches its swatches.
- `node scripts/skin.test.mjs` — unit tests. All zero-dependency Node 20+.

## Local Import

You can also import skins locally without using the gallery. In Viboplr, go to **Settings > Skins > Import from file...** and select any `.json` skin file.
