# Talks

**Live decks:** [All talks](https://kirchoni.github.io/talks/) · [The UI That Builds Itself](https://kirchoni.github.io/talks/the-ui-that-builds-itself/)

Conference talks, slide decks and live-demo code by **Kiril S. Peyanski** ([@kirchoni](https://x.com/kirchoni)).

Each folder is a self-contained talk with its own README, presentation assets and — where applicable — a runnable demo app.

## Talks

| Talk | Live deck | Event / Topic | Description |
|---|---|---|---|
| [The UI That Builds Itself](./the-ui-that-builds-itself/) | [Open slides](https://kirchoni.github.io/talks/the-ui-that-builds-itself/) | Generative Front-End | What happens when the interface is decided at use time by an LLM agent instead of prebuilt at deploy time by a developer. |

Pushing to `main` rebuilds and deploys every talk that has a Slidev `presentation/` folder (see `.github/workflows/deploy-pages.yml`). Published decks: [kirchoni.github.io/talks/](https://kirchoni.github.io/talks/).

## Repository layout

```
talks/
├── README.md                        ← you are here
├── .github/workflows/deploy-pages.yml
├── the-ui-that-builds-itself/       ← first talk
│   ├── presentation/                   Slidev slide deck
│   ├── app/                            Next.js demo app
│   └── README.md                       talk-specific details
└── …                                ← future talks
```

## Getting started with a talk

Navigate into any talk folder and follow its README. Most talks include:

- A **presentation** directory — install dependencies and run `npm run dev` to view the slides locally.
- An **app** directory — a standalone demo you can run on your machine.

## Adding another talk to GitHub Pages

1. Create a new talk folder with a Slidev app at `<slug>/presentation/` (with `@slidev/cli` in `package.json`).
2. Set `routerMode: hash` in that deck’s `slides.md` headmatter so deep links work on GitHub Pages.
3. Merge to `main`. The deploy workflow builds every `*/presentation` deck to `https://kirchoni.github.io/talks/<slug>/`.

To preview the site locally (GitHub Pages serves `site/` at `/talks/`):

```bash
bash .github/scripts/build-pages.sh
mkdir -p /tmp/talks-pages-preview/talks
cp -a site/. /tmp/talks-pages-preview/talks/
npx --yes serve /tmp/talks-pages-preview
# open http://localhost:3000/talks/
```

## License

Materials are provided as-is for educational and reference purposes.
