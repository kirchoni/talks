#!/usr/bin/env bash
# Build every talk's Slidev deck into site/<slug>/ for GitHub Pages.
# Published URLs: https://<user>.github.io/<repo>/<slug>/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE_DIR="${SITE_DIR:-"$ROOT/site"}"
# Prefer GitHub Actions context, then origin remote, then "talks".
if [ -z "${REPO_NAME:-}" ]; then
  if [ -n "${GITHUB_REPOSITORY:-}" ]; then
    REPO_NAME="${GITHUB_REPOSITORY##*/}"
  else
    remote_url="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
    REPO_NAME="$(basename "${remote_url%.git}")"
    REPO_NAME="${REPO_NAME:-talks}"
  fi
fi
REPO_BASE="${REPO_BASE:-"/$REPO_NAME"}"

rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"

shopt -s nullglob
presentations=("$ROOT"/*/presentation)

if [ ${#presentations[@]} -eq 0 ]; then
  echo "No talk presentations found under */presentation" >&2
  exit 1
fi

built=()

for presentation in "${presentations[@]}"; do
  [ -f "$presentation/package.json" ] || continue
  if ! grep -q '"@slidev/cli"' "$presentation/package.json"; then
    echo "Skipping $presentation (no @slidev/cli)"
    continue
  fi

  talk_slug="$(basename "$(dirname "$presentation")")"
  out_dir="$SITE_DIR/$talk_slug"
  base="${REPO_BASE}/${talk_slug}/"

  echo "::group::Building $talk_slug (base=$base)"
  (
    cd "$presentation"
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
    # Decks should set `routerMode: hash` in slides.md headmatter for GitHub Pages.
    npx slidev build --base "$base" --out "$out_dir"
  )
  echo "::endgroup::"
  built+=("$talk_slug")
done

if [ ${#built[@]} -eq 0 ]; then
  echo "No Slidev presentations were built" >&2
  exit 1
fi

node "$ROOT/.github/scripts/generate-pages-index.mjs" "$SITE_DIR" "$REPO_BASE"
touch "$SITE_DIR/.nojekyll"

echo "Built ${#built[@]} talk(s): ${built[*]}"
echo "Site output: $SITE_DIR"
