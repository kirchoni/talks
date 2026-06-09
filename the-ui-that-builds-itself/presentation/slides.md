---
title: "The UI That Builds Itself: Exploring the Generative Front-End"
theme: default
layout: cover
clicks: 1
fonts:
  sans: Geist
  mono: Geist Mono
---

<!-- 
  ACTIVE: Plan B (play-once on click, abstract animation)
  
  Plan A (click-driven concrete animation):
    <SelfBuildingUi compact class="cover-builder" :click="$clicks" />
    (change `clicks: 4`)

  Plan B alt (autoplay, no click needed):
    <SelfBuildingUiAbstract compact autoplay :timing-scale="2" class="cover-builder" />
    (remove `clicks`)

  Plan C (click-driven abstract animation, step by step):
    <SelfBuildingUiAbstract compact class="cover-builder" :click="$clicks" />
    (change `clicks: 4`)
-->

<div class="cover-layout">
  <div class="cover-text">
    <p class="deck-kicker">Exploring the Generative Front-End</p>
    <h1><span>The UI That</span><span>Builds Itself</span></h1>
  </div>
  <SelfBuildingUiAbstract compact playOnce :timing-scale="2" class="cover-builder" :click="$clicks" />
  <div class="cover-author">
    <img class="cover-author__avatar" src="/media/kiril-peyanski-avatar.jpg" alt="Kiril S. Peyanski" />
    <div class="cover-author__info">
      <span class="cover-author__name">Kiril S. Peyanski</span>
      <span class="cover-author__handle">@kirchoni</span>
    </div>
    <span class="cover-author__divider"></span>
    <img class="cover-author__company cover-author__company--light" src="/progress_logos/Progress_PrimaryLogo.svg" alt="Progress" />
    <img class="cover-author__company cover-author__company--dark" src="/progress_logos/Progress_PrimaryLogo_Alternate.svg" alt="Progress" />
  </div>
</div>

---
title: "Building the pieces"
clicks: 5
---

<ComponentShowcase :click="$clicks" />

<!--
I used to build components for humans. Lately, I have also been building components for agents.

Not components for agents to click. Components for agents to compose.

The surprising part is not that an agent can generate a button. The interesting part is that, with a real component catalog and a developer prompt, it can assemble a whole screen in seconds.

That changes the developer experience. The open question is whether it changes anything for the person using the product.
-->

---
title: "Deciding later"
clicks: 6
transition: slide-left
---

<WebHistoryLine :click="$clicks" />

<!--
To reason about that, I want to stop talking about agents for a moment and zoom out.

The web has already gone through several shifts like this.

Not shifts where the old thing stopped mattering, but shifts where one more decision moved later.

At the beginning, most of what the user saw was decided before the page was ever opened. The browser was mostly reading a published document.

That also meant the experience was mostly shared. The page contained the same content, the same data, and the same decisions for everyone who opened it.

[click] Then the web grew up. Data became dynamic. Servers, databases, APIs. But notice something: the interface structure — the layout, the navigation, the components — is still decided ahead of time by a developer. The data changes. The UI does not.

[click] So what comes next? What if the interface itself could change?
-->

---
title: "Prebuilt for everyone"
clicks: 11
transition: slide-left
---

<StaticUiProblem :click="$clicks" />

<!--
This is the part where I do not want to argue that static UI is bad.

Most of the time, static UI is exactly what we want. It gives teams consistency, accessibility, performance, QA, and a shared product language.

The constraint is subtler than "too many clicks."

[click] This surface is prebuilt for many users, many roles, and many intents.

[click] But the person using it arrives with a specific situation: their account, their history, their permissions, their current goal.

[click] So the shift I am interested in is not just faster navigation. It is a change in perspective: from a prebuilt sitemap toward an interface shaped around current intent.
-->

---
title: "The static UI problem"
clicks: 3
transition: slide-left
---

<StaticUiConclusion :click="$clicks" />

<!--
The developer owns useful functionality. None of this is bad. These are real product capabilities.

[click] But once the product is shipped, those capabilities are exposed through a prebuilt route map: pages, menus, dropdowns, footers, pricing cards, dashboards.

[click] The user did not ask for the route map. They asked for one capability.

[click] The user does not experience the functions directly. They experience the route map first, and translate their current intent into the interface we already built.
-->

---
title: "Dynamic UI"
clicks: 3
transition: slide-left
---

<DynamicUiFormula :click="$clicks" />

<!--
So the baseline is simple:

UI equals a function of data and state.

[click] State was always dynamic. The current user, their role, their permissions, the device, the session, the task in front of them.

[click] Data became dynamic too: databases, APIs, feeds, events, and product systems that keep changing underneath the interface.

[click] The part that stayed mostly static is the function: the human-written UI logic that decides what experience those inputs become.
-->

---
title: "When is the UI decided?"
clicks: 2
transition: slide-left
---

<BuildTimeVsRuntimeUi :click="$clicks" />

<!--
At this point, a very fair question is: but isn't my UI already written by an LLM?

Sometimes, yes. But the more precise question is: when is the interface decided?

In the first version, the model helps me build the app. It may write the component, the page, or the flow. But the important part is that the interface is decided before deploy.

[click] The thing I want to explore is the second picture.

The developer is still building the app, and may still use a coding agent to do it. But what gets deployed is a different kind of system: primitives, data access, actions, constraints, and a runtime UI agent.

Then, at use time, the user's intent is known. The UI agent is now inside the running app, in the path between that intent and the returned interface.

Build-time AI helps developers ship UI. Runtime UI agents compose UI after the user arrives.
-->

---
title: "Prompt surface"
clicks: 5
transition: slide-left
---

<PromptBrowserBridge :click="$clicks" />

<!--
So the demo starts from almost nothing.

Just a blank product surface and a place for intent.

[click] And then we turn it around and look at the code path that makes this possible.

[click] The prompt is not enough. The function also needs the product's data.

[click] It needs the current state: the user, the account, the session, and what is already true.

[click] It needs the capabilities the product exposes: the actions it is allowed to call.

[click] And it needs the design system: the components, patterns, and visual language it has to respect.
-->

---
title: "What didn't change"
transition: slide-left
---

<UiFunctionResolved :click="$clicks" />

<!--

-->

---
title: "The developer's new job"
clicks: 3
transition: slide-left
---

<DirectLineReveal :click="$clicks" />

<!--

-->

---
title: "Today's bottleneck"
transition: slide-left
clicks: 1
---

<LlmBottleneck :click="$clicks" />

<!--
Right now, the LLM is the bottleneck.

[click] But bottlenecks are temporary.
-->

---
title: "Thank you"
layout: cover
---

<ClosingThankYou />
