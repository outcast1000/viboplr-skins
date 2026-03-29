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

## Contributing a Skin

1. Fork this repo
2. Create your skin JSON file in `skins/`
3. Add an entry to `index.json`
4. Open a pull request

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
    "bg-surface": "#0f3460",
    "bg-hover": "#1a3a6e",
    "text-primary": "#e0e0e0",
    "text-secondary": "#a0a0b0",
    "accent": "#53a8ff",
    "accent-dim": "#3a7bd5",
    "border": "#2a2a4a",
    "now-playing-bg": "#0d1b2a",
    "success": "#4caf50",
    "error": "#f44336",
    "warning": "#ff9500"
  },
  "customCSS": ""
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `author` | Yes | Your name or username |
| `version` | Yes | Semver version string |
| `type` | Yes | `"dark"` or `"light"` — controls overlay contrast behavior |
| `colors` | Yes | All 13 color tokens (see below) |
| `customCSS` | No | Optional raw CSS overrides (max 10KB) |

### Color Tokens

| Token | Description |
|-------|-------------|
| `bg-primary` | Main app background |
| `bg-secondary` | Sidebar, secondary panels |
| `bg-surface` | Active/focused elements |
| `bg-hover` | Hover state backgrounds |
| `text-primary` | Main text color |
| `text-secondary` | Labels, secondary text |
| `accent` | Primary accent (buttons, links, highlights) |
| `accent-dim` | Dimmed accent variant |
| `border` | Borders and dividers |
| `now-playing-bg` | Now-playing bar background |
| `success` | Success indicators |
| `error` | Error/destructive indicators |
| `warning` | Warning indicators |

All color values must be hex format (`#rgb` or `#rrggbb`).

### Index Entry Format

Add your skin to `index.json`:

```json
{
  "id": "my-skin",
  "name": "My Skin",
  "author": "your-username",
  "type": "dark",
  "version": "1.0.0",
  "file": "skins/my-skin.json",
  "colors": ["#1a1a2e", "#16213e", "#53a8ff", "#0f3460"]
}
```

The `colors` array has 4 preview swatches: bg-primary, bg-secondary, accent, bg-surface.

## Local Import

You can also import skins locally without using the gallery. In Viboplr, go to **Settings > Skins > Import from file...** and select any `.json` skin file.
