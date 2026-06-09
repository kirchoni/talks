<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  click?: number;
}>();

const DIRECT_LINE_DURATION_MS = 2500;

const dismissed = computed(() => (props.click ?? 0) >= 1);
const showDirectLine = computed(() => (props.click ?? 0) >= 3);

const baseFunctions = [
  { name: "startTrial()", tone: "info" },
  { name: "purchaseSeat()", tone: "primary" },
  { name: "collectPayment()", tone: "secondary" },
  { name: "createInvoice()", tone: "tertiary" },
  { name: "inviteUser()", tone: "warning" },
  { name: "exportReport()", tone: "info" },
] as const;

const newFunctions = [
  { name: "queryData()", tone: "info" },
  { name: "applyForJob()", tone: "warning" },
  { name: "checkout()", tone: "secondary" },
] as const;

const revealedNewCount = ref(0);
const lineComplete = ref(false);
const canvasEl = ref<HTMLElement | null>(null);
const userFigureEl = ref<HTMLElement | null>(null);
const applyForJobEl = ref<HTMLElement | null>(null);
const directPathEl = ref<SVGPathElement | null>(null);
const directPath = ref("");
const directViewBox = ref("0 0 1000 430");
const startLabelX = ref(0);
const startLabelY = ref(0);
let revealTimers: number[] = [];
let directDrawFrame = 0;

const rootPaths = [
  { d: "M10 150 H58 V30 H142 V14 H350" },
  { d: "M10 150 H58 V76 H202 V58 H350" },
  { d: "M10 150 H58 V122 H142 V76 H202 V122 H350" },
  { d: "M10 150 H142 V166 H350" },
  { d: "M10 150 H58 V224 H142 V166 H202 V224 H350" },
  { d: "M10 150 H58 V270 H202 V276 H350" },
] as const;

const isReducedMotion = () => {
  if (typeof window === "undefined") return true;
  return (
    document.documentElement.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

const clearRevealTimers = () => {
  revealTimers.forEach((timer) => window.clearTimeout(timer));
  revealTimers = [];
};

const clearDirectDraw = () => {
  if (typeof window === "undefined") return;
  window.cancelAnimationFrame(directDrawFrame);
  directDrawFrame = 0;
};

const setFunctionRef = (el: Element | null, name: string) => {
  if (name === "applyForJob()" && el instanceof HTMLElement) {
    applyForJobEl.value = el;
  }
};

const setDirectProgress = (progress: number) => {
  const path = directPathEl.value;
  if (!path) return;

  const length = path.getTotalLength();
  const offset = length * (1 - progress);
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${offset}`;
};

const updateDirectPath = () => {
  const canvas = canvasEl.value;
  const user = userFigureEl.value;
  const target = applyForJobEl.value;
  if (!canvas || !user || !target) return;

  const canvasRect = canvas.getBoundingClientRect();
  const userRect = user.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const startX = userRect.left - canvasRect.left + userRect.width + 28;
  const startY = userRect.top - canvasRect.top + userRect.height * 0.47;
  const endX = targetRect.left - canvasRect.left - 26;
  const endY = targetRect.top - canvasRect.top + targetRect.height * 0.58;
  const distance = endX - startX;

  const cp1X = startX + distance * 0.2;
  const cp1Y = startY - 54;
  const cp2X = startX + distance * 0.42;
  const cp2Y = endY + 32;
  const midX = startX + distance * 0.63;
  const midY = endY - 22;
  const cp3X = startX + distance * 0.78;
  const cp3Y = endY - 48;
  const cp4X = startX + distance * 0.9;
  const cp4Y = endY + 8;

  directViewBox.value = `0 0 ${canvasRect.width} ${canvasRect.height}`;
  directPath.value = [
    `M${startX.toFixed(1)} ${startY.toFixed(1)}`,
    `C${cp1X.toFixed(1)} ${cp1Y.toFixed(1)} ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`,
    `C${cp3X.toFixed(1)} ${cp3Y.toFixed(1)} ${cp4X.toFixed(1)} ${cp4Y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
  ].join(" ");

  startLabelX.value = startX + 4;
  startLabelY.value = startY + 28;
};

const drawDirectLine = () => {
  if (typeof window === "undefined") return;

  clearDirectDraw();
  updateDirectPath();
  lineComplete.value = false;

  if (isReducedMotion()) {
    setDirectProgress(1);
    lineComplete.value = true;
    return;
  }

  const path = directPathEl.value;
  if (!path) return;

  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;

  const startedAt = window.performance.now();

  const draw = (now: number) => {
    const progress = Math.min((now - startedAt) / DIRECT_LINE_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    path.style.strokeDashoffset = `${length * (1 - eased)}`;

    if (progress < 1) {
      directDrawFrame = window.requestAnimationFrame(draw);
      return;
    }

    lineComplete.value = true;
  };

  directDrawFrame = window.requestAnimationFrame(draw);
};

const resetDirectLine = () => {
  clearDirectDraw();
  lineComplete.value = false;
  setDirectProgress(0);
};

const visibleFunctions = computed(() => {
  const added = [...newFunctions.slice(0, revealedNewCount.value)].reverse();
  return [...added, ...baseFunctions];
});

const startRevealSequence = () => {
  clearRevealTimers();

  if (isReducedMotion()) {
    revealedNewCount.value = newFunctions.length;
    return;
  }

  revealedNewCount.value = 0;

  for (let index = 0; index < newFunctions.length; index += 1) {
    const timer = window.setTimeout(() => {
      revealedNewCount.value = index + 1;
    }, index * 1000);

    revealTimers.push(timer);
  }
};

watch(
  () => props.click ?? 0,
  async (click) => {
    if (click >= 2) {
      if (click >= 3) {
        clearRevealTimers();
        revealedNewCount.value = newFunctions.length;
      } else if (revealedNewCount.value === 0) {
        startRevealSequence();
      }
    } else {
      clearRevealTimers();
      revealedNewCount.value = 0;
    }

    if (click >= 3) {
      await nextTick();
      drawDirectLine();
      return;
    }

    resetDirectLine();
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof window === "undefined") return;
  window.addEventListener("resize", updateDirectPath);
});

onBeforeUnmount(() => {
  clearRevealTimers();
  clearDirectDraw();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateDirectPath);
  }
});
</script>

<template>
  <section
    class="direct-reveal"
    :data-dismissed="dismissed || undefined"
    :data-line-complete="lineComplete || undefined"
  >
    <div ref="canvasEl" class="direct-reveal__canvas">
      <aside class="actor actor--user" aria-label="User">
        <span ref="userFigureEl" class="actor__figure">
          <span class="actor__head" />
          <span class="actor__body" />
        </span>
      </aside>

      <div class="route-surface" aria-label="Prebuilt route map">
        <svg
          class="route-surface__svg"
          viewBox="0 0 360 300"
          role="img"
          aria-label="Prebuilt navigation path"
        >
          <path
            v-for="path in rootPaths"
            :key="path.d"
            class="route-surface__root"
            :d="path.d"
          />
        </svg>
      </div>

      <svg
        v-show="showDirectLine"
        class="direct-surface"
        :viewBox="directViewBox"
        preserveAspectRatio="none"
        aria-label="Intent reaches functionality directly"
        role="img"
      >
        <path
          ref="directPathEl"
          class="direct-surface__line"
          :d="directPath"
        />
        <text
          class="direct-start-label"
          :x="startLabelX"
          :y="startLabelY"
        >
          start
        </text>
      </svg>

      <aside class="developer" aria-label="Developer-owned functionality">
        <div class="function-stack-host" aria-label="Product functions">
          <TransitionGroup
            name="function-push"
            tag="div"
            class="function-stack"
          >
            <code
              v-for="fn in visibleFunctions"
              :key="fn.name"
              :ref="(el) => setFunctionRef(el, fn.name)"
              class="function-stack__item"
              :data-tone="fn.tone"
              :data-line-target="fn.name === 'applyForJob()' || undefined"
            >
              {{ fn.name }}
            </code>
          </TransitionGroup>
        </div>
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
      </aside>
    </div>
  </section>
</template>

<style scoped>
.direct-reveal {
  --route-gray: color-mix(
    in srgb,
    var(--deck-text-muted) 72%,
    var(--deck-surface-canvas)
  );
  --function-row-height: 1.45rem;
  --function-row-gap: 1.1rem;
  --function-row-step: calc(var(--function-row-height) + var(--function-row-gap));
  display: grid;
  grid-template-rows: 1fr;
  min-height: 100%;
  color: var(--deck-text-primary);
}

.direct-reveal__canvas {
  position: relative;
  display: grid;
  grid-template-columns: minmax(7rem, 0.65fr) minmax(18rem, 1.3fr) minmax(
      16rem,
      1fr
    );
  align-items: center;
  gap: clamp(1.4rem, 3vw, 3.1rem);
  min-height: 28rem;
  padding-top: 1.2rem;
}

.actor,
.developer,
.route-surface {
  position: relative;
  min-width: 0;
}

.actor--user {
  display: grid;
  justify-items: center;
  align-content: center;
}

.actor__figure {
  position: relative;
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

.route-surface {
  display: grid;
  place-items: center;
  height: 21rem;
}

.route-surface__svg {
  position: relative;
  z-index: 1;
  width: min(100%, 31rem);
  height: auto;
  overflow: visible;
}

.route-surface__root {
  fill: none;
  stroke: var(--route-gray);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.35;
  transform-origin: center center;
}

:global(html:not(.reduced-motion) .direct-reveal .route-surface__root) {
  transition:
    opacity 600ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 700ms cubic-bezier(0.4, 0, 0.2, 1),
    filter 600ms ease;
}

.direct-reveal[data-dismissed] .route-surface__root {
  opacity: 0;
  transform: scale(0.92);
  filter: blur(6px);
}

.direct-reveal[data-dismissed] .route-surface__root:nth-child(1) { transition-delay: 0ms; }
.direct-reveal[data-dismissed] .route-surface__root:nth-child(2) { transition-delay: 50ms; }
.direct-reveal[data-dismissed] .route-surface__root:nth-child(3) { transition-delay: 100ms; }
.direct-reveal[data-dismissed] .route-surface__root:nth-child(4) { transition-delay: 30ms; }
.direct-reveal[data-dismissed] .route-surface__root:nth-child(5) { transition-delay: 130ms; }
.direct-reveal[data-dismissed] .route-surface__root:nth-child(6) { transition-delay: 80ms; }

.direct-surface {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: visible;
  pointer-events: none;
}

.direct-surface__line {
  fill: none;
  stroke: var(--deck-warning);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4.4;
  filter: drop-shadow(
    0 0 0.45rem color-mix(in srgb, var(--deck-warning) 34%, transparent)
  );
}

.direct-start-label {
  fill: var(--deck-warning);
  font-family: var(--deck-font-mono);
  font-size: 18px;
  font-weight: 780;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.developer {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  align-self: center;
  gap: 1.05rem;
  min-height: 5.25rem;
  overflow: visible;
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

.function-stack-host {
  position: absolute;
  top: 50%;
  right: calc(4.25rem + 1.05rem);
  left: 0;
  transform: translateY(-50%);
  max-width: calc(100% - 5.3rem);
  overflow: visible;
}

.actor__figure--developer {
  position: relative;
  z-index: 1;
  grid-column: 2;
}

.function-stack {
  display: grid;
  gap: var(--function-row-gap);
  justify-items: end;
}

.function-stack__item {
  display: block;
  min-height: var(--function-row-height);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--fn-color);
  font-family: var(--deck-font-mono);
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.25;
  text-align: right;
  box-shadow: none;
}

.function-stack__item[data-tone="primary"] { --fn-color: var(--deck-primary); }
.function-stack__item[data-tone="secondary"] { --fn-color: var(--deck-secondary); }
.function-stack__item[data-tone="tertiary"] { --fn-color: var(--deck-tertiary); }
.function-stack__item[data-tone="info"] { --fn-color: var(--deck-info); }
.function-stack__item[data-tone="warning"] { --fn-color: var(--deck-warning); }

.function-stack__item[data-line-target] {
  color: var(--deck-warning);
  transition:
    color 420ms ease,
    filter 520ms ease,
    text-shadow 520ms ease;
}

.direct-reveal[data-line-complete] .function-stack__item[data-line-target] {
  filter: drop-shadow(
    0 0 0.42rem color-mix(in srgb, var(--deck-warning) 42%, transparent)
  );
  text-shadow: 0 0 0.55rem
    color-mix(in srgb, var(--deck-warning) 36%, transparent);
}

:global(html:not(.reduced-motion) .direct-reveal .function-push-move),
:global(html:not(.reduced-motion) .direct-reveal .function-push-enter-active) {
  transition: transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

:global(html:not(.reduced-motion) .direct-reveal .function-push-enter-active) {
  transition:
    transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 520ms ease;
}

:global(html:not(.reduced-motion) .direct-reveal .function-push-enter-from) {
  opacity: 0;
  transform: translateY(calc(-1 * var(--function-row-step)));
}

:global(html:not(.reduced-motion) .direct-reveal .function-push-enter-to) {
  opacity: 1;
  transform: translateY(0);
}

:global(.reduced-motion .direct-reveal *),
:global(.reduced-motion .direct-reveal *::before),
:global(.reduced-motion .direct-reveal *::after) {
  transition: none !important;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .direct-reveal *,
  .direct-reveal *::before,
  .direct-reveal *::after {
    transition: none !important;
    animation: none !important;
  }
}

@media (max-width: 820px) {
  .direct-reveal__canvas {
    grid-template-columns: 1fr;
    align-content: center;
    gap: 1.2rem;
    min-height: auto;
  }

  .actor--user { order: 1; }
  .route-surface { order: 2; height: 13rem; }
  .developer { order: 3; grid-template-columns: auto 1fr; }

  .function-stack-host {
    max-width: none;
  }

  .function-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: none;
  }
}
</style>
