<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  click?: number;
}>();

const states = ["buildtime", "runtime", "deploy"] as const;
const state = computed(() => states[Math.min(props.click ?? 0, states.length - 1)]);

const developerEl = ref<HTMLElement | null>(null);
const llmEl = ref<HTMLElement | null>(null);
let animationFrames: number[] = [];

const isReducedMotion = () => {
  if (typeof window === "undefined") return true;
  return (
    document.documentElement.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

const clearAnimationFrames = () => {
  animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
  animationFrames = [];
};

watch(
  state,
  async () => {
    if (typeof window === "undefined") return;

    clearAnimationFrames();

    const nodes = [developerEl.value, llmEl.value].filter(
      (node): node is HTMLElement => Boolean(node),
    );
    const firstRects = new Map(
      nodes.map((node) => [node, node.getBoundingClientRect()]),
    );

    await nextTick();

    if (isReducedMotion()) return;

    nodes.forEach((node) => {
      const first = firstRects.get(node);
      if (!first) return;

      const last = node.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;

      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

      node.style.transition = "none";
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      const frame = window.requestAnimationFrame(() => {
        node.style.transition = "transform 680ms var(--map-ease)";
        node.style.transform = "";
      });

      animationFrames.push(frame);
    });
  },
  { flush: "pre" },
);

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  clearAnimationFrames();
});
</script>

<template>
  <section class="llm-ui-map" :data-state="state">
    <div class="llm-ui-map__stage" aria-label="Build-time LLM UI compared with runtime LLM UI">
      <svg
        class="deploy-boundary"
        viewBox="0 0 900 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <text class="deploy-boundary__label" x="48" y="42">↑ deploy boundary</text>
        <path
          class="deploy-boundary__line deploy-boundary__line--main"
          pathLength="1"
          d="M-18 76C110 62 188 88 302 78C438 66 515 91 646 76C746 65 820 57 918 72"
        />
        <path
          class="deploy-boundary__line deploy-boundary__line--echo"
          pathLength="1"
          d="M-14 82C104 69 194 94 310 84C439 73 522 96 647 83C748 72 825 64 914 78"
        />
      </svg>

      <aside class="actor actor--user" aria-label="User">
        <span class="actor__figure">
          <span class="actor__head" />
          <span class="actor__body" />
        </span>
        <span class="actor__label">user</span>
      </aside>

      <div class="connection connection--primary" aria-hidden="true">
        <span class="connection__line" />
      </div>

      <aside class="app-node" aria-label="Deployed app">
        <span class="app-node__core">
          <span class="app-node__label">&lt;App /&gt;</span>
          <span class="app-node__mini-llm" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M9 13a4.5 4.5 0 0 0 3-4" />
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
              <path d="M6 18a4 4 0 0 1-1.967-.516" />
              <path d="M12 13h4" />
              <path d="M12 18h6a2 2 0 0 1 2 2v1" />
              <path d="M12 8h8" />
              <path d="M16 8V5a2 2 0 0 1 2-2" />
              <circle cx="16" cy="13" r=".5" />
              <circle cx="18" cy="3" r=".5" />
              <circle cx="20" cy="21" r=".5" />
              <circle cx="20" cy="8" r=".5" />
            </svg>
          </span>
        </span>
      </aside>

      <div class="connection connection--app-developer" aria-hidden="true">
        <span class="connection__line" />
      </div>

      <aside ref="developerEl" class="actor actor--developer" aria-label="Developer">
        <span class="actor__figure actor__figure--developer">
          <span class="actor__head" />
          <span class="actor__body" />
          <span class="developer__badge" aria-hidden="true">
            <svg viewBox="0 0 28 18" focusable="false">
              <path d="M10 4L4 9L10 14" />
              <path d="M18 4L24 9L18 14" />
              <path d="M15.6 2.6L12.4 15.4" />
            </svg>
          </span>
        </span>
        <span class="actor__label">developer</span>
      </aside>

      <div class="connection connection--secondary" aria-hidden="true">
        <span class="connection__line" />
      </div>

      <aside ref="llmEl" class="llm-node" aria-label="Large language model">
        <span class="llm-node__core">
          <!-- Lucide brain-circuit icon. -->
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M9 13a4.5 4.5 0 0 0 3-4" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M12 13h4" />
            <path d="M12 18h6a2 2 0 0 1 2 2v1" />
            <path d="M12 8h8" />
            <path d="M16 8V5a2 2 0 0 1 2-2" />
            <circle cx="16" cy="13" r=".5" />
            <circle cx="18" cy="3" r=".5" />
            <circle cx="20" cy="21" r=".5" />
            <circle cx="20" cy="8" r=".5" />
          </svg>
        </span>
        <span class="llm-node__label">LLM</span>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.llm-ui-map {
  --map-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --map-pipe-muted: color-mix(in srgb, var(--deck-text-muted) 48%, transparent);
  --map-pipe-strong: color-mix(in srgb, var(--deck-primary) 84%, var(--deck-secondary));

  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--deck-text-primary);
}

.llm-ui-map__stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(7.5rem, 1fr) minmax(5.6rem, 0.72fr) minmax(7.5rem, 1fr) minmax(9.5rem, 1.45fr) minmax(6rem, 1fr);
  grid-template-rows: minmax(7rem, auto) minmax(5.25rem, 0.75fr) minmax(7rem, auto);
  column-gap: 0;
  row-gap: 0;
  align-self: center;
  justify-self: center;
  width: min(100%, 51rem);
  height: min(100%, 20rem);
  max-height: 100%;
  min-height: 0;
}

.deploy-boundary {
  position: absolute;
  inset: 34% -8% auto -8%;
  z-index: 2;
  width: 116%;
  height: 8.6rem;
  color: var(--deck-warning);
  opacity: 0;
  pointer-events: none;
}

.deploy-boundary__label {
  fill: currentColor;
  font-family: var(--deck-font-mono);
  font-size: 18px;
  font-weight: 780;
  letter-spacing: 0.08em;
  opacity: 0;
  text-transform: uppercase;
}

.deploy-boundary__line {
  fill: none;
  stroke: currentColor;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.deploy-boundary__line--main {
  filter: drop-shadow(
    0 0.12rem 0.22rem color-mix(in srgb, var(--deck-warning) 22%, transparent)
  );
  opacity: 0.82;
  stroke-width: 3.4;
}

.deploy-boundary__line--echo {
  opacity: 0.36;
  stroke-width: 1.1;
}

.llm-ui-map[data-state="deploy"] .deploy-boundary {
  opacity: 1;
}

.llm-ui-map[data-state="deploy"] .deploy-boundary__label {
  opacity: 1;
}

.llm-ui-map[data-state="deploy"] .deploy-boundary__line {
  stroke-dashoffset: 0;
}

.connection {
  position: relative;
  z-index: 2;
  display: grid;
  align-items: center;
  min-width: 0;
}

.connection--primary {
  grid-column: 4;
  grid-row: 1;
}

.connection--app-developer {
  grid-column: 3;
  grid-row: 2;
}

.connection--secondary {
  grid-column: 2;
  grid-row: 3;
}

.connection__line {
  display: block;
  width: 100%;
  height: 0.28rem;
  border-radius: var(--deck-radius-pill);
  background: var(--map-pipe-muted);
}

.connection--secondary .connection__line {
  height: 0.18rem;
  background: var(--map-pipe-muted);
}

.connection--primary .connection__line {
  width: 100%;
  justify-self: stretch;
  transform: rotate(0deg);
}

.connection--app-developer .connection__line {
  justify-self: center;
  width: 0.22rem;
  height: 100%;
  min-height: 5.4rem;
}

.llm-ui-map[data-state="runtime"] .connection--primary .connection__line,
.llm-ui-map[data-state="deploy"] .connection--primary .connection__line {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--deck-secondary) 88%, var(--deck-primary)),
    color-mix(in srgb, var(--deck-primary) 74%, var(--deck-secondary))
  );
  box-shadow: 0 0 0.72rem color-mix(in srgb, var(--deck-secondary) 28%, transparent);
}

.actor,
.app-node,
.llm-node {
  z-index: 3;
  display: grid;
  justify-items: center;
  align-self: center;
  justify-self: center;
  gap: 0.62rem;
  min-width: 0;
}

.actor {
  align-self: stretch;
  justify-self: stretch;
  gap: 0;
  place-items: center;
}

.llm-node {
  align-self: stretch;
  justify-self: stretch;
  gap: 0;
  place-items: center;
}

.actor--user {
  grid-column: 5;
  grid-row: 1;
}

.app-node {
  grid-column: 3;
  grid-row: 1;
}

.actor--developer {
  grid-column: 3;
  grid-row: 3;
}

.llm-node {
  grid-column: 1;
  grid-row: 3;
}

.actor__figure {
  position: relative;
  grid-area: 1 / 1;
  display: grid;
  justify-items: center;
  width: 4.25rem;
  height: 5.25rem;
}

.actor__head {
  display: block;
  width: 2.22rem;
  height: 2.22rem;
  border: 2px solid
    color-mix(in srgb, var(--deck-text-primary) 66%, transparent);
  border-radius: 52% 48% 47% 53%;
  background: color-mix(in srgb, var(--deck-surface-paper) 92%, transparent);
  box-shadow: 0 14px 34px rgb(16 17 20 / 0.12);
  transform: rotate(-4deg);
}

.actor__body {
  display: block;
  width: 3.05rem;
  height: 1.72rem;
  margin-block-start: -0.28rem;
  border: 2px solid
    color-mix(in srgb, var(--deck-text-primary) 58%, transparent);
  border-bottom: 0;
  border-radius: 999px 999px 0 0;
  background: color-mix(
    in srgb,
    var(--deck-primary) 9%,
    var(--deck-surface-paper)
  );
}

.actor__figure--developer .actor__head,
.actor__figure--developer .actor__body {
  border-color: color-mix(
    in srgb,
    var(--deck-tertiary) 76%,
    var(--deck-text-primary)
  );
}

.actor__figure--developer .actor__body {
  background: color-mix(
    in srgb,
    var(--deck-tertiary) 11%,
    var(--deck-surface-paper)
  );
}

.developer__badge {
  position: absolute;
  right: -0.12rem;
  bottom: 0.72rem;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 1.55rem;
  border: 1.5px solid color-mix(in srgb, var(--deck-tertiary) 80%, transparent);
  border-radius: var(--deck-radius-sm);
  background: var(--deck-surface-paper);
  color: var(--deck-tertiary);
  box-shadow: 0 0 0 0.25rem
    color-mix(in srgb, var(--deck-tertiary) 10%, transparent);
}

.developer__badge svg {
  display: block;
  width: 1.26rem;
  height: 0.82rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.05;
}

.developer__badge path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.05;
}

.actor__label,
.llm-node__label {
  color: var(--deck-text-muted);
  font-family: var(--deck-font-mono);
  font-size: 0.78rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.actor__label {
  grid-area: 1 / 1;
  align-self: center;
  justify-self: center;
  transform: translateY(3.22rem);
  white-space: nowrap;
}

.app-node__core,
.llm-node__core {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
  width: 5.8rem;
  height: 5.35rem;
  border: 1.5px solid color-mix(in srgb, var(--deck-secondary) 48%, transparent);
  border-radius: var(--deck-radius-md);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--deck-secondary) 12%, transparent),
      color-mix(in srgb, var(--deck-primary) 14%, transparent)
    ),
    var(--deck-surface-paper);
  box-shadow:
    0 0 0 0.32rem color-mix(in srgb, var(--deck-secondary) 8%, transparent),
    0 18px 50px rgb(16 17 20 / 0.11);
  color: color-mix(in srgb, var(--deck-secondary) 76%, var(--deck-primary));
}

.app-node__core {
  position: relative;
  isolation: isolate;
  font-family: var(--deck-font-mono);
  font-size: 1.12rem;
  font-weight: 780;
  letter-spacing: 0;
  border-color: color-mix(in srgb, var(--deck-text-muted) 38%, transparent);
  background: color-mix(in srgb, var(--deck-surface-paper) 94%, transparent);
  box-shadow: none;
  color: var(--deck-text-primary);
  overflow: visible;
}

.app-node__core::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background:
    radial-gradient(
      circle at 100% 100%,
      color-mix(in srgb, var(--deck-secondary) 26%, transparent) 0 34%,
      transparent 68%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--deck-secondary) 12%, transparent),
      color-mix(in srgb, var(--deck-primary) 10%, transparent)
    );
  opacity: 0;
  transform: scale(0.16);
  transform-origin: 100% 100%;
}

.app-node__label {
  position: relative;
  z-index: 1;
}

.app-node__mini-llm {
  position: absolute;
  right: -0.72rem;
  bottom: -0.62rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.1rem;
  border: 1.3px solid color-mix(in srgb, var(--deck-secondary) 56%, transparent);
  border-radius: var(--deck-radius-sm);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--deck-secondary) 16%, transparent),
      color-mix(in srgb, var(--deck-primary) 14%, transparent)
    ),
    var(--deck-surface-paper);
  box-shadow:
    0 0 0 0.22rem color-mix(in srgb, var(--deck-secondary) 8%, transparent),
    0 12px 30px rgb(16 17 20 / 0.12);
  color: color-mix(in srgb, var(--deck-secondary) 76%, var(--deck-primary));
  opacity: 0;
  transform: translate(22%, 22%) scale(0.72);
  transform-origin: center;
}

.app-node__mini-llm svg {
  display: block;
  width: 1.42rem;
  height: 1.42rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
  transform: rotate(90deg);
}

.llm-ui-map[data-state="runtime"] .app-node__core,
.llm-ui-map[data-state="deploy"] .app-node__core {
  border-color: color-mix(in srgb, var(--deck-secondary) 58%, transparent);
  box-shadow:
    0 0 0 0.3rem color-mix(in srgb, var(--deck-secondary) 7%, transparent),
    0 16px 44px rgb(16 17 20 / 0.1);
  color: color-mix(in srgb, var(--deck-secondary) 76%, var(--deck-text-primary));
}

.llm-ui-map[data-state="runtime"] .app-node__core::before,
.llm-ui-map[data-state="deploy"] .app-node__core::before {
  opacity: 1;
  transform: scale(1);
}

.llm-ui-map[data-state="runtime"] .app-node__mini-llm,
.llm-ui-map[data-state="deploy"] .app-node__mini-llm {
  opacity: 1;
  transform: translate(22%, 22%) scale(1);
}

.llm-node__core svg {
  width: 3.6rem;
  height: 3.6rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transform: rotate(90deg);
}

.llm-node__label {
  grid-area: 1 / 1;
  align-self: center;
  justify-self: center;
  transform: translateY(3.52rem);
  white-space: nowrap;
}

:global(html:not(.reduced-motion) .llm-ui-map .connection__line),
:global(html:not(.reduced-motion) .llm-ui-map .app-node__core),
:global(html:not(.reduced-motion) .llm-ui-map .app-node__core::before),
:global(html:not(.reduced-motion) .llm-ui-map .app-node__mini-llm),
:global(html:not(.reduced-motion) .llm-ui-map .deploy-boundary),
:global(html:not(.reduced-motion) .llm-ui-map .deploy-boundary__label) {
  transition:
    color 420ms ease,
    background 420ms ease,
    box-shadow 420ms ease,
    border-color 420ms ease,
    filter 420ms ease,
    opacity 420ms var(--map-ease),
    transform 560ms var(--map-ease);
}

:global(html:not(.reduced-motion) .llm-ui-map .deploy-boundary__line) {
  transition: stroke-dashoffset 740ms var(--map-ease);
}

:global(.reduced-motion .llm-ui-map *),
:global(.reduced-motion .llm-ui-map *::before),
:global(.reduced-motion .llm-ui-map *::after) {
  transition: none !important;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .llm-ui-map *,
  .llm-ui-map *::before,
  .llm-ui-map *::after {
    transition: none !important;
    animation: none !important;
  }
}

@media (max-width: 820px) {
  .llm-ui-map__stage {
    grid-template-columns: minmax(4.8rem, 1fr) minmax(5.7rem, 1.1fr) minmax(6rem, 1fr) minmax(3.7rem, 0.68fr) minmax(6rem, 1fr);
    width: 100%;
    height: 22rem;
  }
}
</style>
