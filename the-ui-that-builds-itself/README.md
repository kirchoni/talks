# The UI That Builds Itself: Exploring the Generative Front-End

A conference talk and live demo exploring what happens when the interface itself becomes dynamic — decided at use time by an LLM agent instead of prebuilt at deploy time by a developer.

## Products used in this presentation

This talk features two commercial products from [Progress](https://www.progress.com):

- **[Progress AI Observability Platform](https://www.telerik.com/ai-observability-platform?utm_source=kiko)** — traces, debugs and monitors the AI agent powering the runtime UI generation.
- **[Progress Agentic RAG](https://www.progress.com/agentic-rag?utm_source=kiko)** — provides the indexed app knowledge that the UI agent queries at runtime to ground its output in real product data.

## The idea

Static UI is not broken. It gives teams consistency, accessibility, performance and a shared product language. But once a product ships, every capability is exposed through a prebuilt route map — pages, menus, dropdowns, pricing cards. The user did not ask for the route map; they asked for one capability.

The talk explores a different model:

```
ui(prompt, data, state, capabilities, design_system)
```

Instead of navigating a sitemap, the user states an intent. A runtime agent — with access to product data, client state, app capabilities and a design-system catalog — composes the right interface on the fly.

## The demo: Boxel

The live demo builds a fictional product called **Boxel** incrementally across seven checkpoints, each adding one missing ingredient:

| Checkpoint | Adds | Key question answered |
|---|---|---|
| 1 | `prompt` | Can a model generate any UI at all? |
| 2 | `data` | What if the model has real product data? |
| 3 | `capabilities` | What if the UI can call product actions? |
| 4 | `state` | What if the model knows who the user is and what already happened? |
| 5 | streaming & patches | Does the UI have to arrive all at once? |
| 6 | `design_system` | Can the output look like the product? |
| 7 | expanded surface | Does adding a new user journey require a new screen? |

By the final checkpoint the same runtime renders license purchases, job applications, investor views and trial sign-ups — without a new route or React page for each.

## Repository structure

```
presentation/   Slidev slide deck (Markdown + Vue components)
app/            Next.js demo app (TypeScript, React, App Router)
```

### Presentation

The slide deck is a [Slidev](https://sli.dev/) project with custom Vue components, Geist typography and a light/dark design system.

```bash
cd presentation
npm install
npm run dev
```

### Demo app

The demo app is a Next.js application using the Vercel AI SDK, OpenRouter and UnoCSS. It implements the runtime UI agent loop described in the talk.

```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

## Speaker

**Kiril S. Peyanski** · [@kirchoni](https://x.com/kirchoni)

## License

This repository contains conference talk materials and demo code. It is provided as-is for educational and reference purposes.
