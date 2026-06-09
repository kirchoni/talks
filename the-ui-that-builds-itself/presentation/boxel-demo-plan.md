---
title: Boxel Demo Sequence Draft
---

# Boxel Demo Sequence Draft

Status: Draft / thinking notes.

This document is not final implementation scope yet. It captures the current
thinking for how the live demo should grow from first principles.

The demo grows out of the final slide:

```ts
function ui(prompt, data, state, capabilities, design_system) {}
```

The reveal should move roughly left to right through that signature. Not
everything has to appear in perfect argument order, but each step should expose
why the next argument is needed.

## Current Principle

Start from the most basic loop and add one missing ingredient at a time.

Each checkpoint should create a visible limitation that the next checkpoint
solves.

Do not optimize for streaming, polish, or the final product surface too early.
First prove the loop. Then make it grounded. Then make it useful. Then make it
contextual. Then make it feel like a product.

## Checkpoint 1: Basic UI Loop

Covered argument:

- `prompt`

Goal:

Show the absolute minimum loop from user intent to generated UI.

Flow:

```txt
prompt input
-> backend
-> LLM call
-> tree-like UI schema
-> renderer
-> visible UI
```

Prompt:

```txt
I want to purchase a license
```

At this point we do not have:

- product data
- design system
- component catalog
- real actions
- useful state

Expected result:

The model returns some arbitrary interface. It might look plausible, but it is
not grounded in the product.

Speaker point:

> We have generated a UI, but we have not generated a useful product surface
> yet.

Important detail:

Start with a tree-like schema. Do not introduce streaming yet. Streaming can
come later as an optimization / next step.

The schema should constrain renderable element types to a finite enum from the
beginning. `hidden` is not an element type; hidden form values are regular
`input` elements with `type="hidden"`.

Open question:

- What is the minimum system prompt for this first version?

## Checkpoint 2: Add Data

Covered argument:

- `data`

Add the first read capability:

```ts
listLicensePlans();
```

Same user prompt:

```txt
I want to purchase a license
```

Now the model can build the UI based on real product data:

- actual plans
- prices
- limits
- constraints
- maybe trial availability

Expected result:

The generated UI is still simple, but it is no longer hallucinating the product.

Speaker point:

> Same intent. Better interface, because the model is now grounded in app data.

## Checkpoint 3: Add Capabilities

Covered argument:

- `capabilities`

Add the first write capability:

```ts
purchaseLicense();
```

Now the generated UI should become interactive.

The model should stop producing only read-only information and start producing
form/action UI.

Expected result:

The LLM reads the license plans, chooses or presents a plan, and creates a
form/button that can call `purchaseLicense()`.

Speaker point:

> The model is not just describing information anymore. It is composing a
> working interface around product capabilities.

Important note:

The moment we add `purchaseLicense()`, a new problem appears: the function needs
context, such as `accountId`.

Re-creation note:

When rebuilding this checkpoint live, include a small visible action-response
area near the generated UI. Without it, the `missing accountId`/`accountId is
required` failure happens but the audience cannot see it, which makes the move
into checkpoint 4 feel unmotivated.

Speaker line:

> We will get back to state in a second.

Do not derail yet. First land the capabilities point.

### Checkpoint 3.1: Inline App Catalogs

Problem:

Hard-coding available actions in the system prompt works for a demo checkpoint,
but hand-maintaining that prose makes the prompt carry app API bookkeeping.

At the same time, extracting always-available app surface area into tool calls
adds an unnecessary discovery round. Capabilities and the design system are not
conditional lookups. They are part of the environment the UI generator always
needs.

Mechanism:

Move capability details into an app-owned catalog derived from source, then
inline that catalog into the initial model context alongside the component and
token catalogs:

```ts
system(prompt + capabilities + design_system)
user(intent)
user(state)
```

The catalog is derived from the capability source with TypeDoc, including compact
JSDoc annotations on fields where the app wants to communicate constraints.

Previous idea:

```ts
listCapabilities();
readDesignSystem();
```

That is useful only if the model should decide whether it needs those catalogs.
For this demo, it always does, so keeping them in prompt context is simpler and
easier to explain live.

Expected result:

The system prompt describes the UI protocol and includes the always-available
app catalogs up front. The model can immediately render against known actions,
known components, and known design tokens without spending a tool round on
static environment discovery.

Speaker point:

> Capabilities and components are not prose we remember to paste by hand. They
> are app-owned catalogs generated from source and placed in context before the
> first UI is rendered.

Tool boundary:

Use tools for dynamic information the agent may or may not need during the task:
product data, resource search, document reads, and other runtime lookups. Do not
use tools for always-present catalogs that every generation needs.

## Checkpoint 4: Add State

Covered argument:

- `state`

Problem:

The purchase action needs to know who is buying the license.

The user should not have to type known context every time.

State can provide things like:

- account id
- current user
- current company
- existing license status
- selected plan
- previous action result

### Checkpoint 4.1: Read State

Mechanism:

Send the current client state into the generation request and include it in the
LLM context.

Expected result:

The generated form carries necessary context into the backend. Some state may be
visible. Some state may be hidden or server-derived.

Speaker point:

> The model can now read the state of the task, not just the user's latest
> words.

### Checkpoint 4.2: Write State

Mechanism:

The first state-changing capability can be a simple `login()` action. Keep the
mechanism generic: any action response may include a root-level `statePatch`,
and the client action runner applies that patch to local state and persists it.

Expected result:

The generated login form can call `login()`, receive `{ action, result,
statePatch }`, and update the client state without the model writing storage
directly.

Speaker point:

> State is app-owned context. The model can read it, and actions can change it
> through a controlled boundary.

### Checkpoint 4.3: Agent Loop

Mechanism:

The first generation creates a `sessionId` and stores the full model transcript
on the server:

```txt
system -> user(intent) -> user(state) -> assistant(ui)
```

License plans stay in static generation context through Checkpoint 6. The loop
beat is multi-turn UI, not data fetching — data-as-tool arrives at Checkpoint 7.

After an action returns, the client applies any `statePatch`, then sends the
same `sessionId` back with the exact action response and final state. The server
restores the transcript and appends:

```txt
user(action response) -> user(state) -> assistant(next ui)
```

Expected result:

The login action updates local state, then the UI regenerates into the next
useful step with the account context available.

Problem revealed:

This is a real agent loop, but every consecutive turn carries more transcript.
The upside is that the prefix stays stable, so provider prompt caching can reuse
the earlier system, user, and assistant messages instead of paying full price
for a rewritten context blob.

Speaker point:

> The interface is no longer a one-shot answer. It is now a loop: act, update
> state, ask for the next interface.

Important architecture note:

For the real app, sensitive identity should come from the server/session, not
from trusting a hidden input.

Speaker point:

> The interface is now contextual. It knows enough about the current user and
> state of the task to avoid asking for things the app already knows.

First successful purchase happens here.

## Checkpoint 5: Streaming, Workflow, Patches

Problem:

The agent loop works, but the interface still arrives as one complete answer.
That shaped the product flow too: when every next step means another full wait,
we are pushed to tuck compare, select, quantity, and purchase into one screen.

This creates the need for a different representation:

- stable node ids
- flat nodes
- streaming generation
- a more natural workflow
- patches

Keep the flat-node shape simple for the live demo: `id` gives identity,
`parentId` gives structure, and sibling order comes from the returned row /
command order. Do not add a separate `index` field unless the demo later needs
precise reordering as its own concept.

### Checkpoint 5.1: Stream Initial UI

Mechanism:

Move from:

```txt
wait -> full tree
```

to:

```txt
stream -> nodes -> reconstructed tree
```

Expected result:

The client can show meaningful UI sooner, before the whole interface is done.
The first generated screen no longer has to arrive all at once.

Spoiler:

Nodes need stable ids so the client can reconstruct parent-child relationships
as the stream arrives.

Speaker point:

> The model does not have to hand us the whole interface at once. It can hand us
> pieces, and the client can assemble them.

### Checkpoint 5.2: Expand The Workflow

Mechanism:

Because rendering is less all-or-nothing, split the coarse purchase action into
a cart workflow:

```txt
addToCart -> review cart -> checkout
```

Expected result:

The generated UI can become a more natural multi-step flow instead of compressing
the whole purchase into one screen.

The cart is app-owned client state. `addToCart` returns a `statePatch.cart`.
Then checkout receives `accountId`, a hidden JSON `cart` value, and a
`billingCycle` choice such as monthly or yearly.

Speaker point:

> We used to pack the whole journey into one screen because each next step was
> expensive. Now that the interface can arrive progressively, we can afford a
> more natural workflow.

Problem revealed:

Small workflow actions expose a new mismatch. Adding one plan to a cart changes
state immediately, but the runtime still asks the model for another full UI.

### Checkpoint 5.3: Patch Existing UI

Mechanism:

For consecutive actions, stop sending and replacing the entire UI. Use stable
ids to let the model describe changes to the existing node graph.

Expected result:

The client can keep most of the current UI and apply small changes after an
action or state update.

Visual note:

Add a small "highlight changes" treatment so patched rows briefly call attention
to the parts of the UI that changed.

Spoiler:

The ids introduced for streaming become even more useful for patches.

Speaker point:

> Once the UI has identity, the model can stop repainting the whole screen and
> start editing it.

Checkpoint 5 postpones visual design. It first improves the runtime shape of the
generated interface.

## Checkpoint 6: Add Design System

Covered argument:

- `design_system`

Problem:

The runtime loop works. The interface streams, patches, handles state and
actions. But it still renders with raw HTML elements. A bare `<button>` and an
unstyled `<input>` are functional, but they do not look like the product. The
audience has no reason to believe this output belongs to Boxel.

### Checkpoint 6.1: Feed Components

Mechanism:

Provide a typed design-system component catalog to the model as a message at
the start of the conversation. The catalog uses a compact TypeScript-signature
format generated from TSDoc on the component source:

```txt
Button — Submit or reset control for generated forms.
  children?: ReactNode
  disabled?: boolean
  tone?: "default" | "success" | "warning" | "danger" | "info" = "default" — Semantic color.
  type?: "button" | "submit" | "reset" = "submit"
```

The system prompt adds one instruction: prefer design-system components over
raw HTML elements.

Components are native-granularity wrappers, not compound widgets. The model
already thinks in `Label` + `Input`, not `TextField`. Match that granularity:

- **Badge** — semantic status label
- **Button** — submit/reset control with tone
- **Card** — bounded surface with tone
- **Divider** — visual separator
- **Form** — styled form container, owns action wiring
- **Input** — all native input types including hidden
- **Label** — field label
- **Option** — select option
- **Select** — dropdown
- **Text** — polymorphic typography (h1–h3, p, span, small, strong) with size and tone

The renderer maps PascalCase component types from the model output to the
design-system React components. Raw HTML types still render but are visually
unstyled — the Shadow DOM baseline is stripped to a bare reset (font, box-sizing,
margins only), so any raw HTML fallthrough is immediately obvious.

Form is the single form path. Lowercase `form` is removed from the element
vocabulary. `Form` handles both styling (grid layout) and action wiring
(onSubmit interception).

Expected result:

Same prompt, same data, same capabilities. But the output uses Card, Badge,
Text, Button — it looks like the product.

Speaker point:

> The model is no longer inventing markup. It is composing from the same
> components your team ships.

### Checkpoint 6.2: Add Design Tokens + Utility Classes

Problem:

Components render with hardcoded inline styles. The model cannot extend or
adjust visual presentation because it has no design vocabulary. A Card is
always `#ffffff` background with `#d4d4d4` border — there is no way for the
model to say "make this a primary surface" or "add more padding."

Mechanism:

Introduce a design token catalog (colors, spacing, typography) and migrate
components from inline `style` props to Tailwind CSS utility classes powered
by UnoCSS.

Stack:

- **Tailwind v4 syntax** — the utility class vocabulary
- **UnoCSS as the engine** (tw4 preset) — generates CSS from raw strings at
  runtime, which Tailwind's own compiler cannot do
- **Design catalog as a message** — token names fed to the model alongside the
  component catalog. If the catalog has a `primary` color, `bg-primary` should
  be obvious without extra instructions.

Component migration:

Each component moves from inline `style` to `className`. The old inline styles
are preserved as `// pre 6.2` comments for backtracking. Each component's
`className` prop documents its defaults via a `@default` TSDoc tag, so the
model sees what is already styled and can extend or override without conflicts.

The design tokens flow through both catalogs:

1. The **style catalog** lists `primary`, `secondary`, `success`, etc.
2. The **component catalog** shows `@default "rounded-md px-3 py-2
   bg-secondary text-on-secondary"` on Button

The model sees the token in the vocabulary and sees it used in a live example.
This creates a self-reinforcing loop — no extra system prompt instructions
needed.

CSS generation — incremental streaming:

CSS is not generated once at the end. As each UI command streams from the
model, the server extracts new `className` tokens, feeds them to UnoCSS
`generate()`, and sends a `styles` SSE event with the updated CSS. The client
appends a second `<style>` tag inside the Shadow DOM so each component is
styled the moment it appears.

Default component classes are seeded before the first command — the server
reads all `@default` className values from the catalog and generates their CSS
up front, so built-in styles are never missing.

Token color utilities (`bg-surface`, `text-primary`, `border-border`, …)
bypass preset-wind4's `color-mix` layer and resolve to direct `var(--ui-color-*)`
references. This avoids `--un-*-opacity` CSS variables that break inside
Shadow DOM where `@property` registrations do not apply.

Expected result:

Components look the same as before (the defaults reproduce the inline styles).
But now the model can write `className="bg-primary p-6"` on any element and
the design system responds. Styles arrive progressively — no flash of unstyled
content.

Speaker point:

> The model does not just know which components exist. It knows the design
> language — and it can use it anywhere, not just inside our components.

## Checkpoint 7: Expand The App Surface

Covered argument:

- `data`
- `capabilities`

Problem:

The demo has proven the loop with one user journey:

```txt
I want to purchase a license
```

That is useful, but it can still look like we built a dynamic license-purchase
screen. The final checkpoint should make the larger claim visible: once the app
has wired external data access, local state, local capabilities, and
design-system context into the loop, expanding the product surface does not mean
adding a new UI screen by hand.

Mechanism:

Replace the narrow local license-plan read tool with a connection to the
already-indexed Progress Agentic RAG knowledge box:

```ts
queryData(text: string)
readDataResource(resourceId: string, fieldId: string)
```

`queryData()` is the first pass: ask the knowledge box for resources relevant to
the user's current task. `readDataResource()` is the second pass: when the model
needs the actual source file content, read the original resource field returned
by the search result.

The app does not create this data during the demo. The data is already in the
RAG service. The app only knows how to connect to it through `PARAG_API_ENDPOINT`,
`PARAG_KB_ID`, and `PARAG_API_KEY`.

This keeps the local capability catalog focused on actions the app can perform,
while data access becomes a general connection to an external app knowledge base
instead of a hardcoded tool per data type.

Previous shape:

```ts
listLicensePlans();
```

New shape:

```ts
queryData("license plans that can be purchased online");
readDataResource(resourceId, fieldId);
```

The important demo point is not that RAG is magic. It is that data access is now
general enough for the agent to decide which app resources are relevant to the
current user journey.

### Checkpoint 7.1: Connect To App Knowledge

Do not create local data for this checkpoint. The point is that the app can
connect to data that already lives outside the UI runtime.

The knowledge box should contain multiple small, overlapping resources. Do not
index one resource per persona. That would make the RAG layer look like a
disguised switch statement.

Expected indexed resources:

- `license-plans.json` — plan ids, prices, limits, trial availability, cart
  behavior
- `license-addons.json` — purchasable add-ons that can be attached to plans
- `trial-policy.md` — who can start a trial and what the trial includes
- `docs-index.json` — searchable doc summaries and source paths
- `docs/billing-and-licenses.md` — cart, checkout, and license purchase notes
- `docs/activating-your-license.md` — post-checkout activation instructions
- `docs/getting-started.md` — onboarding guidance
- `docs/api-authentication.md` — integration guidance
- `stock-history.json` — historical `$BOXL` stock performance
- `press-releases.json` — investor-facing company announcements
- `investor-faq.md` — read-only investor guidance
- `jobs.json` — open roles with job ids and application requirements
- `hiring-process.md` — how applying works
- `teams.json` — team context for roles and product areas

Expected result:

Different prompts should naturally retrieve different combinations of resources.
For example, a trial prompt might use `license-plans.json` and
`trial-policy.md`; a purchase prompt might use plans, add-ons, billing docs, and
activation docs; an investor prompt might use stock history, press releases, and
the investor FAQ.

Speaker point:

> We did not teach the renderer a trial screen, an investor screen, or a job
> application screen. We connected it to app knowledge and gave it more local
> capabilities.

### Checkpoint 7.2: Expand Capabilities Without Adding Screens

The capability catalog now covers the app actions needed by the demo personas:

```ts
login();
addToCart();
updateCart();
removeFromCart();
checkout();
startTrial();
requestQuote();
applyForJob();
```

Keep these as product capabilities, not UI instructions. The function names and
argument docs should describe what the app can do, not what the interface should
look like.

This is the local expansion in checkpoint 7. The data side is remote and already
indexed; the app-owned part we add is the set of safe actions the generated UI
may call.

Important cleanup from earlier draft:

- Remove `sendDocsLink()`. Documentation is data, not an action.
- Remove `requestInvestorPacket()`. Investor content is read-only data for this
  demo.
- Replace `submitJobInterest()` with `applyForJob(jobId, ...)`, so the action
  references a concrete job returned from the data layer.
- Add `updateCart()` and `removeFromCart()` so the purchase flow can recover
  from a wrong quantity or plan choice before checkout.

Expected result:

The model can generate different task-specific interfaces from the same runtime
contract:

- Trial user: find eligible plans and call `startTrial()`.
- License buyer: find plans/add-ons, manage the cart, call `checkout()`, then
  surface activation instructions from docs.
- Enterprise buyer: detect quote-only plan behavior and call `requestQuote()`.
- Investor: retrieve stock history, press releases, and FAQ content without a
  write action.
- Job candidate: retrieve jobs and hiring process context, then call
  `applyForJob()` with the selected `jobId`.

Speaker point:

> The UI changes because the task changed. The renderer did not.

Final demo beat:

Use the existing purchase flow as the stable path, because it exercises the most
of the system:

```txt
I want to purchase a license
```

The final version should be able to:

1. Query app data for relevant license plans.
2. Let the user add a plan to cart.
3. Let the user update or remove the cart item.
4. Checkout with account/payment context.
5. After checkout, query or read the activation docs and render the next useful
   step instead of stopping at "success".

Then briefly try one non-purchase persona prompt to show the expansion:

```txt
I want to apply for a job
```

or:

```txt
I want to invest in the stock
```

Expected result:

The app produces a different useful surface without a new route, a new React
page, or a renderer change.

Final speaker point:

> The framework is now boring in the best possible way. The exciting part moves
> back to the app: what external knowledge do we connect, what state do we
> trust, and what local capabilities are safe to call?
