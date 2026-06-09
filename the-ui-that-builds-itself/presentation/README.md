# Slidev presentation

This folder is a standalone [Slidev](https://sli.dev/) project.

## Setup

From the repo root:

```bash
cd presentation
npm install
```

## Run

```bash
npm run dev
```

## Files

- `slides.md`: the Slidev deck entrypoint
- `table-of-contents.md`: existing talk outline/notes (not wired into Slidev yet)
- `styles/index.css`: Slidev auto-loaded CSS entrypoint
- `styles/design-system.css`: deck design-system variables and shared presentation primitives

## Styling

Keep immutable palette/source tokens in `styles/design-system.css` at `:root`, then expose semantic `--deck-*` theme variables from `html.light` and `html.dark` so they follow Slidev's built-in color-mode toggle. Map Slidev's own variables such as `--slidev-theme-primary` and `--slidev-code-background` once to those semantic tokens, rather than overriding Slidev variables separately per theme. Prefer plain global CSS selectors in this file. Avoid relying on scoped Vue selectors that begin with `:global(...)` and continue with descendants, because older Vue compiler behavior could drop the trailing scoped selector in patterns like `:global(body) h1`.
