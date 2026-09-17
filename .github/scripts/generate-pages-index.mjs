#!/usr/bin/env node
/**
 * Write site/index.html listing every built talk under site/<slug>/.
 * Usage: node generate-pages-index.mjs <siteDir> <repoBase>
 *   repoBase example: /talks
 */
import fs from 'node:fs'
import path from 'node:path'

const siteDir = process.argv[2]
const repoBase = (process.argv[3] || '/talks').replace(/\/$/, '') || ''

if (!siteDir || !fs.existsSync(siteDir)) {
  console.error('Usage: generate-pages-index.mjs <siteDir> <repoBase>')
  process.exit(1)
}

function titleFromIndexHtml(html, fallback) {
  const match = html.match(/<title>([^<]*)<\/title>/i)
  if (!match) return fallback
  return match[1].replace(/\s*[-–—]\s*Slidev\s*$/i, '').trim() || fallback
}

function labelFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const talks = fs
  .readdirSync(siteDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const indexPath = path.join(siteDir, entry.name, 'index.html')
    if (!fs.existsSync(indexPath)) return null
    const html = fs.readFileSync(indexPath, 'utf8')
    return {
      slug: entry.name,
      title: titleFromIndexHtml(html, labelFromSlug(entry.name)),
      href: `${repoBase}/${entry.name}/`,
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.title.localeCompare(b.title))

const listItems = talks
  .map(
    (talk) => `        <li>
          <a href="${talk.href}">
            <span class="title">${escapeHtml(talk.title)}</span>
            <span class="path">${escapeHtml(talk.href)}</span>
          </a>
        </li>`,
  )
  .join('\n')

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Talks — Kiril S. Peyanski</title>
    <meta
      name="description"
      content="Published conference talks and slide decks by Kiril S. Peyanski."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #eef3f1;
        --bg-panel: #f7faf8;
        --ink: #101114;
        --muted: #3f4652;
        --line: rgb(16 17 20 / 0.12);
        --accent: #008066;
        --font-sans: Geist, "Segoe UI", sans-serif;
        --font-mono: "Geist Mono", ui-monospace, monospace;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-height: 100%;
      }

      body {
        color: var(--ink);
        font-family: var(--font-sans);
        background:
          linear-gradient(90deg, rgb(16 17 20 / 0.035) 1px, transparent 1px),
          linear-gradient(180deg, rgb(16 17 20 / 0.035) 1px, transparent 1px),
          linear-gradient(165deg, #f4f8f6 0%, var(--bg) 45%, #e4eeea 100%);
        background-size: 42px 42px, 42px 42px, auto;
        line-height: 1.5;
      }

      main {
        width: min(42rem, calc(100% - 2.5rem));
        margin: 0 auto;
        padding: 18vh 0 4rem;
      }

      .eyebrow {
        margin: 0 0 0.75rem;
        color: var(--accent);
        font-family: var(--font-mono);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(2.5rem, 6vw, 4rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.05;
      }

      .lede {
        margin: 1rem 0 0;
        max-width: 28rem;
        color: var(--muted);
        font-size: 1.05rem;
      }

      ul {
        list-style: none;
        margin: 2.75rem 0 0;
        padding: 0;
        border-top: 1px solid var(--line);
        background: color-mix(in srgb, var(--bg-panel) 72%, transparent);
      }

      li + li {
        border-top: 1px solid var(--line);
      }

      a {
        display: grid;
        gap: 0.35rem;
        padding: 1.25rem 0.85rem;
        color: inherit;
        text-decoration: none;
        transition: background-color 160ms ease, color 160ms ease;
      }

      a:hover,
      a:focus-visible {
        background: color-mix(in srgb, var(--accent) 8%, var(--bg-panel));
      }

      a:hover .title,
      a:focus-visible .title {
        color: var(--accent);
      }

      a:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .title {
        font-size: 1.2rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        transition: color 160ms ease;
      }

      .path {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.8rem;
      }

      footer {
        margin-top: 3rem;
        color: var(--muted);
        font-size: 0.9rem;
      }

      footer a {
        display: inline;
        padding: 0;
        color: var(--ink);
        text-decoration: underline;
        text-decoration-color: rgb(16 17 20 / 0.28);
        text-underline-offset: 0.18em;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Kiril S. Peyanski</p>
      <h1>Talks</h1>
      <p class="lede">
        Published slide decks. Each talk lives under its own path so more can
        land here over time.
      </p>
      <ul>
${listItems || '        <li><span class="title">No talks published yet.</span></li>'}
      </ul>
      <footer>
        Source on
        <a href="https://github.com/kirchoni/talks">github.com/kirchoni/talks</a>
        ·
        <a href="https://x.com/kirchoni">@kirchoni</a>
      </footer>
    </main>
  </body>
</html>
`

fs.writeFileSync(path.join(siteDir, 'index.html'), html)
console.log(`Wrote index with ${talks.length} talk(s) → ${path.join(siteDir, 'index.html')}`)

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
