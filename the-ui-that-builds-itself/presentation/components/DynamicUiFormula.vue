<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const states = ["baseline", "state", "data", "all"] as const;
const state = computed(() => states[Math.min(props.click ?? 0, states.length - 1)]);
</script>

<template>
  <section class="dynamic-formula" :data-state="state">
    <svg
      class="dynamic-formula__svg"
      viewBox="0 0 900 132"
      role="img"
      aria-label="UI equals f of data and state"
    >
      <defs>
        <linearGradient
          id="formula-unified-gradient"
          gradientUnits="userSpaceOnUse"
          x1="120"
          y1="122"
          x2="760"
          y2="8"
        >
          <stop offset="0%" stop-color="var(--deck-secondary)" />
          <stop offset="42%" stop-color="var(--deck-secondary)" />
          <stop offset="76%" stop-color="var(--deck-primary)" />
          <stop offset="100%" stop-color="var(--deck-primary)" />
        </linearGradient>
      </defs>

      <text class="dynamic-formula__text" x="24" y="86">
        <tspan class="dynamic-formula__semantic dynamic-formula__result">UI</tspan>
        <tspan class="dynamic-formula__operator"> = </tspan>
        <tspan class="dynamic-formula__semantic dynamic-formula__function">f</tspan>
        <tspan class="dynamic-formula__symbol">(</tspan>
        <tspan class="dynamic-formula__semantic dynamic-formula__data">data</tspan>
        <tspan class="dynamic-formula__symbol">, </tspan>
        <tspan class="dynamic-formula__semantic dynamic-formula__state">state</tspan>
        <tspan class="dynamic-formula__symbol">)</tspan>
      </text>

      <text class="dynamic-formula__text dynamic-formula__text--unified" x="24" y="86">
        <tspan class="dynamic-formula__unified-word">UI</tspan>
        <tspan class="dynamic-formula__unified-space"> = </tspan>
        <tspan class="dynamic-formula__unified-word">f</tspan>
        <tspan class="dynamic-formula__unified-space">(</tspan>
        <tspan class="dynamic-formula__unified-word">data</tspan>
        <tspan class="dynamic-formula__unified-space">, </tspan>
        <tspan class="dynamic-formula__unified-word">state</tspan>
        <tspan class="dynamic-formula__unified-space">)</tspan>
      </text>
    </svg>
  </section>
</template>

<style scoped>
.dynamic-formula {
  --formula-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --formula-text: color-mix(
    in srgb,
    var(--deck-text-primary) 94%,
    var(--deck-text-muted)
  );
  --formula-symbol: color-mix(in srgb, var(--deck-text-muted) 74%, transparent);

  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 100%;
  padding: 2.5rem 0;
}

.dynamic-formula__svg {
  display: block;
  width: min(100%, 52rem);
  height: auto;
  overflow: visible;
}

.dynamic-formula__text {
  font-family: var(--deck-font-mono);
  font-size: 70px;
  font-weight: 760;
  letter-spacing: 0;
  dominant-baseline: alphabetic;
}

.dynamic-formula__semantic {
  fill: var(--formula-text);
  transition:
    fill 520ms var(--formula-ease),
    opacity 520ms var(--formula-ease);
}

.dynamic-formula__operator,
.dynamic-formula__symbol {
  fill: var(--formula-symbol);
  font-weight: 620;
}

.dynamic-formula__state,
.dynamic-formula[data-state="data"] .dynamic-formula__state {
  transition:
    fill 520ms var(--formula-ease),
    opacity 520ms var(--formula-ease),
    filter 520ms var(--formula-ease);
}

.dynamic-formula[data-state="state"] .dynamic-formula__state,
.dynamic-formula[data-state="data"] .dynamic-formula__state {
  fill: var(--deck-primary);
  filter: drop-shadow(
    0 0 0.42rem color-mix(in srgb, var(--deck-primary) 26%, transparent)
  );
}

.dynamic-formula[data-state="data"] .dynamic-formula__data {
  fill: var(--deck-secondary);
  filter: drop-shadow(
    0 0 0.42rem color-mix(in srgb, var(--deck-secondary) 24%, transparent)
  );
}

.dynamic-formula__text--unified {
  opacity: 0;
  transition: opacity 520ms var(--formula-ease);
  filter: drop-shadow(
    0 0 0.42rem color-mix(in srgb, var(--deck-primary) 22%, transparent)
  );
}

.dynamic-formula__unified-word {
  fill: url("#formula-unified-gradient");
}

.dynamic-formula__unified-space {
  fill: transparent;
}

.dynamic-formula[data-state="all"] .dynamic-formula__semantic {
  opacity: 0;
}

.dynamic-formula[data-state="all"] .dynamic-formula__text--unified {
  opacity: 1;
}

:global(.reduced-motion .dynamic-formula *),
:global(.reduced-motion .dynamic-formula *::before),
:global(.reduced-motion .dynamic-formula *::after) {
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .dynamic-formula *,
  .dynamic-formula *::before,
  .dynamic-formula *::after {
    transition: none !important;
  }
}
</style>
