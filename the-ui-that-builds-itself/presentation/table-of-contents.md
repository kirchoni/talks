---
title: AI Generated UI
---

# Working Script / Story Notes

> Draft workspace, not committed slide content. Use this section to preserve narrative decisions, open questions, visual ideas, and TODOs between iterations.

## Opening: Personal Entry Point

- Start after the title slide from a personal angle: "I have spent most of my career building UI components."
- Visual idea: components appear on screen one by one:
  - Button
  - combobox
  - Date picker
  - Data table
  - Modal
  - Tabs
  - Combobox
  - Form field
- Zoom into one combobox to show how much production detail hides inside a small component:
  - keyboard navigation
  - focus management
  - typeahead
  - async loading
  - grouped options
  - disabled states
  - validation
  - mobile behavior
  - accessibility
  - edge cases
- Script direction:
  - "Most of my career has been spent building the pieces of user interfaces."
  - "And the smaller the component looks, the more detail tends to hide inside it."

## Bridge: Components For Agents

- Transition from deep component craft to agent-composed interfaces:
  - "For most of my career, I thought about components as things humans interact with."
  - "A button had to feel right. A combobox had to handle keyboard navigation, focus, async loading, validation, accessibility, and all the production detail."
  - "That work does not go away."
  - "But lately I have found myself building components for a second audience: agents."
  - "Not components for agents to click. Components for agents to build."
- Neutral stance:
  - This is not a claim that component development is becoming irrelevant.
  - It is almost the opposite: the quality of an agent-composed interface depends on the quality of the primitives, constraints, data, and actions it can compose from.
  - The opportunity is to explore a different development paradigm, not to declare the old one dead.
- Bridge into the scale change:
  - "What impressed me was not that an agent could generate a button."
  - "It was that, given a developer prompt and a catalog of primitives, it could compose an entire screen in seconds."
  - "That changed where composition felt like it could happen."
- Bridge into history:
  - "At first, this looked like a huge change to the developer experience: I could describe a screen and get a screen."
  - "But I still needed to understand whether this changes anything for the person using the product."
  - "So I went back to the web itself: when did the user experience actually change?"
- Reveal constraint:
  - Do not explain the full dynamic-UI thesis too early.
  - The opening should make the audience feel the audience change first: components are still for humans, but they can also become material for agents.
  - Preserve a crowd "wait, what?" / "oh, that changes the model" moment for the later dynamic user-interface section.
- Speed framing:
  - Speed is an enabler, but not the reveal.
  - Early point: agents can compose existing UI primitives much faster than a developer can hand-author a screen.
  - Stop the opening at: "this changes the developer experience, not necessarily the user experience."
  - Do not mention "static UI" or "fixed flows" before the history section.
  - Let the history section discover the static-UI problem instead of previewing it.
- Important distinction:
  - Agents making UI faster is useful, but it is not the interesting part of the talk.
  - Faster development does not automatically mean a different user experience.
  - The user may still receive the same pre-decided screen, only built faster by the developer.
- Candidate hinge lines:
  - "I used to build components for humans. Lately, I have been building components for agents."
  - "The surprising part is not generated markup. The surprising part is runtime composition over a real component system."
  - "Components remain the durable layer. The experiment is whether the final arrangement has to be decided before the user arrives."
- Opening stopping point:
  - "This changes the developer experience, not necessarily the user experience."
  - Do not name the dynamic-UI idea here; leave that discovery for later.

## Opening Visual Beat

- Zoom back out from the combobox.
- Introduce the agent as a new consumer of the component catalog:
- The previously shown components rearrange into a complete page.
- The page duplicates or morphs through several variants quickly if needed, but keep the first version legible.
- Make the point visually: agents can compose entire user interfaces from existing primitives extremely fast.
- Then interrupt the magic with the caveat:
  - "At first, this looked like a huge change to the developer experience."
  - "But I was not yet sure what it changed for the person using the product."

## combobox Comparison

- Later idea, not for the opening reveal.
- Original thought:
  - If a production comboboxList took months to build with all available features, now everyone can have their own combobox tailored to their exact needs in minutes.
- Refinement to avoid implying low-quality disposable components:
  - "If a production combobox took months because it had to serve every future use case, what changes when the interface can be assembled for this specific task, this specific user, right now?"

## Transition To Web History

- After the personal realization, move to a wider lens:
  - "To understand whether user experience has shifted like this before, I wanted to step back and look at what has already changed on the web."
- Then use "The History of the Web... so far" as inspiration/reference point.
- Transition target:
  - static documents / pages
  - dynamic data
  - mostly static interface structure
- Key framing to protect against the "we never had static data" objection:
  - The point is not that web apps never had dynamic data.
  - The point is that we already made data dynamic, while most interface structure is still authored ahead of time.
  - Today's apps are dynamic underneath but mostly static at the surface.
- Story sequence:
  - Personal component craft
  - Component catalog becomes material for agents
  - Agent composition speed shock
  - Conclusion from the agent composition beat: this changes the developer experience, not necessarily the user experience
  - Historical lens discovers the next idea: static pages -> dynamic data -> static UI structure
  - Zoom out, pose the forward question: "vNext?" — a third browser on the timeline with a question mark, bridging to the `UI = f(data)(state)` framing
  - Problem section: why static UI becomes painful
  - Only after that: dynamic UI as the explored answer

## UI Function Framing

- Introduce after the history reaches modern/data-driven apps, not in the personal opening.
- Use the familiar frontend mental model:

```ts
UI = f(data)(state);
```

- Treat `data` broadly enough to include content, records, permissions, user profile, inventory, context, etc.
- Quote / punchline options:
  - "Data became dynamic. State was always dynamic. But `f` was still prebuilt."
  - "The data became dynamic. State is dynamic by nature. But `f` is still what the developer prebuilt ahead of time."
- Speaker support:
  - "`data` is everything the system knows."
  - "`state` is what is happening right now."
  - "`f` is the interface code: components, routes, layouts, flows, and decisions we shipped before the user arrived."
- Visual idea:
  - Show `UI = f(data)(state)`.
  - Animate `data` changing values.
  - Animate `state` pulsing / reacting.
  - Keep `f` visually locked, frozen, or boxed.
- Do not yet say the solution. Let the audience notice the asymmetry first.

## Static UI Problem

- Core framing:
  - Static UI is not bad. It gives consistency, learnability, performance, accessibility, QA, and brand control.
  - The problem is that one prebuilt interface becomes the default routing layer for many different user intentions.
  - Users do not arrive as averages. They arrive with specific intent.
- Candidate line:
  - "Most apps start from the developer's map of the product, not from the user's goal."
- Alternative line:
  - "The app knows its sitemap. The user knows their goal. Static UI makes the user bridge the gap."
- Problem mechanics:
  - Every user gets the same homepage, same dashboard, same navigation, same menus, same links.
  - Each user must translate their intent into the app's information architecture.
  - Useful paths can be buried behind 2, 3, or 4 clicks.
  - The user pays the navigation cost and the cognitive cost of ignoring irrelevant UI.
- Visual idea:
  - Put "developer / product map" on one side of the screen.
  - Put "user / intent" on the opposite side.
  - Grow the developer path between them:
    - Home
    - Dashboard
    - Settings
    - Billing
    - Invoices
    - March
    - Download
  - As the path grows, add links, buttons, sidebars, menus, and route branches to create tension.
  - The visual should feel like the user is being asked to walk through the developer's map.
- Reveal transition, after the problem lands:
  - Remove/collapse the growing developer path.
  - Say: "What if we start from the user?"
  - This is the entrance into dynamic UI, not part of the opening.
- Possible section punchlines:
  - "One interface. Many intents."
  - "The cost is navigation."
  - "The cost is translation."

## Dynamic UI Reveal

- Reveal setup:
  - After the static UI problem lands, collapse/remove the developer/product-map path.
  - Say: "What if we start from the user?"
- Prompt entry point:
  - Users have recently become accustomed to prompt interfaces through chat products.
  - A prompt box is now a familiar starting point for expressing intent.
  - Important distinction: the prompt is not the whole interface; the prompt is the entry point.
- Candidate line:
  - "The prompt is not the interface. The prompt is the entry point."
- Core reveal:
  - The user states intent directly.
  - The system returns a task-specific user interface.
- Punchline options:
  - "Intent in. Interface out."
  - "Prompt in. Interface out."
- Prefer "Intent in. Interface out." because it keeps focus on the user's goal, not on chat as the product model.
- Visual flow:

```txt
User intent
   ↓
LLM
   + app data
   + available actions
   + UI components
   ↓
Task-specific interface
```

- Spoken framing:
  - "Instead of asking the user to navigate the product map, we let them state the goal. Then the system composes a surface for that goal."
- Sample prompt / UI pairs:
  - "I need the invoice from March."
    - UI result: invoice card, amount/date/status, download button, send-to-accountant action.
  - "Compare Project Alpha and Project Beta risks."
    - UI result: comparison table, highlighted differences, risk summary, follow-up action buttons.
  - "I need to change the environment variable of the Foo project."
    - UI result: project match, environment selector, variable picker, value input, optional redeploy action.
- Return to the equation:

```ts
UI = f(data)(state);
```

- Reveal line:
  - "Until now, `f` was the part we shipped."
  - "In a dynamic UI system, `f` can be selected, assembled, or generated at runtime."
- Constraint framing:
  - Dynamic UI should not mean arbitrary unbounded UI.
  - The LLM composes within app data, available actions/server functions, schema, and design system primitives.

## Build-time vs Runtime LLM UI

- Audience question to answer before the demo:
  - "But my UI is already written by an LLM. How is this different?"
- Visual: four figures on one slide:
  - user
  - developer
  - LLM
  - UI
- First view:
  - User is connected to the developer through a UI pipe.
  - The LLM sits behind the developer and is connected to the developer.
  - Meaning: the model helps the developer author a prebuilt UI, but the user still receives the shipped interface.
- Second view:
  - Developer and LLM exchange positions.
  - Developer configures the LLM with primitives, data, actions, and constraints.
  - The LLM is now in the path between user intent and the returned UI.
  - The UI label changes from plain text to the existing gradient treatment from `UI = f(data, state)`.
- Spoken distinction:
  - "Build-time LLM UI helps the developer ship an interface."
  - "Runtime dynamic UI composes the interface when the user arrives."
- Purpose:
  - This is the bridge into the demo.
  - The demo should make concrete that the returned interface is not a generic page generated faster, but the interface for the current request.

## Prompt Surface Transition

- Final visual beat before the demo:
  - White browser shell against the dark deck.
  - Empty page body.
  - Single prompt-style input centered in the page.
  - Click reveal rotates the browser into a dark code-editor surface.
  - Editor progresses through an abstract UI function:
    - `function ui(prompt) { /**/ }`
    - `function ui(prompt, data, state) { /**/ }`
    - `components`
    - `design`
    - `actions`
- Spoken handoff:
  - "So the demo starts from almost nothing: a blank product surface and a place for intent."
  - "Now let's turn it around and look at the code path."

## Demo Reset

- Purpose:
  - Make the dynamic UI idea concrete after slide 10.
  - Show a user starting from intent, not from the product map.
  - Keep the domain boring and relatable.
  - Add one small twist so the demo is not a literal replay of the setup slides.
- Constraints:
  - The demo should feel connected to the static SaaS problem from earlier.
  - The generated UI should be task-shaped, not a prettier dashboard or page.
  - The app should expose bounded data, components, and actions; the model should compose within those constraints.
  - The live path should be simple enough to explain while presenting.
- Settled decisions:
  - Product name: Boxel.
  - Why: a small wordplay on Vercel, but with a square instead of a triangle.
  - Visual anchor: simple square logo, no elaborate brand story.
- First prompt:
  - "I want to purchase a license."
- Agreed demo functionality:
  - Read:
    - `listLicensePlans()`
      - Gives the model the available license options, prices, limits, and constraints.
      - Purpose: lets the generated UI present real choices instead of inventing plans.
  - Write:
    - `startTrial()`
      - Starts a trial license for a selected plan.
      - Purpose: gives the UI a low-friction path when the user is not ready to buy.
    - `purchaseLicense()`
      - Performs the actual license purchase once the user confirms a plan.
      - Purpose: gives the demo a concrete, safe action to submit.
    - `requestQuote()`
      - Sends a quote request with company and license needs.
      - Purpose: gives the UI a sensible fallback for custom pricing or large teams.
- Decisions to make next:
  - User situation:
  - Product capabilities:
  - Primary prompt:
  - Expected generated UI:
  - Safe action to submit:
  - Punchline after the UI appears:

## Checkpoint: Story So Far

1. I spent my career building UI primitives.
2. Simple UI is not simple when it has to be production-grade.
3. Lately, I have been building those primitives for agents to compose, not only for humans to use directly.
4. Agents can compose whole screens from a developer prompt and a component catalog very quickly.
5. The immediate conclusion: this changes the developer experience, not necessarily the user experience.
6. To understand what else could change, look at the web's previous transitions.
7. The history section should reveal static UI structure, then the problem section should explain why that matters before dynamic UI is introduced.

## TODO

- Decide the exact first spoken sentence after the title slide.
- Decide whether the opening visualization should be built as a Slidev/Vue animation, a recorded app clip, or a sequence of static/progressive slides.
- Find a concise way to visualize "agent composition changed development speed, but user flow may still be unchanged."
- Later slide idea: "interface debt montage" where persona/use-case requirements accumulate until the screen becomes crowded.

# Historical Comparison

- We used to have static web-sites, with both static data and static UI
- We now have web-apps; with dynamic data (from a CMS or database; through a server),
  - the UI is still static, build beforehand by a develop;
  - UI is bloated; containing many stuff the user does not care about;
- Challenge the future, that both data & UI can by dynamic; The UI can be a) built on-demand for the exact's user needs and b) personalized for this exact persona;

# From text to UI

- LLMs can generate both text and structured output; show how structured out put can be utilized to describe user-interface
  - note: reference existing semi-standards, if any. (vercel just release ui-json-schema)
- The flow: user states intention -> we ask the llm to produce the UI for it's task -> llm "describes" UI -> we render it to the user
- Simple showcase of the whole flow, end-to-end; deep-dive next

# Deep-dive

- Deeper explanation of the json schema;
  - how does it reference components;
  - how does it provide props;
  - how does React Server Components enable us to do this efficiently!

# State and Data

- Data; UI = fn(data)(state) "The Abramov's Conjecture";
- Demo stance:
  - Keep the generated UI mostly declarative.
  - Do not ask the LLM to use runtime selector/binding primitives.
  - Let the LLM synthesize forms: inferred values become hidden fields; unresolved values become visible controls.
  - Treat server action results and accumulated state as transcript context.
  - Regenerate the next task-specific UI from that state.
- Reason:
  - Runtime binding primitives are a real direction, but they need too much prompting and make the demo feel flaky.
  - For the talk, action -> state -> regenerated UI is easier to explain and more reliable on stage.
- Data approaches:
  - on-demand - Let the LLM fetch/read data when needed (faster, easier)
  - pre-emptive - Ask a RAG for relevant data for your user's request (an extra step, slower)

# Design & Styling

- Feeding LLMs with your design-system primitives
- Allow it to compose UI as lego blocks; bigger pieces or smaller components;
- tailwind as a filler; LLMs love everything to be in the same place.

# Interactivity

- User interface should not be read-only; it should provide interactivity
- Referencing Server functions in LLMs output

# Latency and UX:

- it's slow; how do we stream it?
- even then; LLMs are the bottleneck TODAY! but everything is evolving

# Practical use-case

- an `/explore` page in your app with a single prompt inside
- MCP apps - maybe?

# Future outlook

- You define a set of server functions for your app - what it can do - `buy`/`schedule`/`renew`
- You pick a Design System - brand colors, logos
- You give everything to a Dynamic UI Engine, it produces the UI on demand for your users
