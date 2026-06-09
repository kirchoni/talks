<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  click?: number;
}>();

const states = ["functions", "user", "route-map", "direct-line"] as const;

const state = computed(() => {
  const click = Math.min(props.click ?? 0, states.length - 1);
  return states[click];
});

const functions = [
  { name: "startTrial()", tone: "info" },
  { name: "purchaseSeat()", tone: "primary" },
  { name: "collectPayment()", tone: "secondary" },
  { name: "createInvoice()", tone: "tertiary" },
  { name: "inviteUser()", tone: "warning" },
  { name: "exportReport()", tone: "info" },
] as const;

const rootPaths = [
  {
    d: "M10 150 H58 V30 H142 V14 H350",
    duration: 980,
    delay: 120,
  },
  {
    d: "M10 150 H58 V76 H202 V58 H350",
    duration: 840,
    delay: 250,
  },
  {
    d: "M10 150 H58 V122 H142 V76 H202 V122 H350",
    duration: 1180,
    delay: 360,
  },
  {
    d: "M10 150 H142 V166 H350",
    duration: 720,
    delay: 200,
  },
  {
    d: "M10 150 H58 V224 H142 V166 H202 V224 H350",
    duration: 1260,
    delay: 480,
  },
  {
    d: "M10 150 H58 V270 H202 V276 H350",
    duration: 940,
    delay: 600,
  },
] as const;

const routePathEls = ref<SVGPathElement[]>([]);
const canvasEl = ref<HTMLElement | null>(null);
const userFigureEl = ref<HTMLElement | null>(null);
const purchaseFunctionEl = ref<HTMLElement | null>(null);
const directPathEl = ref<SVGPathElement | null>(null);
const directPath = ref("");
const directViewBox = ref("0 0 1000 430");
let drawFrames: number[] = [];
let drawTimers: number[] = [];
let directDrawFrame = 0;

const isReducedMotion = () => {
  if (typeof window === "undefined") return true;
  return (
    document.documentElement.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

const setRoutePathRef = (el: Element | null, index: number) => {
  if (el instanceof SVGPathElement) {
    routePathEls.value[index] = el;
  }
};

const setFunctionRef = (el: Element | null, name: string) => {
  if (name === "purchaseSeat()" && el instanceof HTMLElement) {
    purchaseFunctionEl.value = el;
  }
};

const clearRouteDraw = () => {
  drawFrames.forEach((frame) => window.cancelAnimationFrame(frame));
  drawFrames = [];
  drawTimers.forEach((timer) => window.clearTimeout(timer));
  drawTimers = [];
};

const clearDirectDraw = () => {
  window.cancelAnimationFrame(directDrawFrame);
  directDrawFrame = 0;
};

const setRouteProgress = (progress: number) => {
  routePathEls.value.forEach((path) => {
    const length = path.getTotalLength();
    const offset = -length * (1 - progress);
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${offset}`;
  });
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
  const target = purchaseFunctionEl.value;
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
};

const drawRoutePaths = () => {
  if (typeof window === "undefined") return;

  clearRouteDraw();

  if (isReducedMotion()) {
    setRouteProgress(1);
    return;
  }

  setRouteProgress(0);

  routePathEls.value.forEach((path, index) => {
    const route = rootPaths[index];
    const length = path.getTotalLength();

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${-length}`;

    const timer = window.setTimeout(() => {
      const startedAt = window.performance.now();

      const draw = (now: number) => {
        const elapsed = now - startedAt;
        const progress = Math.min(elapsed / route.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        path.style.strokeDashoffset = `${-length * (1 - eased)}`;

        if (progress < 1) {
          drawFrames.push(window.requestAnimationFrame(draw));
        }
      };

      drawFrames.push(window.requestAnimationFrame(draw));
    }, route.delay);

    drawTimers.push(timer);
  });
};

const drawDirectLine = () => {
  if (typeof window === "undefined") return;

  clearDirectDraw();
  updateDirectPath();

  if (isReducedMotion()) {
    setDirectProgress(1);
    return;
  }

  const path = directPathEl.value;
  if (!path) return;

  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;

  const startedAt = window.performance.now();
  const duration = 980;

  const draw = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    path.style.strokeDashoffset = `${length * (1 - eased)}`;

    if (progress < 1) {
      directDrawFrame = window.requestAnimationFrame(draw);
    }
  };

  directDrawFrame = window.requestAnimationFrame(draw);
};

watch(
  state,
  async (current) => {
    if (typeof window === "undefined") return;
    await nextTick();

    if (current === "route-map") {
      updateDirectPath();
      clearDirectDraw();
      setDirectProgress(isReducedMotion() ? 1 : 0);
      drawRoutePaths();
    } else if (current === "direct-line") {
      clearRouteDraw();
      setRouteProgress(1);
      updateDirectPath();
      drawDirectLine();
    } else {
      clearRouteDraw();
      clearDirectDraw();
      setRouteProgress(isReducedMotion() ? 1 : 0);
      setDirectProgress(isReducedMotion() ? 1 : 0);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearRouteDraw();
  clearDirectDraw();
});
</script>

<template>
  <section class="static-conclusion" :data-state="state">
    <div ref="canvasEl" class="static-conclusion__canvas">
      <aside class="actor actor--user" aria-label="User">
        <span ref="userFigureEl" class="actor__figure">
          <span class="actor__head" />
          <span class="actor__body" />
        </span>
      </aside>

      <div class="route-surface" aria-label="Prebuilt route map">
        <svg
          class="route-surface__path"
          viewBox="0 0 360 300"
          role="img"
          aria-label="Prebuilt navigation path"
        >
          <path
            v-for="(path, index) in rootPaths"
            :key="path.d"
            :ref="(el) => setRoutePathRef(el, index)"
            class="route-surface__root"
            :d="path.d"
          />
        </svg>
      </div>

      <svg
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
      </svg>

      <aside class="developer" aria-label="Developer-owned functionality">
        <div class="function-stack" aria-label="Product functions">
          <code
            v-for="fn in functions"
            :key="fn.name"
            :ref="(el) => setFunctionRef(el, fn.name)"
            class="function-stack__item"
            :data-tone="fn.tone"
          >
            {{ fn.name }}
          </code>
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
.static-conclusion {
  --route-gray: color-mix(
    in srgb,
    var(--deck-text-muted) 72%,
    var(--deck-surface-canvas)
  );
  --route-gray-soft: color-mix(
    in srgb,
    var(--deck-text-muted) 17%,
    transparent
  );
  display: grid;
  grid-template-rows: 1fr;
  min-height: 100%;
  color: var(--deck-text-primary);
}

.static-conclusion__canvas {
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
  opacity: 0;
  transform: translateX(-1rem);
}

.static-conclusion[data-state="user"] .actor--user,
.static-conclusion[data-state="route-map"] .actor--user,
.static-conclusion[data-state="direct-line"] .actor--user {
  opacity: 1;
  transform: translateX(0);
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
  opacity: 0;
  transform: translateX(-0.35rem);
}

.static-conclusion[data-state="route-map"] .route-surface,
.static-conclusion[data-state="direct-line"] .route-surface {
  opacity: 1;
  transform: translateX(0);
}

.route-surface__path {
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
  stroke-width: 2.8;
  stroke-dashoffset: 0;
}

.route-surface__root:nth-child(-n + 6) {
  stroke-width: 3.35;
}

.direct-surface {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: visible;
  pointer-events: none;
  opacity: 0;
}

.static-conclusion[data-state="direct-line"] .direct-surface {
  opacity: 1;
}

.direct-surface__line {
  fill: none;
  stroke: var(--deck-primary);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4.4;
  filter: drop-shadow(
    0 0 0.45rem color-mix(in srgb, var(--deck-primary) 34%, transparent)
  );
}

.developer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1.05rem;
}

.actor__figure--developer {
  margin-top: 0;
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

.function-stack {
  display: grid;
  gap: 1.8rem;
  max-width: 18.5rem;
  justify-items: end;
}

.function-stack__item {
  display: block;
  min-height: 1.55rem;
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

.function-stack__item[data-tone="primary"] {
  --fn-color: var(--deck-primary);
}

.function-stack__item[data-tone="secondary"] {
  --fn-color: var(--deck-secondary);
}

.function-stack__item[data-tone="tertiary"] {
  --fn-color: var(--deck-tertiary);
}

.function-stack__item[data-tone="info"] {
  --fn-color: var(--deck-info);
}

.function-stack__item[data-tone="warning"] {
  --fn-color: var(--deck-warning);
}

:global(html:not(.reduced-motion) .static-conclusion .actor--user) {
  transition:
    opacity 420ms ease,
    transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

:global(html:not(.reduced-motion) .static-conclusion .direct-surface) {
  transition: opacity 160ms ease;
}

:global(html:not(.reduced-motion) .static-conclusion .route-surface__root) {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

:global(.reduced-motion .static-conclusion *),
:global(.reduced-motion .static-conclusion *::before),
:global(.reduced-motion .static-conclusion *::after) {
  transition: none !important;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .static-conclusion *,
  .static-conclusion *::before,
  .static-conclusion *::after {
    transition: none !important;
    animation: none !important;
  }

  .route-surface__root {
    stroke-dashoffset: 0 !important;
  }

  .direct-surface__line {
    stroke-dashoffset: 0 !important;
  }
}

@media (max-width: 820px) {
  .static-conclusion__canvas {
    grid-template-columns: 1fr;
    align-content: center;
    gap: 1.2rem;
    min-height: auto;
  }

  .actor--user {
    order: 1;
  }

  .route-surface {
    order: 2;
    height: 13rem;
  }

  .developer {
    order: 3;
    grid-template-columns: auto 1fr;
  }

  .function-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: none;
  }
}
</style>
