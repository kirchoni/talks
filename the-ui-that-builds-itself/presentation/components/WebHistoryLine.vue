<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const WORLD_SCALE = 3;
const OVERVIEW_SCALE = 1 / WORLD_SCALE;
const TRACK_LEFT_PCT = 4.5;
const TRACK_RIGHT_PCT = 4.5;
const TRACK_SPAN_PCT = 100 - TRACK_LEFT_PCT - TRACK_RIGHT_PCT;
const BROWSER_MARKER_INSET_PCT = 1.5;
const BROWSER_WIDTH_REM = 29.25;
const BROWSER_HEIGHT_REM = 3.54 + 17.55;
const BROWSER_BOTTOM_PCT = 33;
const VIEWPORT_CENTER_IN_WORLD_PCT = 50 / WORLD_SCALE;

type MarkerId = "beginning" | "runtime" | "next";
type BrowserId = MarkerId;
type CameraTarget = "overview" | BrowserId;

type Phase = {
  id: string;
  camera: CameraTarget;
  activeMarker: MarkerId;
  visibleMarkers: MarkerId[];
  visibleBrowsers: BrowserId[];
  flippedBrowsers?: BrowserId[];
  sourceBrowsers?: BrowserId[];
  timelineIntro?: boolean;
};

const phases: Phase[] = [
  {
    id: "line",
    camera: "overview",
    activeMarker: "beginning",
    visibleMarkers: ["beginning"],
    visibleBrowsers: [],
    timelineIntro: true,
  },
  {
    id: "origin",
    camera: "overview",
    activeMarker: "beginning",
    visibleMarkers: ["beginning"],
    visibleBrowsers: ["beginning"],
    timelineIntro: true,
  },
  {
    id: "zoom",
    camera: "beginning",
    activeMarker: "beginning",
    visibleMarkers: ["beginning", "runtime"],
    visibleBrowsers: ["beginning"],
  },
  {
    id: "source",
    camera: "beginning",
    activeMarker: "beginning",
    visibleMarkers: ["beginning", "runtime"],
    visibleBrowsers: ["beginning"],
    flippedBrowsers: ["beginning"],
    sourceBrowsers: ["beginning"],
  },
  {
    id: "today",
    camera: "runtime",
    activeMarker: "runtime",
    visibleMarkers: ["beginning", "runtime"],
    visibleBrowsers: ["beginning", "runtime"],
    flippedBrowsers: ["beginning"],
    sourceBrowsers: ["beginning"],
  },
  {
    id: "today-source",
    camera: "runtime",
    activeMarker: "runtime",
    visibleMarkers: ["beginning", "runtime"],
    visibleBrowsers: ["beginning", "runtime"],
    flippedBrowsers: ["beginning", "runtime"],
    sourceBrowsers: ["beginning", "runtime"],
  },
  {
    id: "future",
    camera: "overview",
    activeMarker: "next",
    visibleMarkers: ["beginning", "runtime", "next"],
    visibleBrowsers: ["beginning", "runtime", "next"],
  },
];

const phase = computed(
  () => phases[Math.max(0, Math.min(props.click ?? 0, phases.length - 1))],
);

const markerWorldPct = (trackPct: number) =>
  TRACK_LEFT_PCT + (trackPct / 100) * TRACK_SPAN_PCT;

const markers = [
  { id: "beginning", pct: 3, solid: true, color: null },
  { id: "runtime", pct: 42, solid: true, color: "rgb(36 136 117)" },
  { id: "next", pct: 83.7, solid: true, color: "var(--history-future-dot)" },
] as const;

const futureMarker = markers.find((marker) => marker.id === "next")!;
const futureTrackStyle: Record<string, string> = {
  "--future-track-left": `${futureMarker.pct}%`,
  "--future-track-fill-scale": (100 / futureMarker.pct).toFixed(5),
  "--future-track-dash-scale": (100 / (100 - futureMarker.pct)).toFixed(5),
};

const browserPositions = Object.fromEntries(
  markers.map((marker) => [
    marker.id,
    markerWorldPct(marker.pct) - BROWSER_MARKER_INSET_PCT,
  ]),
) as Record<BrowserId, number>;

const cameraFor = (target: CameraTarget) => {
  if (target === "overview") {
    return {
      scale: OVERVIEW_SCALE.toFixed(6),
      x: "0%",
      y: "0%",
    };
  }

  const browserLeft = browserPositions[target];
  const browserBottom = 100 - BROWSER_BOTTOM_PCT;

  return {
    scale: "1",
    x: `calc(${VIEWPORT_CENTER_IN_WORLD_PCT - browserLeft}% - ${
      BROWSER_WIDTH_REM / 2
    }rem)`,
    y: `calc(${VIEWPORT_CENTER_IN_WORLD_PCT - browserBottom}% + ${
      BROWSER_HEIGHT_REM / 2
    }rem)`,
  };
};

const cameraStyle = computed<Record<string, string>>(() => {
  const camera = cameraFor(phase.value.camera);

  return {
    "--history-world-scale": camera.scale,
    "--history-camera-x": camera.x,
    "--history-camera-y": camera.y,
  };
});

const has = <T extends string>(items: readonly T[] | undefined, item: T) =>
  items?.includes(item) ?? false;

const markerClasses = (id: MarkerId) => ({
  "history-line__marker--active": phase.value.activeMarker === id,
  "history-line__marker--visible": has(phase.value.visibleMarkers, id),
  "history-line__marker--future": id === "next",
});

const browserClasses = (id: BrowserId) => ({
  "history-line__browser--visible": has(phase.value.visibleBrowsers, id),
  "history-line__browser--flipped": has(phase.value.flippedBrowsers, id),
  "history-line__browser--source-visible": has(phase.value.sourceBrowsers, id),
});

const browserStyle = (id: BrowserId) => ({
  "--browser-left": `${browserPositions[id]}%`,
});
</script>

<template>
  <div
    class="history-line"
    :class="{
      'history-line--timeline-intro': phase.timelineIntro,
      'history-line--timeline-visible': phase.visibleMarkers.length > 0,
    }"
    :data-state="phase.id"
    :style="cameraStyle"
  >
    <h2 class="history-line__title">The future of User Interface</h2>
    <div class="history-line__world">
      <div
        class="history-line__track"
        aria-hidden="true"
        :style="futureTrackStyle"
      >
        <span class="history-line__track-fill" />
        <span class="history-line__track-future" />
        <span
          v-for="(marker, index) in markers"
          :key="marker.id"
          class="history-line__marker"
          :class="{
            'history-line__marker--solid': marker.solid,
            ...markerClasses(marker.id),
          }"
          :style="{
            '--marker-left': `${marker.pct}%`,
            '--marker-delay': `${190 + index * 110}ms`,
            '--marker-color': marker.color,
          }"
        />
      </div>

      <figure
        class="history-line__browser"
        :class="browserClasses('beginning')"
        aria-label="The first web page"
        :style="browserStyle('beginning')"
      >
        <div class="history-line__browser-card">
          <div
            class="history-line__browser-face history-line__browser-face--front"
          >
            <div class="history-line__chrome">
              <span />
              <span />
              <span />
            </div>
            <div class="history-line__page retro-page">
              <span class="retro-page__heading" />
              <hr class="retro-page__rule" />
              <span class="retro-page__line" />
              <span class="retro-page__line retro-page__line--long" />
              <span class="retro-page__line retro-page__line--tinted" />
              <span
                class="retro-page__line retro-page__line--tinted retro-page__line--short"
              />
              <span
                class="retro-page__line retro-page__line--tinted retro-page__line--long"
              />
              <span class="retro-page__line" />
              <span class="retro-page__line retro-page__line--short" />
            </div>
          </div>

          <div
            class="history-line__browser-face history-line__browser-face--back"
            aria-hidden="true"
          >
            <div class="history-line__source">
              <span
                class="history-line__source-line history-line__source-line--root"
                style="--source-line-i: 0"
              >
                &lt;html&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--body"
                style="--source-line-i: 1"
              >
                &lt;body&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--h1"
                style="--source-line-i: 2"
              >
                &lt;h1&gt;Welcome&lt;/h1&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--main"
                style="--source-line-i: 3"
              >
                &lt;main&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--copy"
                style="--source-line-i: 4"
              >
                &lt;p&gt;Same page for everyone&lt;/p&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--main"
                style="--source-line-i: 5"
              >
                &lt;/main&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--body"
                style="--source-line-i: 6"
              >
                &lt;/body&gt;
              </span>
              <span
                class="history-line__source-line history-line__source-line--root"
                style="--source-line-i: 7"
              >
                &lt;/html&gt;
              </span>
            </div>
          </div>
        </div>
      </figure>

      <figure
        class="history-line__browser history-line__browser--modern"
        :class="browserClasses('runtime')"
        aria-label="A modern web application"
        :style="browserStyle('runtime')"
      >
        <div class="history-line__browser-card">
          <div
            class="history-line__browser-face history-line__browser-face--front"
          >
            <div class="history-line__chrome"><span /><span /><span /></div>
            <div class="modern-app">
              <header class="modern-app__header">
                <span class="modern-app__logo" />
                <nav class="modern-app__nav">
                  <span /><span /><span /><span />
                </nav>
                <span class="modern-app__username" />
                <span class="modern-app__avatar" />
              </header>
              <div class="modern-app__body">
                <aside class="modern-app__sidebar">
                  <span class="modern-app__sidebar-title" />
                  <span /><span
                    class="modern-app__sidebar-active"
                  /><span /><span /><span />
                </aside>
                <main class="modern-app__content">
                  <div class="modern-app__content-header">
                    <span class="modern-app__content-title" />
                    <span class="modern-app__combo" />
                  </div>
                  <span /><span /><span />
                  <div class="modern-app__card-row">
                    <span class="modern-app__card" />
                    <span class="modern-app__card" />
                    <span class="modern-app__card" />
                  </div>
                  <span /><span />
                </main>
              </div>
              <footer class="modern-app__footer">
                <span /><span /><span />
              </footer>
            </div>
          </div>

          <div
            class="history-line__browser-face history-line__browser-face--back"
            aria-hidden="true"
          >
            <div class="history-line__source history-line__source--jsx">
              <span
                class="history-line__source-line history-line__source-line--jsx-tag"
                style="--source-line-i: 0"
                >&lt;App&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent1"
                style="--source-line-i: 1"
                >&lt;Header&gt;<i class="jsx-dynamic">{user}</i
                >&lt;/Header&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent1"
                style="--source-line-i: 2"
                >&lt;Content&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent2"
                style="--source-line-i: 3"
                >&lt;Sidenav&gt;<i class="jsx-dynamic">{&hellip;items}</i
                >&lt;/Sidenav&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent2"
                style="--source-line-i: 4"
                >{<i class="jsx-dynamic">data</i>.map((action) =&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent3"
                style="--source-line-i: 5"
                >&lt;Card&gt;<i class="jsx-dynamic">{action}</i
                >&lt;/Card&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent2"
                style="--source-line-i: 6"
                >)}</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-indent1"
                style="--source-line-i: 7"
                >&lt;/Content&gt;</span
              >
              <span
                class="history-line__source-line history-line__source-line--jsx-tag"
                style="--source-line-i: 8"
                >&lt;/App&gt;</span
              >
            </div>
          </div>
        </div>
      </figure>

      <figure
        class="history-line__browser history-line__browser--future"
        :class="browserClasses('next')"
        aria-label="The future of the web"
        :style="browserStyle('next')"
      >
        <div class="history-line__browser-card">
          <div
            class="history-line__browser-face history-line__browser-face--front"
          >
            <div class="history-line__chrome"><span /><span /><span /></div>
            <div class="future-page">
              <span class="future-page__surface">
                <span class="future-page__current">
                  <span />
                  <span />
                  <span />
                </span>
                <span class="future-page__piece future-page__piece--header" />
                <span class="future-page__piece future-page__piece--nav" />
                <span class="future-page__piece future-page__piece--main" />
                <span class="future-page__piece future-page__piece--rail" />
                <span class="future-page__piece future-page__piece--footer" />
              </span>
            </div>
          </div>
        </div>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.history-line {
  --history-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --history-line: color-mix(in srgb, var(--deck-text-primary) 18%, transparent);
  --history-line-strong: color-mix(
    in srgb,
    var(--deck-primary) 70%,
    transparent
  );
  --history-future-accent: rgb(168 85 247);
  --history-future-dot: var(--deck-tertiary);
  --history-future-bridge: color-mix(
    in srgb,
    var(--history-future-accent) 34%,
    var(--deck-primary)
  );
  --history-track-main-gradient: linear-gradient(
    90deg,
    color-mix(in srgb, var(--deck-text-primary) 5%, transparent),
    color-mix(in srgb, var(--deck-primary) 10%, transparent) 20%,
    var(--history-line-strong) 72%,
    color-mix(in srgb, var(--deck-primary) 52%, var(--history-line-strong)) 100%
  );
  --history-track-gradient: linear-gradient(
    90deg,
    color-mix(in srgb, var(--deck-text-primary) 5%, transparent),
    color-mix(in srgb, var(--deck-primary) 10%, transparent) 20%,
    var(--history-line-strong) 60%,
    color-mix(
        in srgb,
        var(--history-future-bridge) 46%,
        var(--history-line-strong)
      )
      72%,
    color-mix(
        in srgb,
        var(--history-future-bridge) 86%,
        var(--history-line-strong)
      )
      83.7%,
    color-mix(
        in srgb,
        var(--history-future-accent) 66%,
        var(--history-future-bridge)
      )
      100%
  );
  --history-panel: color-mix(
    in srgb,
    var(--deck-surface-paper) 88%,
    transparent
  );
  --history-panel-soft: color-mix(
    in srgb,
    var(--deck-surface-panel) 64%,
    transparent
  );
  --history-border: color-mix(
    in srgb,
    var(--deck-text-primary) 12%,
    transparent
  );
  --history-ink-soft: color-mix(
    in srgb,
    var(--deck-text-primary) 10%,
    transparent
  );

  position: relative;
  height: 100%;
  min-height: 30rem;
  overflow: hidden;
  isolation: isolate;
}

.history-line__title {
  font-family: var(--slidev-code-font-family, "Geist Mono", monospace);
  position: absolute;
  top: 3.2rem;
  left: 3.8rem;
  z-index: 2;
  margin: 0;
  background: linear-gradient(
    92deg,
    var(--deck-primary),
    var(--history-future-dot) 46%,
    var(--history-future-accent)
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: var(--deck-primary);
  font-size: 2.35rem;
  font-weight: 760;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  letter-spacing: 0;
  opacity: 0;
  transform: translateY(-0.8rem);
  transition:
    opacity 560ms var(--history-ease) 180ms,
    transform 680ms var(--history-ease) 180ms;
  white-space: nowrap;
}

.history-line[data-state="future"] .history-line__title {
  opacity: 1;
  transform: translateY(0);
}

.history-line__world {
  position: absolute;
  top: 0;
  left: 0;
  width: 300%;
  height: 300%;
  transform: translate(var(--history-camera-x, 0%), var(--history-camera-y, 0%))
    scale(var(--history-world-scale, 0.333333));
  transform-origin: 0 0;
  transition: transform 860ms cubic-bezier(0.18, 0.86, 0.2, 1);
}

.history-line__track {
  position: absolute;
  left: 4.5%;
  right: 4.5%;
  top: 71%;
  height: 6px;
  border-radius: 999px;
  background: transparent;
  transform: translateY(-50%);
  transition:
    opacity 520ms var(--history-ease),
    transform 620ms var(--history-ease);
}

.history-line__track::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--history-line);
  content: "";
  transition: right 560ms var(--history-ease);
}

.history-line[data-state="future"] .history-line__track::before {
  right: calc(100% - var(--future-track-left));
}

.history-line__track-fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--history-track-main-gradient);
  background-position: left center;
  background-size: 100% 100%;
  transform: scaleX(0);
  transform-origin: left center;
  transition:
    right 560ms var(--history-ease),
    background-size 560ms var(--history-ease),
    transform 1000ms var(--history-ease);
  z-index: 1;
}

.history-line[data-state="future"] .history-line__track-fill {
  right: calc(100% - var(--future-track-left));
  background: var(--history-track-gradient);
  background-size: calc(100% * var(--future-track-fill-scale)) 100%;
}

.history-line__track-future {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: var(--future-track-left);
  border-radius: inherit;
  background: var(--history-track-gradient);
  background-position: right center;
  background-size: calc(100% * var(--future-track-dash-scale)) 100%;
  -webkit-mask-image:
    linear-gradient(90deg, rgb(0 0 0 / 0.84), black 22%),
    repeating-linear-gradient(90deg, black 0 0.9rem, transparent 0.9rem 1.45rem);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  mask-image:
    linear-gradient(90deg, rgb(0 0 0 / 0.84), black 22%),
    repeating-linear-gradient(90deg, black 0 0.9rem, transparent 0.9rem 1.45rem);
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left center;
  transition:
    opacity 560ms var(--history-ease),
    transform 900ms var(--history-ease);
  z-index: 1;
}

.history-line__marker {
  position: absolute;
  z-index: 2;
  left: var(--marker-left);
  top: 50%;
  width: 1.32rem;
  aspect-ratio: 1;
  border: 0.16rem solid
    color-mix(in srgb, var(--deck-text-primary) 28%, transparent);
  border-radius: 999px;
  background: var(--deck-surface-canvas);
  box-shadow: 0 0 0 0.42rem var(--deck-surface-canvas);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78);
  transition:
    opacity 420ms var(--history-ease),
    transform 520ms var(--history-ease),
    border-color 420ms var(--history-ease);
  transition-delay: var(--marker-delay);
}

.history-line__marker--active {
  border-color: var(
    --marker-color,
    color-mix(in srgb, var(--deck-text-primary) 44%, transparent)
  );
}

.history-line__marker--solid:not(.history-line__marker--active) {
  border-color: var(
    --marker-color,
    color-mix(in srgb, var(--deck-text-primary) 36%, transparent)
  );
}

.history-line__marker--visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.history-line__marker--future {
  border-style: dashed;
}

.history-line[data-state="future"] .history-line__track-future {
  opacity: 1;
  transform: scaleX(1.01) scaleY(1.3);
}

.history-line[data-state="future"] .history-line__marker--future {
  border-color: var(--marker-color);
  border-style: dashed;
  background: var(--deck-surface-canvas);
}

.history-line__browser {
  position: absolute;
  left: var(--browser-left, 3%);
  bottom: 33%;
  width: min(29.25rem, 46.5%);
  margin: 0;
  perspective: 126rem;
  opacity: 0;
  transform: translateY(3.15rem) scaleY(0.78);
  transform-origin: 0% 100%;
  transition:
    opacity 520ms var(--history-ease),
    transform 760ms cubic-bezier(0.18, 0.86, 0.2, 1);
}

.history-line__browser-card {
  position: relative;
  width: 100%;
  border-radius: 2.16rem;
  transform-style: preserve-3d;
  transition:
    transform 820ms cubic-bezier(0.18, 0.86, 0.2, 1),
    box-shadow 760ms var(--history-ease);
}

.history-line__browser-face {
  overflow: hidden;
  border: 0.1875rem solid var(--history-border);
  border-radius: inherit;
  background: var(--history-panel);
  backface-visibility: hidden;
  box-shadow: 0 3.6rem 9rem rgb(0 0 0 / 0.12);
}

.history-line__browser-face--front {
  position: relative;
}

.history-line__browser-face--back {
  position: absolute;
  inset: 0;
  display: grid;
  transform: rotateY(180deg);
}

.history-line__chrome {
  display: flex;
  align-items: center;
  gap: 0.72rem;
  height: 3.54rem;
  padding: 0 1.44rem;
  border-bottom: 0.1875rem solid var(--history-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 48%, transparent);
}

.history-line__chrome span {
  width: 0.78rem;
  aspect-ratio: 1;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 18%, transparent);
}

.retro-page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.08rem;
  min-height: 17.55rem;
  padding: 1.8rem 2.1rem;
}

.retro-page__heading {
  width: 48%;
  height: 1.02rem;
  border-radius: 0.12rem;
  background: color-mix(in srgb, var(--deck-text-primary) 20%, transparent);
}

.retro-page__rule {
  width: 100%;
  height: 0.125rem;
  border: none;
  margin: 0;
  background: color-mix(in srgb, var(--deck-text-primary) 12%, transparent);
}

.retro-page__line {
  width: 84%;
  height: 0.54rem;
  border-radius: 0.12rem;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
}

.retro-page__line--long {
  width: 94%;
}

.retro-page__line--short {
  width: 62%;
}

.retro-page__line--tinted {
  background: color-mix(in srgb, var(--deck-cool) 40%, transparent);
}

.history-line__source {
  display: grid;
  align-content: center;
  gap: 0.66rem;
  min-height: 100%;
  padding: 1.56rem 1.86rem;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--deck-surface-paper) 92%, transparent);
  font-family: var(--slidev-code-font-family, "Geist Mono", monospace);
  font-size: 0.96rem;
  line-height: 1.15;
  color: color-mix(in srgb, var(--deck-text-primary) 58%, transparent);
}

.history-line__source-line {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
  opacity: 0;
  transform: translateY(0.36rem);
  transition:
    opacity 260ms var(--history-ease),
    transform 360ms var(--history-ease);
  transition-delay: calc(380ms + var(--source-line-i, 0) * 44ms);
}

.history-line__source-line--root {
  color: color-mix(in srgb, var(--deck-text-primary) 78%, transparent);
}

.history-line__source-line--body {
  padding-left: 1.26rem;
}

.history-line__source-line--h1,
.history-line__source-line--main {
  padding-left: 2.52rem;
}

.history-line__source-line--copy {
  padding-left: 3.78rem;
  color: color-mix(in srgb, var(--deck-cool) 72%, var(--deck-text-primary));
}

.history-line--timeline-visible .history-line__track-fill {
  transform: scaleX(1);
}

.history-line--timeline-intro .history-line__track-fill {
  animation: history-line-draw 1000ms var(--history-ease) both;
}

.history-line--timeline-intro .history-line__marker--visible {
  animation: history-marker-rise 460ms var(--history-ease) both;
  animation-delay: var(--marker-delay);
}

.history-line__browser--visible {
  opacity: 1;
  transform: translateY(0) scaleY(1);
}

.history-line__browser--flipped .history-line__browser-card {
  transform: rotateY(180deg);
}

.history-line__browser--source-visible .history-line__source-line {
  opacity: 1;
  transform: translateY(0);
}

/* ── Modern app wireframe ── */

.modern-app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 17.55rem;
}

.modern-app__header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.66rem 1.2rem;
  border-bottom: 0.1875rem solid var(--history-border);
  background: color-mix(in srgb, var(--deck-surface-raised) 80%, transparent);
}

.modern-app__logo {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.36rem;
  background: color-mix(in srgb, var(--deck-text-primary) 22%, transparent);
  flex-shrink: 0;
}

.modern-app__nav {
  display: flex;
  gap: 0.72rem;
}

.modern-app__nav span {
  width: 2.7rem;
  height: 0.54rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 18%, transparent);
}

.modern-app__nav span:first-child {
  background: color-mix(in srgb, var(--deck-primary) 50%, transparent);
}

.modern-app__username {
  width: 2.4rem;
  height: 0.48rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-primary) 40%, transparent);
  flex-shrink: 0;
  margin-left: auto;
}

.modern-app__avatar {
  width: 1.32rem;
  height: 1.32rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-primary) 48%, transparent);
  border: 0.125rem solid
    color-mix(in srgb, var(--deck-primary) 30%, transparent);
  flex-shrink: 0;
}

.modern-app__body {
  display: grid;
  grid-template-columns: 6.6rem 1fr;
  min-height: 0;
}

.modern-app__sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.54rem;
  padding: 0.9rem 0.78rem;
  border-right: 0.1875rem solid var(--history-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 40%, transparent);
}

.modern-app__sidebar-title {
  width: 72%;
  height: 0.54rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 22%, transparent);
  margin-bottom: 0.24rem;
}

.modern-app__sidebar
  span:not(.modern-app__sidebar-title):not(.modern-app__sidebar-active) {
  width: 84%;
  height: 0.42rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
}

.modern-app__sidebar-active {
  width: 90%;
  height: 0.42rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-primary) 54%, transparent);
}

.modern-app__content {
  display: flex;
  flex-direction: column;
  gap: 0.66rem;
  padding: 1.08rem 1.2rem;
}

.modern-app__content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modern-app__content-title {
  width: 46%;
  height: 0.84rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 26%, transparent);
}

.modern-app__content > span:not(.modern-app__content-title) {
  height: 0.42rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 9%, transparent);
}

.modern-app__content > span:nth-child(2) {
  width: 92%;
}
.modern-app__content > span:nth-child(3) {
  width: 78%;
}
.modern-app__content > span:nth-child(4) {
  width: 85%;
}
.modern-app__content > span:nth-child(6) {
  width: 88%;
}
.modern-app__content > span:nth-child(7) {
  width: 64%;
}

.modern-app__combo {
  width: 4.2rem;
  height: 1.14rem;
  border-radius: 0.3rem;
  border: 0.125rem solid
    color-mix(in srgb, var(--deck-primary) 32%, transparent);
  background: color-mix(in srgb, var(--deck-primary) 6%, transparent);
  flex-shrink: 0;
}

.modern-app__card-row {
  display: flex;
  gap: 0.6rem;
  margin-block: 0.24rem;
}

.modern-app__card {
  flex: 1;
  height: 2.7rem;
  border-radius: 0.48rem;
  border: 0.1875rem solid var(--history-border);
  background: color-mix(in srgb, var(--deck-surface-raised) 72%, transparent);
}

.modern-app__card:first-child {
  border-color: color-mix(in srgb, var(--deck-primary) 26%, transparent);
  background: color-mix(
    in srgb,
    var(--deck-primary) 6%,
    var(--deck-surface-raised)
  );
}

.modern-app__footer {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.48rem 1.2rem;
  border-top: 0.1875rem solid var(--history-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 30%, transparent);
}

.modern-app__footer span {
  height: 0.36rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
}

.modern-app__footer span:nth-child(1) {
  width: 3.6rem;
}
.modern-app__footer span:nth-child(2) {
  width: 4.2rem;
}
.modern-app__footer span:nth-child(3) {
  width: 2.7rem;
  margin-left: auto;
}

/* ── Future browser ── */

.future-page {
  --future-page-intro-delay: 5s;
  --future-page-piece-duration: 8.8s;

  position: relative;
  display: block;
  min-height: 17.55rem;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 68% 22%,
      color-mix(in srgb, var(--history-future-accent) 11%, transparent),
      transparent 34%
    ),
    color-mix(in srgb, var(--deck-surface-paper) 64%, transparent);
}

.future-page__surface {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  isolation: isolate;
}

.future-page__current {
  position: absolute;
  inset: 13% 12%;
  display: block;
  border-radius: 0.9rem;
  opacity: 0.5;
}

.future-page__current span {
  position: absolute;
  display: block;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--deck-primary) 42%, transparent),
    transparent
  );
  opacity: 0.62;
}

.future-page__current span:nth-child(1) {
  left: 6%;
  right: 20%;
  top: 25%;
  transform: rotate(-14deg);
}

.future-page__current span:nth-child(2) {
  left: 18%;
  right: 8%;
  top: 50%;
  transform: rotate(-14deg);
}

.future-page__current span:nth-child(3) {
  left: 28%;
  right: 24%;
  top: 74%;
  transform: rotate(-14deg);
}

.future-page__piece {
  position: absolute;
  left: 22%;
  top: 20%;
  display: block;
  overflow: hidden;
  width: 56%;
  height: 58%;
  border: 0.1rem solid
    color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  border-radius: 0.92rem;
  background: color-mix(in srgb, var(--deck-primary) 5%, transparent);
  box-shadow: 0 0.72rem 1.8rem rgb(0 0 0 / 0.08);
  opacity: 0;
  animation-delay: var(--future-page-intro-delay);
  animation-duration: var(--future-page-piece-duration);
  animation-fill-mode: both;
  animation-iteration-count: infinite;
  animation-name: none;
  animation-timing-function: var(--history-ease);
}

.future-page__piece::before {
  position: absolute;
  inset: -58% -126%;
  content: "";
  background: linear-gradient(
    128deg,
    color-mix(in srgb, var(--deck-primary) 12%, transparent),
    color-mix(in srgb, var(--history-future-accent) 24%, transparent),
    color-mix(in srgb, var(--deck-primary) 18%, transparent)
  );
  opacity: 0.86;
  animation: future-page-scan 5.2s ease-in-out infinite alternate;
  animation-delay: var(--future-page-intro-delay);
  animation-fill-mode: both;
  animation-play-state: paused;
}

.future-page__piece--main {
  opacity: 0.94;
  background: color-mix(in srgb, var(--deck-primary) 7%, transparent);
}

.history-line[data-state="future"] .future-page__piece::before {
  animation-play-state: running;
}

.history-line[data-state="future"] .future-page__piece--header {
  animation-name: future-page-header;
}

.history-line[data-state="future"] .future-page__piece--nav {
  animation-name: future-page-nav;
}

.history-line[data-state="future"] .future-page__piece--main {
  animation-name: future-page-main;
}

.history-line[data-state="future"] .future-page__piece--rail {
  animation-name: future-page-rail;
}

.history-line[data-state="future"] .future-page__piece--footer {
  animation-name: future-page-footer;
}

@keyframes future-page-scan {
  from {
    transform: translateX(-20%);
  }

  to {
    transform: translateX(20%);
  }
}

@keyframes future-page-header {
  0%,
  16%,
  100% {
    left: 22%;
    top: 20%;
    width: 56%;
    height: 58%;
    border-radius: 0.92rem;
    opacity: 0;
  }

  32%,
  48% {
    left: 8%;
    top: 10%;
    width: 84%;
    height: 20%;
    border-radius: 0.7rem;
    opacity: 0.95;
  }

  64%,
  82% {
    left: 8%;
    top: 5%;
    width: 60%;
    height: 17%;
    border-radius: 0.62rem;
    opacity: 0.94;
  }
}

@keyframes future-page-nav {
  0%,
  16%,
  100% {
    left: 22%;
    top: 20%;
    width: 56%;
    height: 58%;
    border-radius: 0.92rem;
    opacity: 0;
  }

  32%,
  48% {
    left: 8%;
    top: 40%;
    width: 40%;
    height: 38%;
    border-radius: 0.7rem;
    opacity: 0;
  }

  64%,
  82% {
    left: 8%;
    top: 30%;
    width: 15%;
    height: 46%;
    border-radius: 0.62rem;
    opacity: 0.94;
  }
}

@keyframes future-page-main {
  0%,
  16%,
  100% {
    left: 22%;
    top: 20%;
    width: 56%;
    height: 58%;
    border-radius: 0.92rem;
    opacity: 0.94;
  }

  32%,
  48% {
    left: 8%;
    top: 40%;
    width: 84%;
    height: 38%;
    border-radius: 0.7rem;
    opacity: 0.96;
  }

  64%,
  82% {
    left: 29%;
    top: 30%;
    width: 39%;
    height: 46%;
    border-radius: 0.62rem;
    opacity: 0.96;
  }
}

@keyframes future-page-rail {
  0%,
  16%,
  100% {
    left: 22%;
    top: 20%;
    width: 56%;
    height: 58%;
    border-radius: 0.92rem;
    opacity: 0;
  }

  32%,
  48% {
    left: 52%;
    top: 40%;
    width: 40%;
    height: 38%;
    border-radius: 0.7rem;
    opacity: 0;
  }

  64%,
  82% {
    left: 74%;
    top: 13%;
    width: 17%;
    height: 63%;
    border-radius: 0.62rem;
    opacity: 0.94;
  }
}

@keyframes future-page-footer {
  0%,
  16%,
  100% {
    left: 22%;
    top: 20%;
    width: 56%;
    height: 58%;
    border-radius: 0.92rem;
    opacity: 0;
  }

  32%,
  48% {
    left: 8%;
    top: 84%;
    width: 84%;
    height: 10%;
    border-radius: 0.7rem;
    opacity: 0.95;
  }

  64%,
  82% {
    left: 8%;
    top: 84%;
    width: 60%;
    height: 12%;
    border-radius: 0.62rem;
    opacity: 0.94;
  }
}

/* ── JSX source styling ── */

.history-line__source--jsx {
  font-size: 0.88rem;
}

.history-line__source-line--jsx-tag {
  color: color-mix(in srgb, var(--deck-text-primary) 58%, transparent);
}

.history-line__source-line--jsx-indent1 {
  padding-left: 1.26rem;
}

.history-line__source-line--jsx-indent2 {
  padding-left: 2.52rem;
}

.history-line__source-line--jsx-indent3 {
  padding-left: 3.78rem;
}

.jsx-dynamic {
  font-style: normal;
  color: var(--deck-primary);
}

:global(.reduced-motion .history-line *),
:global(.reduced-motion .history-line *::before),
:global(.reduced-motion .history-line *::after) {
  transition: none !important;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .history-line *,
  .history-line *::before,
  .history-line *::after {
    transition: none !important;
    animation: none !important;
  }
}

@keyframes history-line-draw {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes history-marker-rise {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.78);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
