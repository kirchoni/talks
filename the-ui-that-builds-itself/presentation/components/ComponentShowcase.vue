<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const states = ["empty", "grid", "focus", "features", "page", "apps"] as const;
const state = computed(
  () => states[Math.min(props.click ?? 0, states.length - 1)],
);

const featureColumns = [
  [
    "keyboard navigation",
    "typeahead",
    "focus management",
    "accessibility",
    "validation",
  ],
  [
    "async loading",
    "grouped options",
    "disabled states",
    "mobile behavior",
    "edge cases",
  ],
];
</script>

<template>
  <div class="showcase" :data-state="state">
    <!-- Row 1 -->
    <div class="showcase__cell showcase__cell--typo" style="--cell-i: 2">
      <div class="showcase__inner">
        <span
          class="sc-bar"
          style="width: 72%; height: 0.5rem; background: var(--sc-line-strong)"
        />
        <span class="sc-bar" style="width: 90%; height: 0.32rem" />
        <span class="sc-bar" style="width: 64%; height: 0.32rem" />
        <span
          class="sc-bar"
          style="width: 44%; height: 0.24rem; opacity: 0.55"
        />
      </div>
      <span class="showcase__label">Typography</span>
    </div>

    <div class="showcase__cell showcase__cell--tabs" style="--cell-i: 3">
      <div class="showcase__inner">
        <span class="sc-tabs">
          <span class="sc-tab" />
          <span class="sc-tab sc-tab--active" />
          <span class="sc-tab" />
        </span>
        <span
          class="sc-bar"
          style="width: 80%; height: 0.28rem; margin-top: 0.35rem"
        />
        <span class="sc-bar" style="width: 55%; height: 0.28rem" />
      </div>
      <span class="showcase__label">TabStrip</span>
    </div>

    <div class="showcase__cell showcase__cell--btn" style="--cell-i: 0">
      <div class="showcase__inner showcase__inner--center">
        <span class="sc-pill" />
        <span class="sc-pill sc-pill--outline" />
      </div>
      <span class="showcase__label">Button</span>
    </div>

    <div class="showcase__cell showcase__cell--switch" style="--cell-i: 1">
      <div class="showcase__inner showcase__inner--center">
        <span class="sc-switch">
          <span class="sc-switch__thumb" />
        </span>
      </div>
      <span class="showcase__label">Switch</span>
    </div>

    <!-- Row 2-3 left -->
    <div class="showcase__cell showcase__cell--input" style="--cell-i: 4">
      <div class="showcase__inner">
        <span
          class="sc-bar"
          style="width: 32%; height: 0.24rem; opacity: 0.6"
        />
        <span class="sc-field">
          <span
            class="sc-bar"
            style="width: 48%; height: 0.26rem; opacity: 0.35"
          />
        </span>
      </div>
      <span class="showcase__label">Input</span>
    </div>

    <!-- Center 2×2: Combobox -->
    <div class="showcase__cell showcase__cell--combo" style="--cell-i: 10">
      <div class="showcase__inner">
        <span class="sc-field sc-field--combo">
          <span class="sc-bar" style="width: 42%; height: 0.26rem" />
          <span class="sc-chevron" />
        </span>
        <span class="sc-dropdown">
          <span class="sc-option" />
          <span class="sc-option sc-option--selected" />
          <span class="sc-option" />
          <span class="sc-option" />
          <span class="sc-option" />
        </span>
      </div>
      <span class="showcase__label">Combobox</span>
    </div>

    <!-- Right 2×2: Calendar -->
    <div class="showcase__cell showcase__cell--cal" style="--cell-i: 7">
      <div class="showcase__inner">
        <span class="sc-cal-header">
          <span class="sc-bar" style="width: 3.2rem; height: 0.24rem" />
        </span>
        <span class="sc-cal-grid">
          <span
            v-for="n in 28"
            :key="n"
            class="sc-cal-day"
            :class="{ 'sc-cal-day--today': n === 17 }"
          />
        </span>
      </div>
      <span class="showcase__label">Calendar</span>
    </div>

    <div class="showcase__cell showcase__cell--radio" style="--cell-i: 5">
      <div class="showcase__inner">
        <span class="sc-radio-row">
          <span class="sc-radio" />
          <span class="sc-bar" style="width: 60%; height: 0.24rem" />
        </span>
        <span class="sc-radio-row">
          <span class="sc-radio sc-radio--selected" />
          <span class="sc-bar" style="width: 72%; height: 0.24rem" />
        </span>
        <span class="sc-radio-row">
          <span class="sc-radio" />
          <span class="sc-bar" style="width: 48%; height: 0.24rem" />
        </span>
      </div>
      <span class="showcase__label">Radio</span>
    </div>

    <!-- Row 3-4: Menu -->
    <div class="showcase__cell showcase__cell--menu" style="--cell-i: 8">
      <div class="showcase__inner">
        <span v-for="n in 4" :key="n" class="sc-menu-item">
          <span class="sc-menu-icon" />
          <span
            class="sc-bar"
            :style="{ width: [58, 72, 48, 64][n - 1] + '%', height: '0.24rem' }"
          />
        </span>
      </div>
      <span class="showcase__label">Menu</span>
    </div>

    <div class="showcase__cell showcase__cell--chk" style="--cell-i: 6">
      <div class="showcase__inner">
        <span class="sc-chk-row">
          <span class="sc-chk sc-chk--checked" />
          <span class="sc-bar" style="width: 64%; height: 0.24rem" />
        </span>
        <span class="sc-chk-row">
          <span class="sc-chk" />
          <span class="sc-bar" style="width: 52%; height: 0.24rem" />
        </span>
        <span class="sc-chk-row">
          <span class="sc-chk sc-chk--checked" />
          <span class="sc-bar" style="width: 70%; height: 0.24rem" />
        </span>
      </div>
      <span class="showcase__label">Checkbox</span>
    </div>

    <!-- Row 4: Table (wide) -->
    <div class="showcase__cell showcase__cell--table" style="--cell-i: 9">
      <div class="showcase__inner">
        <span class="sc-table-row sc-table-row--header">
          <span /><span /><span /><span />
        </span>
        <span class="sc-table-row"> <span /><span /><span /><span /> </span>
        <span class="sc-table-row"> <span /><span /><span /><span /> </span>
      </div>
      <span class="showcase__label">Table</span>
    </div>

    <div class="showcase__features" aria-hidden="true">
      <div
        v-for="(column, columnIndex) in featureColumns"
        :key="columnIndex"
        class="showcase__feature-column"
        :class="`showcase__feature-column--${columnIndex === 0 ? 'left' : 'right'}`"
      >
        <span
          v-for="(feature, featureIndex) in column"
          :key="feature"
          class="showcase__feature-chip"
          :style="{ '--feature-i': columnIndex * column.length + featureIndex }"
        >
          {{ feature }}
        </span>
      </div>
    </div>

    <div class="showcase__webpage" aria-hidden="true">
      <div class="showcase__browser">
        <div class="showcase__browser-top">
          <span />
          <span />
          <span />
          <i />
        </div>
        <div class="showcase__browser-body">
          <aside class="showcase__page-sidebar">
            <span class="showcase__page-logo" />
            <span v-for="n in 5" :key="n" />
          </aside>
          <main class="showcase__page-main">
            <div class="showcase__page-title">
              <span />
              <span />
            </div>
            <div class="showcase__page-tabs">
              <span />
              <span class="showcase__page-tab--active" />
              <span />
            </div>
            <div class="showcase__page-layout">
              <section class="showcase__page-panel showcase__page-panel--wide">
                <span v-for="n in 9" :key="n" />
              </section>
              <section class="showcase__page-panel showcase__page-panel--form">
                <span />
                <span />
                <span class="showcase__combo-slot">
                  <span class="showcase__embedded-combo">
                    <i />
                    <strong>
                      <i />
                      <i />
                      <i />
                      <i />
                    </strong>
                  </span>
                </span>
                <span />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>

    <div class="showcase__apps" aria-hidden="true">
      <div class="showcase__app showcase__app--dashboard" style="--app-i: 0">
        <div class="showcase__app-top"><span /><span /><span /><i /></div>
        <div class="showcase__app-dashboard">
          <aside><span /><span /><span /><span /></aside>
          <main>
            <header><span /><span /></header>
            <section>
              <span v-for="n in 6" :key="`dash-${n}`" />
            </section>
            <footer>
              <span />
              <span class="showcase__app-combo" />
            </footer>
          </main>
        </div>
      </div>

      <div class="showcase__app showcase__app--conversation" style="--app-i: 1">
        <div class="showcase__app-top"><span /><span /><span /><i /></div>
        <div class="showcase__app-conversation">
          <aside>
            <span v-for="n in 5" :key="`thread-${n}`" />
          </aside>
          <main>
            <span v-for="n in 4" :key="`message-${n}`" />
            <strong />
          </main>
        </div>
      </div>

      <div class="showcase__app showcase__app--workflow" style="--app-i: 2">
        <div class="showcase__app-top"><span /><span /><span /><i /></div>
        <div class="showcase__app-workflow">
          <header><span /><span /></header>
          <main>
            <section v-for="n in 3" :key="`lane-${n}`">
              <i />
              <span />
              <span />
              <span />
            </section>
          </main>
        </div>
      </div>

      <div class="showcase__app showcase__app--analytics" style="--app-i: 3">
        <div class="showcase__app-top"><span /><span /><span /><i /></div>
        <div class="showcase__app-analytics">
          <header>
            <span />
            <span />
            <span />
          </header>
          <main>
            <section>
              <i
                v-for="n in 7"
                :key="`bar-${n}`"
                :style="{ height: `${28 + n * 7}%` }"
              />
            </section>
            <aside>
              <span v-for="n in 4" :key="`metric-${n}`" />
            </aside>
          </main>
        </div>
      </div>

      <div class="showcase__app showcase__app--settings" style="--app-i: 4">
        <div class="showcase__app-top"><span /><span /><span /><i /></div>
        <div class="showcase__app-settings">
          <header><span /><span /></header>
          <main>
            <section>
              <span />
              <span />
              <span class="showcase__app-combo" />
              <span />
            </section>
            <aside>
              <span v-for="n in 5" :key="`setting-${n}`" />
            </aside>
          </main>
        </div>
      </div>
    </div>

    <!-- Zoom overlay -->
    <div class="showcase__zoom" aria-hidden="true">
      <div class="showcase__zoom-panel">
        <div class="showcase__zoom-visual">
          <span class="sc-field sc-field--combo sc-field--lg">
            <span class="sc-bar" style="width: 42%; height: 0.32rem" />
            <span class="sc-chevron" />
          </span>
          <span class="sc-dropdown sc-dropdown--lg">
            <span class="sc-option sc-option--lg" />
            <span class="sc-option sc-option--lg sc-option--selected" />
            <span class="sc-option sc-option--lg" />
            <span class="sc-option sc-option--lg" />
            <span class="sc-option sc-option--lg" />
          </span>
        </div>
        <div class="showcase__zoom-details">
          <span
            v-for="(d, i) in featureColumns.flat()"
            :key="d"
            class="showcase__detail"
            :style="{ '--detail-i': i }"
            >{{ d }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.showcase {
  --sc-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --sc-story-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --sc-grid-gap: 0.8rem;
  --sc-grid-top: 0.72rem;
  --sc-combo-grid-left: calc((100% - 4rem) / 3 + 1.6rem);
  --sc-combo-grid-top: calc(1.52rem + (100% - 3.12rem) / 4);
  --sc-combo-grid-width: calc((100% - 4rem) / 3 + 0.8rem);
  --sc-combo-grid-height: calc((100% - 3.12rem) / 2 + 0.8rem);
  --sc-combo-page-left: calc(50% + 9.07rem);
  --sc-combo-page-top: calc(50% - 0.25rem);
  --sc-combo-page-width: 14.06rem;
  --sc-combo-page-height: 8.2rem;
  --sc-combo-app-left: 11.64rem;
  --sc-combo-app-top: 7.39rem;
  --sc-combo-app-height: 11.3rem;
  --sc-combo-app-scale: 0.355;
  --sc-panel: color-mix(in srgb, var(--deck-surface-paper) 72%, transparent);
  --sc-line: color-mix(in srgb, var(--deck-text-primary) 16%, transparent);
  --sc-line-strong: color-mix(
    in srgb,
    var(--deck-text-primary) 28%,
    transparent
  );
  --sc-border: color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  --sc-primary-soft: color-mix(in srgb, var(--deck-primary) 16%, transparent);
  --sc-primary-ring: color-mix(in srgb, var(--deck-primary) 32%, transparent);

  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: var(--sc-grid-gap);
  height: 100%;
  padding-top: var(--sc-grid-top);
  box-sizing: border-box;
}

/* ── Bento positions ── */
.showcase__cell--typo {
  grid-column: 1 / 3;
  grid-row: 1;
}
.showcase__cell--tabs {
  grid-column: 3 / 5;
  grid-row: 1;
}
.showcase__cell--btn {
  grid-column: 5;
  grid-row: 1;
}
.showcase__cell--switch {
  grid-column: 6;
  grid-row: 1;
}
.showcase__cell--input {
  grid-column: 1 / 3;
  grid-row: 2;
}
.showcase__cell--combo {
  grid-column: 3 / 5;
  grid-row: 2 / 4;
}
.showcase__cell--cal {
  grid-column: 5 / 7;
  grid-row: 2 / 4;
}
.showcase__cell--radio {
  grid-column: 1;
  grid-row: 3;
}
.showcase__cell--menu {
  grid-column: 2;
  grid-row: 3 / 5;
}
.showcase__cell--chk {
  grid-column: 1;
  grid-row: 4;
}
.showcase__cell--table {
  grid-column: 3 / 7;
  grid-row: 4;
}

.showcase__cell--typo {
  --focus-drift-x: -1rem;
  --focus-drift-y: -0.75rem;
}
.showcase__cell--tabs {
  --focus-drift-x: -0.15rem;
  --focus-drift-y: -1rem;
}
.showcase__cell--btn {
  --focus-drift-x: 0.95rem;
  --focus-drift-y: -0.85rem;
}
.showcase__cell--switch {
  --focus-drift-x: 1.1rem;
  --focus-drift-y: -0.7rem;
}
.showcase__cell--input {
  --focus-drift-x: -1.2rem;
  --focus-drift-y: 0;
}
.showcase__cell--cal {
  --focus-drift-x: 1.25rem;
  --focus-drift-y: 0.1rem;
}
.showcase__cell--radio {
  --focus-drift-x: -1.05rem;
  --focus-drift-y: 0.7rem;
}
.showcase__cell--menu {
  --focus-drift-x: -0.7rem;
  --focus-drift-y: 1rem;
}
.showcase__cell--chk {
  --focus-drift-x: -1rem;
  --focus-drift-y: 1.2rem;
}
.showcase__cell--table {
  --focus-drift-x: 0.8rem;
  --focus-drift-y: 1rem;
}

/* ── Cell chrome ── */
.showcase__cell {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 0.65rem;
  border: 1px solid var(--sc-border);
  border-radius: 0.7rem;
  background: var(--sc-panel);
  backdrop-filter: blur(12px);
  box-shadow: 0 0.6rem 1.6rem rgb(0 0 0 / 0.05);
  overflow: visible;
  opacity: 0;
  transform: translateY(0.5rem) scale(0.97);
  transition:
    opacity 460ms var(--sc-ease),
    transform 760ms var(--sc-story-ease),
    filter 500ms var(--sc-ease),
    border-color 500ms var(--sc-ease),
    background 500ms var(--sc-ease),
    box-shadow 760ms var(--sc-story-ease),
    padding 760ms var(--sc-story-ease),
    left 820ms var(--sc-story-ease),
    top 820ms var(--sc-story-ease),
    width 820ms var(--sc-story-ease),
    height 820ms var(--sc-story-ease);
  transition-delay: 0ms;
}

.showcase__cell--combo {
  position: absolute;
  grid-column: auto;
  grid-row: auto;
  left: var(--sc-combo-grid-left);
  top: var(--sc-combo-grid-top);
  width: var(--sc-combo-grid-width);
  height: var(--sc-combo-grid-height);
}

.showcase[data-state="grid"] .showcase__cell,
.showcase[data-state="focus"] .showcase__cell,
.showcase[data-state="features"] .showcase__cell,
.showcase[data-state="page"] .showcase__cell {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: calc(var(--cell-i, 0) * 55ms);
}

.showcase[data-state="apps"] .showcase__cell--combo {
  opacity: 1;
  transition-delay: 0ms;
}

.showcase[data-state="focus"] .showcase__cell:not(.showcase__cell--combo),
.showcase[data-state="features"] .showcase__cell:not(.showcase__cell--combo) {
  opacity: 0.13;
  filter: blur(2.5px);
  transform: translate(var(--focus-drift-x, 0), var(--focus-drift-y, 0))
    scale(0.94);
  transition-delay: 0ms;
}

.showcase[data-state="focus"] .showcase__cell--combo,
.showcase[data-state="features"] .showcase__cell--combo,
.showcase[data-state="page"] .showcase__cell--combo,
.showcase[data-state="apps"] .showcase__cell--combo {
  z-index: 12;
  opacity: 1;
  filter: none;
  border-color: var(--sc-primary-ring);
  background: color-mix(in srgb, var(--deck-surface-paper) 92%, transparent);
  box-shadow: 0 1.4rem 3.6rem rgb(0 0 0 / 0.14);
  transform: translate(0, -1.3rem) scale(1.22);
  transform-origin: center;
  transition-delay: 0ms;
}

.showcase[data-state="page"] .showcase__cell:not(.showcase__cell--combo) {
  z-index: 1;
  opacity: 0.035;
  filter: blur(2.5px);
  transform: translate(var(--focus-drift-x, 0), var(--focus-drift-y, 0))
    scale(0.88);
  transition-delay: 0ms;
}

.showcase[data-state="page"] .showcase__cell--combo {
  z-index: 18;
  left: var(--sc-combo-page-left);
  top: var(--sc-combo-page-top);
  width: var(--sc-combo-page-width);
  height: var(--sc-combo-page-height);
  padding: 0;
  border-color: transparent;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  transform: none;
}

.showcase[data-state="apps"] .showcase__cell--combo {
  z-index: 28;
  left: var(--sc-combo-app-left);
  top: var(--sc-combo-app-top);
  width: var(--sc-combo-page-width);
  height: var(--sc-combo-app-height);
  padding: 0;
  border-color: transparent;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
  transform: scale(var(--sc-combo-app-scale));
  transform-origin: top left;
}

.showcase[data-state="focus"] .showcase__cell--combo .showcase__inner,
.showcase[data-state="features"] .showcase__cell--combo .showcase__inner,
.showcase[data-state="page"] .showcase__cell--combo .showcase__inner,
.showcase[data-state="apps"] .showcase__cell--combo .showcase__inner {
  width: min(100%, 13.4rem);
  gap: 0.42rem;
}

.showcase[data-state="focus"] .showcase__cell--combo .showcase__label,
.showcase[data-state="features"] .showcase__cell--combo .showcase__label {
  top: -0.72rem;
  opacity: 0.5;
}

.showcase[data-state="page"] .showcase__cell--combo .showcase__label,
.showcase[data-state="apps"] .showcase__cell--combo .showcase__label {
  opacity: 0;
}

.showcase[data-state="page"] .showcase__cell--combo .showcase__inner,
.showcase[data-state="apps"] .showcase__cell--combo .showcase__inner {
  width: 100%;
  height: 100%;
}

.showcase__inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
}

.showcase__inner--center {
  align-items: center;
}

.showcase__cell--combo .showcase__inner {
  width: min(100%, 10.75rem);
  margin-inline: auto;
  justify-content: stretch;
}

.showcase__cell--table .showcase__inner {
  width: min(100%, 16rem);
  margin-inline: auto;
}

.showcase__label {
  position: absolute;
  left: -0.02rem;
  top: -0.6rem;
  display: block;
  color: color-mix(in srgb, var(--deck-text-muted) 68%, transparent);
  font-size: 0.5rem;
  font-family: var(--deck-font-mono);
  letter-spacing: 0.03em;
  line-height: 1;
  opacity: 0.72;
  pointer-events: none;
}

/* ── Feature reveal ── */
.showcase__features {
  --feature-rail-offset: 19.5rem;

  position: absolute;
  inset: 0;
  z-index: 14;
  pointer-events: none;
  opacity: 0;
  transition: opacity 320ms var(--sc-ease);
}

.showcase[data-state="features"] .showcase__features {
  opacity: 1;
}

.showcase__feature-column {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
  width: 12.6rem;
  transform: translateY(-50%);
}

.showcase__feature-column--left {
  right: calc(50% + var(--feature-rail-offset));
  align-items: flex-end;
}

.showcase__feature-column--right {
  left: calc(50% + var(--feature-rail-offset));
  align-items: flex-start;
}

.showcase__feature-chip {
  position: relative;
  display: block;
  max-width: 100%;
  padding: 0.43rem 0.68rem;
  border: 1px solid
    color-mix(in srgb, var(--deck-primary) 12%, var(--sc-border));
  border-radius: 0.45rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 90%, transparent);
  box-shadow: 0 0.55rem 1.25rem rgb(0 0 0 / 0.065);
  color: color-mix(in srgb, var(--deck-text-secondary) 92%, transparent);
  font-size: 0.62rem;
  font-weight: 560;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-0.5rem) scale(0.98);
  transition:
    opacity 340ms var(--sc-ease),
    transform 420ms var(--sc-ease);
}

.showcase__feature-chip::after {
  content: "";
  position: absolute;
  top: 50%;
  display: block;
  width: 7.8rem;
  border-top: 1px dashed
    color-mix(in srgb, var(--deck-primary) 34%, var(--deck-text-muted));
  opacity: 0;
  transform: translateY(-50%) scaleX(0.65);
  transition:
    opacity 360ms var(--sc-ease),
    transform 460ms var(--sc-ease);
}

.showcase__feature-column--left .showcase__feature-chip::after {
  left: calc(100% + 0.45rem);
  transform-origin: left center;
}

.showcase__feature-column--right .showcase__feature-chip::after {
  right: calc(100% + 0.45rem);
  transform-origin: right center;
}

.showcase__feature-column--right .showcase__feature-chip {
  transform: translateX(0.5rem) scale(0.98);
}

.showcase[data-state="features"] .showcase__feature-chip {
  opacity: 1;
  transform: translateX(0) scale(1);
  transition-delay: calc(90ms + var(--feature-i, 0) * 42ms);
}

.showcase[data-state="features"] .showcase__feature-chip::after {
  opacity: 0.52;
  transform: translateY(-50%) scaleX(1);
  transition-delay: calc(160ms + var(--feature-i, 0) * 42ms);
}

/* ── Page composition ── */
.showcase__webpage {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: block;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.8rem) scale(1.04);
  transition:
    opacity 620ms var(--sc-ease),
    transform 880ms var(--sc-story-ease);
}

.showcase[data-state="page"] .showcase__webpage {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 110ms;
}

.showcase[data-state="apps"] .showcase__webpage {
  z-index: 24;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 0ms;
}

.showcase__browser {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(100%, 50rem);
  height: min(100%, 24.4rem);
  border: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 12%, transparent);
  border-radius: 0.78rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 88%, transparent);
  box-shadow: 0 1.3rem 3.4rem rgb(0 0 0 / 0.11);
  overflow: hidden;
  transform: translate(-50%, -50%);
  transform-origin: top left;
  transition:
    left 980ms var(--sc-story-ease),
    top 980ms var(--sc-story-ease),
    width 980ms var(--sc-story-ease),
    height 980ms var(--sc-story-ease),
    transform 980ms var(--sc-story-ease),
    border-radius 980ms var(--sc-story-ease),
    box-shadow 980ms var(--sc-story-ease);
}

.showcase[data-state="apps"] .showcase__browser {
  left: 0;
  top: 0;
  width: calc((100% - 1.76rem) / 3);
  height: calc((100% - 0.88rem) / 2);
  box-sizing: border-box;
  border-radius: 0.72rem;
  box-shadow: 0 0.95rem 2.2rem rgb(0 0 0 / 0.09);
  transform: none;
}

.showcase__browser-top,
.showcase__browser-top span,
.showcase__browser-top i,
.showcase__browser-body,
.showcase__page-sidebar,
.showcase__page-sidebar span,
.showcase__page-logo,
.showcase__page-main,
.showcase__page-title,
.showcase__page-title span,
.showcase__page-tabs,
.showcase__page-tabs span,
.showcase__page-layout,
.showcase__page-panel,
.showcase__page-panel--wide,
.showcase__page-panel--wide span,
.showcase__page-panel--form,
.showcase__page-panel--form > span,
.showcase__combo-slot,
.showcase__embedded-combo {
  transition:
    opacity 420ms var(--sc-ease),
    width 900ms var(--sc-story-ease),
    height 900ms var(--sc-story-ease),
    min-height 900ms var(--sc-story-ease),
    padding 900ms var(--sc-story-ease),
    gap 900ms var(--sc-story-ease),
    border-radius 900ms var(--sc-story-ease),
    transform 900ms var(--sc-story-ease),
    background 520ms var(--sc-ease),
    box-shadow 520ms var(--sc-ease);
}

.showcase__browser-top {
  display: flex;
  align-items: center;
  gap: 0.34rem;
  padding: 0.62rem 0.78rem;
  border-bottom: 1px solid var(--sc-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 70%, transparent);
}

.showcase__browser-top span {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--sc-line-strong);
  opacity: 0.6;
}

.showcase__browser-top i {
  display: block;
  width: 13rem;
  height: 0.38rem;
  margin-left: 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
}

.showcase[data-state="apps"] .showcase__browser-top {
  gap: 0.25rem;
  padding: 0.42rem 0.52rem;
}

.showcase[data-state="apps"] .showcase__browser-top span {
  width: 0.3rem;
  height: 0.3rem;
}

.showcase[data-state="apps"] .showcase__browser-top i {
  width: 5.4rem;
  height: 0.28rem;
  margin-left: 0.36rem;
}

.showcase__browser-body {
  display: grid;
  grid-template-columns: 7.6rem minmax(0, 1fr);
  height: calc(100% - 1.68rem);
}

.showcase[data-state="apps"] .showcase__browser-body {
  grid-template-columns: 4.6rem minmax(0, 1fr);
  height: calc(100% - 1.15rem);
}

.showcase__page-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.62rem;
  padding: 1rem 0.82rem;
  border-right: 1px solid var(--sc-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 46%, transparent);
}

.showcase__page-sidebar span {
  display: block;
  width: 76%;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--sc-line);
}

.showcase__page-sidebar span:nth-child(3) {
  width: 88%;
  background: color-mix(in srgb, var(--deck-primary) 16%, var(--sc-line));
}

.showcase__page-logo {
  width: 2.4rem !important;
  height: 1.15rem !important;
  margin-bottom: 0.28rem;
  border-radius: 0.32rem !important;
  background: var(--sc-primary-soft) !important;
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
}

.showcase[data-state="apps"] .showcase__page-sidebar {
  gap: 0.45rem;
  padding: 0.66rem;
}

.showcase[data-state="apps"] .showcase__page-sidebar span {
  height: 0.3rem;
}

.showcase[data-state="apps"] .showcase__page-logo {
  width: 2rem !important;
  height: 0.82rem !important;
  margin-bottom: 0;
  border-radius: 0.25rem !important;
}

.showcase__page-main {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.05rem 1.15rem;
}

.showcase[data-state="apps"] .showcase__page-main {
  gap: 0.48rem;
  padding: 0.66rem;
}

.showcase__page-title {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.showcase__page-title span {
  display: block;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--sc-line-strong);
}

.showcase__page-title span:first-child {
  width: 32%;
}

.showcase__page-title span:last-child {
  width: 48%;
  height: 0.3rem;
  background: var(--sc-line);
}

.showcase[data-state="apps"] .showcase__page-title {
  gap: 0.28rem;
}

.showcase[data-state="apps"] .showcase__page-title span:first-child {
  width: 34%;
  height: 0.34rem;
}

.showcase[data-state="apps"] .showcase__page-title span:last-child {
  width: 48%;
  height: 0.22rem;
}

.showcase__page-tabs {
  display: flex;
  gap: 0.42rem;
  padding-bottom: 0.54rem;
  border-bottom: 1px solid var(--sc-border);
}

.showcase__page-tabs span {
  display: block;
  width: 3.3rem;
  height: 0.34rem;
  border-radius: 999px;
  background: var(--sc-line);
  opacity: 0.65;
}

.showcase__page-tabs .showcase__page-tab--active {
  background: color-mix(in srgb, var(--deck-primary) 54%, var(--sc-line));
  opacity: 0.85;
}

.showcase[data-state="apps"] .showcase__page-tabs {
  gap: 0.28rem;
  padding-bottom: 0.36rem;
}

.showcase[data-state="apps"] .showcase__page-tabs span {
  width: 2.2rem;
  height: 0.24rem;
}

.showcase__page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 15.5rem;
  gap: 0.85rem;
  min-height: 0;
  flex: 1;
}

.showcase[data-state="apps"] .showcase__page-layout {
  grid-template-columns: minmax(0, 1fr) 1.1fr;
  gap: 0.42rem;
}

.showcase__page-panel {
  border: 1px solid var(--sc-border);
  border-radius: 0.58rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 72%, transparent);
}

.showcase__page-panel--wide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.68rem;
}

.showcase[data-state="apps"] .showcase__page-panel {
  border-radius: 0.36rem;
}

.showcase[data-state="apps"] .showcase__page-panel--wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem;
  padding: 0.42rem;
}

.showcase__page-panel--wide span {
  display: block;
  min-height: 3.1rem;
  border-radius: 0.42rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase[data-state="apps"] .showcase__page-panel--wide span {
  min-height: 1.35rem;
  border-radius: 0.28rem;
}

.showcase[data-state="apps"] .showcase__page-panel--wide span:nth-child(n + 5) {
  display: none;
}

.showcase__page-panel--wide span:nth-child(2),
.showcase__page-panel--wide span:nth-child(7) {
  background: color-mix(in srgb, var(--deck-cool) 13%, transparent);
}

.showcase__page-panel--form {
  display: flex;
  flex-direction: column;
  gap: 0.62rem;
  padding: 0.72rem;
}

.showcase[data-state="apps"] .showcase__page-panel--form {
  min-height: 0;
  gap: 0.36rem;
  padding: 0.42rem;
}

.showcase__page-panel--form > span {
  display: block;
  height: 1.7rem;
  border-radius: 0.38rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase[data-state="apps"] .showcase__page-panel--form > span {
  height: 0.9rem;
  border-radius: 0.28rem;
}

.showcase__page-panel--form .showcase__combo-slot {
  position: relative;
  height: 8.2rem;
  border: 0;
  background: transparent;
}

.showcase[data-state="apps"] .showcase__page-panel--form .showcase__combo-slot {
  flex: 1;
  min-height: 2.45rem;
}

.showcase__embedded-combo {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  opacity: 0;
  transition: opacity 360ms var(--sc-ease);
}

.showcase[data-state="apps"] .showcase__embedded-combo {
  opacity: 0;
  transition-delay: 0ms;
}

.showcase__embedded-combo > i,
.showcase__embedded-combo strong {
  display: block;
  border: 1px solid
    color-mix(in srgb, var(--deck-primary) 18%, var(--sc-border));
  border-radius: 0.38rem;
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--deck-surface-paper) 88%, transparent),
    color-mix(in srgb, var(--deck-primary) 5%, var(--deck-surface-paper))
  );
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-primary) 6%, transparent);
}

.showcase__embedded-combo > i {
  height: 1.18rem;
}

.showcase__embedded-combo strong {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.28rem;
  padding: 0.42rem;
}

.showcase__embedded-combo strong i {
  display: block;
  width: 64%;
  height: 0.3rem;
  border-radius: 999px;
  background: color-mix(
    in srgb,
    var(--deck-text-primary) 11%,
    var(--deck-surface-paper)
  );
}

.showcase__embedded-combo strong i:nth-child(2) {
  width: 78%;
  border-radius: 0.18rem;
  background: color-mix(
    in srgb,
    var(--deck-primary) 16%,
    var(--deck-surface-paper)
  );
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
}

/* ── App volume ── */
.showcase__apps {
  position: absolute;
  inset: 0;
  z-index: 23;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 0.88rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(0.6rem) scale(0.98);
  transition:
    opacity 560ms var(--sc-ease),
    transform 760ms var(--sc-story-ease);
}

.showcase[data-state="apps"] .showcase__apps {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 330ms;
}

.showcase__app {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 11%, transparent);
  border-radius: 0.72rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 88%, transparent);
  box-shadow: 0 0.95rem 2.2rem rgb(0 0 0 / 0.09);
  overflow: hidden;
  opacity: 0;
  transform: translateY(0.7rem) scale(0.96);
  transition:
    opacity 420ms var(--sc-ease),
    transform 600ms var(--sc-ease);
}

.showcase[data-state="apps"] .showcase__app {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: calc(470ms + var(--app-i, 0) * 80ms);
}

.showcase__app--dashboard {
  grid-column: 2;
  grid-row: 1;
}

.showcase__app--conversation {
  grid-column: 3;
  grid-row: 1;
}

.showcase__app--workflow {
  grid-column: 1;
  grid-row: 2;
}

.showcase__app--analytics {
  grid-column: 2;
  grid-row: 2;
}

.showcase__app--settings {
  grid-column: 3;
  grid-row: 2;
}

.showcase__app-top {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.42rem 0.52rem;
  border-bottom: 1px solid var(--sc-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 58%, transparent);
}

.showcase__app-top span {
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--sc-line-strong);
  opacity: 0.58;
}

.showcase__app-top i {
  display: block;
  width: 5.4rem;
  height: 0.28rem;
  margin-left: 0.36rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
}

.showcase__app-dashboard,
.showcase__app-conversation,
.showcase__app-workflow,
.showcase__app-analytics,
.showcase__app-settings {
  flex: 1;
  min-height: 0;
}

.showcase__app-dashboard {
  display: grid;
  grid-template-columns: 4.6rem minmax(0, 1fr);
}

.showcase__app-dashboard aside {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.66rem;
  border-right: 1px solid var(--sc-border);
  background: color-mix(in srgb, var(--deck-surface-panel) 42%, transparent);
}

.showcase__app-dashboard aside span,
.showcase__app-dashboard header span,
.showcase__app-dashboard footer span,
.showcase__app-conversation aside span,
.showcase__app-conversation main span,
.showcase__app-workflow header span,
.showcase__app-workflow section span,
.showcase__app-workflow section i,
.showcase__app-analytics header span,
.showcase__app-analytics aside span,
.showcase__app-settings header span,
.showcase__app-settings section span,
.showcase__app-settings aside span {
  display: block;
  border-radius: 999px;
  background: var(--sc-line);
}

.showcase__app-dashboard aside span {
  width: 82%;
  height: 0.3rem;
}

.showcase__app-dashboard aside span:first-child {
  width: 2rem;
  height: 0.82rem;
  border-radius: 0.25rem;
  background: var(--sc-primary-soft);
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
}

.showcase__app-dashboard main {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
  padding: 0.66rem;
}

.showcase__app-dashboard header {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.showcase__app-dashboard header span:first-child {
  width: 34%;
  height: 0.34rem;
  background: var(--sc-line-strong);
}

.showcase__app-dashboard header span:last-child {
  width: 48%;
  height: 0.22rem;
}

.showcase__app-dashboard section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;
  flex: 1;
}

.showcase__app-dashboard section span {
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-dashboard footer {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 0.38rem;
  min-height: 2.45rem;
}

.showcase__app-dashboard footer span {
  border-radius: 0.32rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-combo {
  border: 1px solid color-mix(in srgb, var(--deck-primary) 24%, transparent);
  background:
    linear-gradient(
      color-mix(in srgb, var(--deck-primary) 9%, transparent),
      transparent 34%
    ),
    color-mix(in srgb, var(--deck-surface-paper) 76%, transparent) !important;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-primary) 9%, transparent);
}

.showcase__app-conversation {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
}

.showcase__app-conversation aside {
  display: flex;
  flex-direction: column;
  gap: 0.44rem;
  padding: 0.64rem;
  border-right: 1px solid var(--sc-border);
}

.showcase__app-conversation aside span {
  height: 1.15rem;
  border-radius: 0.32rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-conversation aside span:nth-child(2) {
  background: color-mix(in srgb, var(--deck-cool) 14%, transparent);
}

.showcase__app-conversation main {
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
  padding: 0.68rem;
}

.showcase__app-conversation main span {
  width: 72%;
  height: 1.05rem;
  border-radius: 0.34rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-conversation main span:nth-child(even) {
  align-self: flex-end;
  width: 58%;
  background: color-mix(in srgb, var(--deck-primary) 10%, transparent);
}

.showcase__app-conversation main strong {
  display: block;
  height: 1.25rem;
  margin-top: auto;
  border: 1px solid var(--sc-border);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 72%, transparent);
}

.showcase__app-workflow {
  display: flex;
  flex-direction: column;
  gap: 0.56rem;
  padding: 0.68rem;
}

.showcase__app-workflow header {
  display: flex;
  gap: 0.38rem;
}

.showcase__app-workflow header span {
  width: 4.2rem;
  height: 0.34rem;
}

.showcase__app-workflow header span:first-child {
  background: var(--sc-line-strong);
}

.showcase__app-workflow main {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  flex: 1;
}

.showcase__app-workflow section {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  padding: 0.42rem;
  border-radius: 0.36rem;
  background: color-mix(in srgb, var(--deck-text-primary) 5%, transparent);
}

.showcase__app-workflow section i {
  width: 64%;
  height: 0.25rem;
  background: var(--sc-line-strong);
}

.showcase__app-workflow section span {
  height: 1.15rem;
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 62%, transparent);
}

.showcase__app-analytics {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.68rem;
}

.showcase__app-analytics header {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.42rem;
}

.showcase__app-analytics header span {
  height: 1.35rem;
  border-radius: 0.34rem;
  background: color-mix(in srgb, var(--deck-cool) 12%, transparent);
}

.showcase__app-analytics main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.2rem;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}

.showcase__app-analytics section {
  display: flex;
  align-items: end;
  gap: 0.28rem;
  padding: 0.45rem;
  border-radius: 0.36rem;
  background: color-mix(in srgb, var(--deck-text-primary) 5%, transparent);
}

.showcase__app-analytics section i {
  display: block;
  flex: 1;
  min-height: 18%;
  border-radius: 999px 999px 0.12rem 0.12rem;
  background: color-mix(in srgb, var(--deck-primary) 34%, var(--sc-line));
}

.showcase__app-analytics aside {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.showcase__app-analytics aside span {
  flex: 1;
  border-radius: 0.28rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-settings {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.68rem;
}

.showcase__app-settings header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.showcase__app-settings header span:first-child {
  width: 48%;
  height: 0.36rem;
  background: var(--sc-line-strong);
}

.showcase__app-settings header span:last-child {
  width: 68%;
  height: 0.24rem;
}

.showcase__app-settings main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.8rem;
  gap: 0.5rem;
  flex: 1;
}

.showcase__app-settings section,
.showcase__app-settings aside {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.showcase__app-settings section span {
  height: 1.22rem;
  border-radius: 0.34rem;
  background: color-mix(in srgb, var(--deck-text-primary) 7%, transparent);
}

.showcase__app-settings section .showcase__app-combo {
  height: 2.15rem;
}

.showcase__app-settings aside span {
  flex: 1;
  border-radius: 0.28rem;
  background: color-mix(in srgb, var(--deck-text-primary) 6%, transparent);
}

/* ── Shared primitives ── */
.sc-bar {
  display: block;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--sc-line);
  transition:
    background 520ms var(--sc-ease),
    box-shadow 520ms var(--sc-ease);
}

.sc-field {
  display: flex;
  align-items: center;
  padding: 0.38rem 0.5rem;
  border: 1px solid var(--sc-border);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 60%, transparent);
  transition:
    background 520ms var(--sc-ease),
    border-color 520ms var(--sc-ease);
}

/* ── Button ── */
.sc-pill {
  display: block;
  width: 4.2rem;
  height: 1.4rem;
  border-radius: 999px;
  background: var(--sc-primary-soft);
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
}

.sc-pill--outline {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--sc-border);
  margin-top: 0.35rem;
  width: 3.6rem;
}

/* ── Switch ── */
.sc-switch {
  position: relative;
  display: block;
  width: 2.4rem;
  height: 1.3rem;
  border-radius: 999px;
  background: var(--sc-primary-soft);
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
}

.sc-switch__thumb {
  position: absolute;
  right: 0.18rem;
  top: 50%;
  transform: translateY(-50%);
  display: block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  background: var(--deck-primary);
}

/* ── Tabs ── */
.sc-tabs {
  display: flex;
  gap: 0.15rem;
  border-bottom: 1px solid var(--sc-border);
  padding-bottom: 0.25rem;
}

.sc-tab {
  display: block;
  width: 2.2rem;
  height: 0.24rem;
  border-radius: 999px 999px 0 0;
  background: var(--sc-line);
  opacity: 0.5;
}

.sc-tab--active {
  opacity: 1;
  background: var(--sc-line-strong);
  box-shadow: 0 1px 0 var(--deck-primary);
}

/* ── Combobox ── */
.sc-field--combo {
  justify-content: space-between;
  flex-shrink: 0;
}

.sc-chevron {
  display: block;
  width: 0.42rem;
  height: 0.42rem;
  border-right: 1.5px solid var(--deck-text-muted);
  border-bottom: 1.5px solid var(--deck-text-muted);
  transform: rotate(45deg);
  flex-shrink: 0;
  margin-left: auto;
}

.sc-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.32rem;
  border: 1px solid var(--sc-border);
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 80%, transparent);
  box-shadow: 0 0.4rem 1.2rem rgb(0 0 0 / 0.07);
  transition:
    background 520ms var(--sc-ease),
    border-color 520ms var(--sc-ease),
    box-shadow 520ms var(--sc-ease);
}

.showcase__cell--combo .sc-dropdown {
  flex: 1;
  justify-content: space-evenly;
  min-height: 0;
}

.sc-option {
  display: block;
  height: 0.26rem;
  width: 70%;
  border-radius: 999px;
  background: var(--sc-line);
  transition:
    background 520ms var(--sc-ease),
    box-shadow 520ms var(--sc-ease);
}

.sc-option:nth-child(odd) {
  width: 58%;
}

.sc-option--selected {
  background: var(--sc-primary-soft);
  box-shadow: inset 0 0 0 1px var(--sc-primary-ring);
  width: 74%;
  height: 0.32rem;
  border-radius: 0.18rem;
}

.showcase[data-state="focus"] .showcase__cell--combo .sc-field--combo,
.showcase[data-state="features"] .showcase__cell--combo .sc-field--combo,
.showcase[data-state="page"] .showcase__cell--combo .sc-field--combo,
.showcase[data-state="apps"] .showcase__cell--combo .sc-field--combo {
  border-color: color-mix(in srgb, var(--deck-primary) 12%, var(--sc-border));
  background: linear-gradient(
    115deg,
    color-mix(in srgb, var(--deck-surface-paper) 88%, transparent),
    color-mix(in srgb, var(--deck-primary) 3%, var(--deck-surface-paper)) 58%,
    color-mix(in srgb, var(--deck-surface-paper) 90%, transparent)
  );
}

.showcase[data-state="focus"] .showcase__cell--combo .sc-dropdown,
.showcase[data-state="features"] .showcase__cell--combo .sc-dropdown,
.showcase[data-state="page"] .showcase__cell--combo .sc-dropdown,
.showcase[data-state="apps"] .showcase__cell--combo .sc-dropdown {
  border-color: color-mix(in srgb, var(--deck-primary) 10%, var(--sc-border));
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--deck-surface-paper) 92%, transparent),
    color-mix(in srgb, var(--deck-primary) 3%, var(--deck-surface-paper)) 52%,
    color-mix(in srgb, var(--deck-surface-paper) 88%, transparent)
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 32%, transparent),
    0 0.65rem 1.4rem rgb(0 0 0 / 0.06);
}

.showcase[data-state="focus"] .showcase__cell--combo .sc-bar,
.showcase[data-state="focus"] .showcase__cell--combo .sc-option,
.showcase[data-state="features"] .showcase__cell--combo .sc-bar,
.showcase[data-state="features"] .showcase__cell--combo .sc-option,
.showcase[data-state="page"] .showcase__cell--combo .sc-bar,
.showcase[data-state="page"] .showcase__cell--combo .sc-option,
.showcase[data-state="apps"] .showcase__cell--combo .sc-bar,
.showcase[data-state="apps"] .showcase__cell--combo .sc-option {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--deck-primary) 4%, var(--sc-line)) 0%,
    color-mix(in srgb, var(--deck-text-primary) 10%, var(--deck-surface-paper))
      38%,
    color-mix(in srgb, var(--deck-primary) 8%, var(--deck-surface-paper)) 50%,
    color-mix(in srgb, var(--deck-text-primary) 10%, var(--deck-surface-paper))
      62%,
    color-mix(in srgb, var(--deck-primary) 4%, var(--sc-line)) 100%
  );
  background-size: 230% 100%;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-primary) 5%, transparent);
}

.showcase[data-state="focus"] .showcase__cell--combo .sc-option--selected,
.showcase[data-state="features"] .showcase__cell--combo .sc-option--selected,
.showcase[data-state="page"] .showcase__cell--combo .sc-option--selected,
.showcase[data-state="apps"] .showcase__cell--combo .sc-option--selected {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--deck-primary) 10%, var(--deck-surface-paper)) 0%,
    color-mix(in srgb, var(--deck-primary) 6%, var(--deck-surface-paper)) 38%,
    color-mix(in srgb, var(--deck-primary) 15%, var(--deck-surface-paper)) 50%,
    color-mix(in srgb, var(--deck-primary) 6%, var(--deck-surface-paper)) 62%,
    color-mix(in srgb, var(--deck-primary) 10%, var(--deck-surface-paper)) 100%
  );
  background-size: 230% 100%;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-primary) 18%, transparent);
}

:global(
    html:not(.reduced-motion) .showcase[data-state="focus"]
      .showcase__cell--combo
      .sc-bar
  ),
:global(
    html:not(.reduced-motion) .showcase[data-state="focus"]
      .showcase__cell--combo
      .sc-option
  ),
:global(
    html:not(.reduced-motion) .showcase[data-state="features"]
      .showcase__cell--combo
      .sc-bar
  ),
:global(
    html:not(.reduced-motion) .showcase[data-state="features"]
      .showcase__cell--combo
      .sc-option
  ) {
  animation: sc-combo-flow 2.8s linear infinite;
}

@keyframes sc-combo-flow {
  from {
    background-position: 115% 0;
  }

  to {
    background-position: -115% 0;
  }
}

/* ── Calendar ── */
.sc-cal-header {
  display: flex;
  justify-content: center;
  padding-bottom: 0.28rem;
  border-bottom: 1px solid var(--sc-border);
  margin-bottom: 0.28rem;
}

.sc-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem;
}

.sc-cal-day {
  aspect-ratio: 1;
  border-radius: 0.15rem;
  background: var(--sc-line);
  opacity: 0.35;
}

.sc-cal-day--today {
  background: var(--deck-primary);
  opacity: 0.8;
}

/* ── Radio ── */
.sc-radio-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sc-radio {
  display: block;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  border: 1.5px solid var(--sc-line-strong);
  flex-shrink: 0;
}

.sc-radio--selected {
  border-color: var(--deck-primary);
  background: radial-gradient(circle, var(--deck-primary) 36%, transparent 38%);
}

/* ── Checkbox ── */
.sc-chk-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sc-chk {
  display: block;
  width: 0.66rem;
  height: 0.66rem;
  border-radius: 0.14rem;
  border: 1.5px solid var(--sc-line-strong);
  flex-shrink: 0;
}

.sc-chk--checked {
  border-color: var(--deck-primary);
  background: var(--deck-primary);
  position: relative;
}

.sc-chk--checked::after {
  content: "";
  position: absolute;
  left: 0.14rem;
  top: 0.04rem;
  width: 0.26rem;
  height: 0.42rem;
  border-right: 1.5px solid var(--deck-on-primary);
  border-bottom: 1.5px solid var(--deck-on-primary);
  transform: rotate(42deg);
}

/* ── Menu ── */
.sc-menu-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0;
}

.sc-menu-item + .sc-menu-item {
  border-top: 1px solid color-mix(in srgb, var(--sc-border) 60%, transparent);
}

.sc-menu-icon {
  display: block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 0.15rem;
  background: var(--sc-line);
  flex-shrink: 0;
}

/* ── Table ── */
.sc-table-row {
  display: grid;
  grid-template-columns: 0.6fr 1fr 0.8fr 0.5fr;
  gap: 0.35rem;
  padding: 0.25rem 0;
}

.sc-table-row + .sc-table-row {
  border-top: 1px solid color-mix(in srgb, var(--sc-border) 60%, transparent);
}

.sc-table-row span {
  display: block;
  height: 0.24rem;
  border-radius: 999px;
  background: var(--sc-line);
}

.sc-table-row--header span {
  background: var(--sc-line-strong);
  height: 0.28rem;
}

/* ── Zoom overlay ── */
.showcase__zoom {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 500ms var(--sc-ease);
}

.showcase[data-state="zoom"] .showcase__zoom {
  opacity: 1;
}

.showcase__zoom-panel {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  width: min(100%, 34rem);
  padding: 1.8rem 2rem;
  border: 1px solid var(--sc-border);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 88%, transparent);
  backdrop-filter: blur(20px);
  box-shadow: 0 1.4rem 3.4rem rgb(0 0 0 / 0.12);
  transform: scale(0.92);
  transition: transform 600ms var(--sc-ease);
}

.showcase[data-state="zoom"] .showcase__zoom-panel {
  transform: scale(1);
}

.showcase__zoom-visual {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-content: center;
}

.sc-field--lg {
  padding: 0.52rem 0.65rem;
  border-radius: 0.5rem;
}

.sc-dropdown--lg {
  gap: 0.25rem;
  padding: 0.42rem;
  border-radius: 0.5rem;
}

.sc-option--lg {
  height: 0.34rem;
}

.sc-option--lg.sc-option--selected {
  height: 0.42rem;
}

.showcase__zoom-details {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  justify-content: center;
}

.showcase__detail {
  display: block;
  color: var(--deck-text-secondary);
  font-size: 0.82rem;
  font-weight: 520;
  line-height: 1.2;
  padding-left: 0.75rem;
  border-left: 2px solid var(--sc-primary-ring);
  opacity: 0;
  transform: translateX(-0.4rem);
  transition:
    opacity 380ms var(--sc-ease),
    transform 480ms var(--sc-ease);
}

.showcase[data-state="zoom"] .showcase__detail {
  opacity: 1;
  transform: translateX(0);
  transition-delay: calc(200ms + var(--detail-i, 0) * 50ms);
}

/* ── Reduced motion ── */
:global(.reduced-motion .showcase *),
:global(.reduced-motion .showcase *::before),
:global(.reduced-motion .showcase *::after) {
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 1ms !important;
  transition-delay: 0ms !important;
}

@media (prefers-reduced-motion: reduce) {
  .showcase *,
  .showcase *::before,
  .showcase *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
</style>
