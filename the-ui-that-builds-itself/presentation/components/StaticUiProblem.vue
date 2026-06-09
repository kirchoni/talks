<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const states = [
  "idle",
  "trial-intent",
  "trial-focus",
  "docs-intent",
  "docs-focus",
  "license-intent",
  "license-focus",
  "stock-intent",
  "stock-focus",
  "jobs-intent",
  "jobs-focus",
  "jobs-routes",
] as const;

const state = computed(() => {
  const click = Math.min(props.click ?? 0, states.length - 1);
  return states[click];
});

const visitors = [
  {
    id: "trial",
    quote: "I want to start a trial",
    color: "var(--deck-info)",
  },
  {
    id: "docs",
    quote: "I want to read the docs",
    color: "var(--deck-warning)",
  },
  {
    id: "license",
    quote: "I'm looking to purchase a license",
    color: "var(--deck-primary)",
  },
  {
    id: "stock",
    quote: "I want to invest in the stock",
    color: "var(--deck-secondary)",
  },
  {
    id: "jobs",
    quote: "I want to apply for a job",
    color: "var(--deck-warning)",
  },
] as const;

const activeVisitor = computed(() => {
  if (state.value === "idle") return null;
  return visitors.find((visitor) => state.value.startsWith(visitor.id)) ?? null;
});
</script>

<template>
  <section class="static-problem" :data-state="state">
    <Transition name="visitor-swap" mode="out-in">
      <aside
        v-if="activeVisitor"
        :key="activeVisitor.id"
        class="visitor-intent"
        aria-label="Visitor intent"
        :style="{ '--intent-color': activeVisitor.color }"
      >
        <span class="visitor-intent__avatar">
          <span class="visitor-intent__head" />
          <span class="visitor-intent__body" />
        </span>
        <span class="visitor-intent__quote">{{ activeVisitor.quote }}</span>
      </aside>
    </Transition>

    <div class="static-problem__stage" aria-label="Static SaaS page wireframe">
      <div class="route-map" aria-label="Nested route path">
        <div class="saas-wireframe">
          <header class="saas-wireframe__header">
            <span class="saas-wireframe__logo">Logo</span>
            <span class="saas-wireframe__nav">
              <span class="saas-nav__item saas-nav__item--docs" />
              <span class="saas-nav__item" />
              <span class="saas-nav__item saas-nav__item--company">
                <span class="saas-company-menu" aria-hidden="true">
                  <span class="saas-company-menu__image" />
                  <span class="saas-company-menu__column">
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                  </span>
                  <span class="saas-company-menu__column">
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span class="saas-company-menu__item" />
                    <span
                      class="saas-company-menu__item saas-company-menu__item--investors"
                    />
                    <span
                      class="saas-company-menu__item saas-company-menu__item--careers"
                    />
                  </span>
                </span>
              </span>
            </span>
            <span class="saas-button saas-button--try"> TRY </span>
          </header>

          <main class="saas-wireframe__body">
            <section class="saas-wireframe__hero">
              <div class="saas-wireframe__hero-copy">
                <span class="saas-line saas-line--title" />
                <span class="saas-line saas-line--wide" />
                <span class="saas-line saas-line--medium" />
                <span class="saas-line saas-line--short" />
                <span class="saas-wireframe__actions">
                  <span class="saas-button saas-button--try saas-button--solid">
                    TRY
                  </span>
                  <span class="saas-button saas-button--demo">DEMO</span>
                </span>
              </div>
              <div class="saas-wireframe__media" />
            </section>

            <section class="saas-wireframe__logos" aria-label="Customer logos">
              <span>ACME</span>
              <span>NASA</span>
              <span>WILD</span>
            </section>

            <section class="saas-wireframe__pricing" aria-label="Pricing plans">
              <article class="saas-price-card">
                <strong>Lite</strong>
                <span class="saas-price-card__lines">
                  <span />
                  <span />
                </span>
                <span class="saas-button saas-button--try"> TRY </span>
              </article>
              <article class="saas-price-card saas-price-card--featured">
                <strong>Pro</strong>
                <span class="saas-price-card__lines">
                  <span />
                  <span />
                  <span />
                </span>
                <span class="saas-button saas-button--buy">BUY</span>
              </article>
              <article class="saas-price-card">
                <strong>Enterprise</strong>
                <span class="saas-price-card__lines">
                  <span />
                  <span />
                </span>
                <span class="saas-button saas-button--ask">ASK</span>
              </article>
            </section>

            <section class="saas-wireframe__testimonials">
              <p>Testimonials</p>
              <div class="saas-wireframe__testimonial-row">
                <article class="saas-testimonial">
                  <span class="saas-testimonial__avatar" />
                  <span class="saas-testimonial__copy">
                    <span />
                    <span />
                    <span class="saas-testimonial__rating">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                </article>
                <article class="saas-testimonial">
                  <span class="saas-testimonial__avatar" />
                  <span class="saas-testimonial__copy">
                    <span />
                    <span />
                    <span class="saas-testimonial__rating">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                </article>
              </div>
            </section>

            <section class="saas-wireframe__deep-scroll" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </section>

            <footer class="saas-footer" aria-label="Footer links">
              <span class="saas-footer__brand" />
              <span class="saas-footer__columns">
                <span class="saas-footer__column">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span class="saas-footer__column">
                  <span />
                  <span />
                  <span class="saas-footer__link--careers" />
                  <span />
                </span>
                <span class="saas-footer__column">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </footer>
          </main>
        </div>
        <span class="route-link route-link--first" aria-hidden="true">
          <span class="route-link__segment route-link__segment--start" />
          <span class="route-link__segment route-link__segment--rise" />
          <span class="route-link__segment route-link__segment--end" />
        </span>
        <article class="route-page route-page--positions" aria-hidden="true">
          <span class="route-page__header">
            <span />
            <span />
          </span>
          <span class="route-page__title" />
          <span class="route-page__filters">
            <span />
            <span />
            <span />
          </span>
          <span class="route-page__jobs">
            <span />
            <span />
            <span />
            <span />
          </span>
        </article>
        <span class="route-link route-link--second" aria-hidden="true">
          <span class="route-link__segment route-link__segment--direct" />
        </span>
        <article class="route-page route-page--application" aria-hidden="true">
          <span class="route-page__header">
            <span />
            <span />
          </span>
          <span class="route-page__title" />
          <span class="route-page__form">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span class="route-page__submit" />
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.static-problem {
  --intent-color: var(--deck-info);
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.static-problem[data-state^="docs"] {
  --intent-color: var(--deck-warning);
}

.static-problem[data-state^="license"] {
  --intent-color: var(--deck-primary);
}

.static-problem[data-state^="stock"] {
  --intent-color: var(--deck-secondary);
}

.static-problem[data-state^="jobs"] {
  --intent-color: var(--deck-warning);
}

.static-problem__stage {
  position: relative;
  display: grid;
  place-items: center;
  width: min(30rem, 100%);
  height: 100%;
  min-height: 0;
  transition:
    width 420ms ease,
    padding 420ms ease;
}

.static-problem[data-state="jobs-routes"] {
  justify-content: center;
  align-items: stretch;
}

.static-problem[data-state="jobs-routes"] .static-problem__stage {
  width: 100%;
  padding-block-start: 4.85rem;
  place-items: stretch;
}

.visitor-intent {
  position: absolute;
  left: 0;
  top: 50%;
  z-index: 9;
  display: grid;
  grid-template-columns: 3.45rem minmax(13rem, 16rem);
  align-items: start;
  gap: 0.92rem;
  transform: translate(0, -50%);
  transition:
    top 420ms ease,
    transform 420ms ease,
    grid-template-columns 420ms ease;
}

.static-problem[data-state="jobs-routes"] .visitor-intent {
  top: 0.45rem;
  grid-template-columns: 2.72rem minmax(18rem, 25rem);
  transform: translate(0, 0);
}

.static-problem[data-state="jobs-routes"] .visitor-intent__avatar {
  width: 2.58rem;
  height: 3.25rem;
}

.static-problem[data-state="jobs-routes"] .visitor-intent__head {
  width: 1.78rem;
  height: 1.78rem;
}

.static-problem[data-state="jobs-routes"] .visitor-intent__body {
  width: 2.38rem;
  height: 1.36rem;
}

.visitor-swap-enter-active,
.visitor-swap-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.visitor-swap-enter-active {
  z-index: 10;
}

.visitor-swap-leave-active {
  z-index: 8;
}

.visitor-swap-enter-from {
  opacity: 0;
  transform: translate(-0.72rem, -46%);
}

.visitor-swap-leave-to {
  opacity: 0;
  transform: translate(0.72rem, -54%);
}

.visitor-intent__avatar {
  position: relative;
  display: grid;
  justify-items: center;
  width: 3.25rem;
  height: 4.1rem;
}

.visitor-intent__head {
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

.visitor-intent__body {
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
    var(--intent-color) 9%,
    var(--deck-surface-paper)
  );
}

.visitor-intent__quote {
  position: relative;
  display: block;
  padding: 0.68rem 0.78rem;
  border: 1.4px solid color-mix(in srgb, var(--intent-color) 34%, transparent);
  border-radius: 0.66rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 92%, transparent);
  box-shadow: 0 18px 44px rgb(16 17 20 / 0.12);
  color: var(--deck-text-primary);
  font-size: 1.02rem;
  font-weight: 720;
  line-height: 1.16;
}

.visitor-intent__quote::before {
  content: "";
  position: absolute;
  left: -0.42rem;
  top: 50%;
  width: 0.72rem;
  height: 0.72rem;
  border-left: 1.4px solid
    color-mix(in srgb, var(--intent-color) 34%, transparent);
  border-bottom: 1.4px solid
    color-mix(in srgb, var(--intent-color) 34%, transparent);
  background: inherit;
  transform: translateY(-50%) rotate(45deg);
}

.saas-wireframe {
  position: relative;
  width: auto;
  height: min(100%, 31rem);
  max-width: 100%;
  aspect-ratio: 0.72;
  border: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 16%, transparent);
  border-radius: 0.82rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 86%, transparent);
  box-shadow: 0 24px 58px rgb(16 17 20 / 0.08);
  color: var(--deck-text-primary);
  overflow: hidden;
  transition:
    height 420ms ease,
    transform 420ms ease,
    box-shadow 420ms ease;
}

.route-map {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.static-problem[data-state="jobs-routes"] .route-map {
  width: min(100%, 56.5rem);
  justify-self: center;
  grid-template-columns:
    minmax(13.1rem, 16.4rem) minmax(2.45rem, 4.2rem)
    minmax(10.8rem, 13rem) minmax(2.1rem, 3.5rem)
    minmax(10.8rem, 13rem);
  align-items: center;
  justify-content: space-between;
  gap: 0.32rem;
}

.static-problem[data-state="jobs-routes"] .saas-wireframe {
  height: min(100%, 26.2rem);
  transform: translateX(-0.25rem);
  box-shadow: 0 18px 42px rgb(16 17 20 / 0.08);
}

.saas-wireframe::before {
  content: "";
  position: absolute;
  inset: 2.55rem 0 0;
  z-index: 4;
  opacity: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 1.05rem,
    color-mix(in srgb, var(--deck-text-primary) 14%, transparent) 1.05rem
      1.24rem,
    transparent 1.24rem 1.8rem
  );
  filter: blur(2px);
  transform: translateY(-1.2rem);
}

.saas-wireframe::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--deck-surface-paper) 34%, transparent);
  backdrop-filter: blur(3.4px) saturate(0.86);
  transition: opacity 260ms ease;
}

.static-problem[data-state$="-focus"]:not([data-state="jobs-focus"])
  .saas-wireframe::after {
  opacity: 1;
}

.saas-wireframe__header {
  position: relative;
  z-index: 7;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: 0.72rem;
  height: 2.55rem;
  padding: 0 0.94rem;
  border-bottom: 1.5px solid
    color-mix(in srgb, var(--deck-text-primary) 28%, transparent);
  background: color-mix(
    in srgb,
    var(--deck-surface-paper) 98%,
    var(--deck-surface-canvas)
  );
  transition: transform 720ms cubic-bezier(0.2, 0.86, 0.2, 1);
}

.saas-wireframe__logo {
  font-family: var(--deck-font-mono);
  font-size: 0.74rem;
  font-weight: 720;
}

.saas-wireframe__nav {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.saas-nav__item {
  position: relative;
  display: block;
  width: 1.72rem;
  height: 0.36rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 15%, transparent);
}

.saas-company-menu {
  position: absolute;
  top: calc(100% + 0.58rem);
  left: 50%;
  z-index: 6;
  display: grid;
  grid-template-columns: 4rem 4.6rem 4.6rem;
  gap: 0.58rem;
  width: 14.7rem;
  padding: 0.58rem;
  border: 1px solid color-mix(in srgb, var(--deck-secondary) 24%, transparent);
  border-radius: 0.58rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 94%, transparent);
  box-shadow: 0 16px 36px rgb(16 17 20 / 0.14);
  opacity: 0;
  pointer-events: none;
  transform: translate(-64%, -0.28rem);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.saas-company-menu__image {
  display: block;
  min-height: 4.3rem;
  border-radius: 0.42rem;
  background:
    repeating-linear-gradient(
      -36deg,
      color-mix(in srgb, var(--deck-secondary) 20%, transparent) 0 1px,
      transparent 1px 5px
    ),
    color-mix(in srgb, var(--deck-secondary) 7%, var(--deck-surface-paper));
}

.saas-company-menu__column {
  display: grid;
  align-content: start;
  gap: 0.28rem;
}

.saas-company-menu__item {
  display: block;
  width: 58%;
  height: 0.28rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 13%, transparent);
}

.saas-company-menu__column .saas-company-menu__item:nth-child(2) {
  width: 42%;
}

.saas-company-menu__column .saas-company-menu__item:nth-child(4) {
  width: 52%;
}

.saas-company-menu__column .saas-company-menu__item:nth-child(5) {
  width: 36%;
}

.saas-company-menu__column .saas-company-menu__item:nth-child(7) {
  width: 46%;
}

.saas-company-menu__column .saas-company-menu__item:nth-child(3) {
  width: 68%;
}

.saas-company-menu__column .saas-company-menu__item:nth-child(6) {
  width: 62%;
}

.saas-wireframe__body {
  display: grid;
  gap: 0.78rem;
  padding: 0.95rem 0.96rem 0.9rem;
  transition: transform 720ms cubic-bezier(0.2, 0.86, 0.2, 1);
}

.static-problem[data-state="jobs-focus"] .saas-wireframe__body,
.static-problem[data-state="jobs-routes"] .saas-wireframe__body {
  transform: translate3d(0, -40.5rem, 0);
  will-change: transform;
  backface-visibility: hidden;
}

.static-problem[data-state="jobs-focus"] .saas-wireframe__header,
.static-problem[data-state="jobs-routes"] .saas-wireframe__header {
  transform: translate3d(0, -40.5rem, 0);
  will-change: transform;
  backface-visibility: hidden;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-focus"]
      .saas-wireframe__body
  ) {
  animation: saas-footer-scroll 840ms cubic-bezier(0.18, 0.78, 0.28, 1) both;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-focus"]
      .saas-wireframe__header
  ) {
  animation: saas-footer-scroll 840ms cubic-bezier(0.18, 0.78, 0.28, 1) both;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-focus"]
      .saas-wireframe::before
  ) {
  animation: saas-scroll-streaks 760ms ease-out both;
}

.saas-wireframe__hero {
  display: grid;
  grid-template-columns: 1fr 0.82fr;
  gap: 0.78rem;
  align-items: center;
}

.saas-wireframe__hero-copy {
  display: grid;
  align-content: center;
  gap: 0.34rem;
}

.saas-line {
  display: block;
  height: 0.28rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 22%, transparent);
}

.saas-line--title {
  width: 76%;
  height: 0.38rem;
  background: color-mix(in srgb, var(--deck-text-primary) 38%, transparent);
}

.saas-line--wide {
  width: 92%;
}

.saas-line--medium {
  width: 70%;
}

.saas-line--short {
  width: 48%;
}

.saas-wireframe__actions {
  display: flex;
  align-items: center;
  gap: 0.36rem;
  margin-block-start: 0.28rem;
}

.saas-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  height: 1.22rem;
  min-width: 2.68rem;
  padding-inline: 0.46rem;
  border: 1.4px solid currentColor;
  border-radius: 0.42rem;
  font-family: var(--deck-font-mono);
  font-size: 0.5rem;
  font-weight: 820;
  line-height: 1;
}

.static-problem[data-state="trial-focus"] .saas-button--try,
.static-problem[data-state="docs-focus"] .saas-nav__item--docs,
.static-problem[data-state="license-focus"] .saas-price-card--featured,
.static-problem[data-state="stock-focus"] .saas-nav__item--company,
.static-problem[data-state="stock-focus"] .saas-company-menu__item--investors,
.static-problem[data-state="jobs-focus"] .saas-footer__link--careers,
.static-problem[data-state="jobs-routes"] .saas-footer__link--careers {
  position: relative;
  z-index: 5;
}

.static-problem[data-state="trial-focus"] .saas-button--try {
  box-shadow:
    0 0 0 0.16rem color-mix(in srgb, var(--deck-info) 18%, transparent),
    0 12px 26px color-mix(in srgb, var(--deck-info) 22%, transparent);
}

.static-problem[data-state="docs-focus"] .saas-nav__item--docs {
  background: color-mix(
    in srgb,
    var(--deck-warning) 72%,
    var(--deck-surface-paper)
  );
  box-shadow:
    0 0 0 0.16rem color-mix(in srgb, var(--deck-warning) 18%, transparent),
    0 10px 22px color-mix(in srgb, var(--deck-warning) 22%, transparent);
}

.static-problem[data-state="license-focus"] .saas-price-card--featured {
  box-shadow:
    0 0 0 0.16rem color-mix(in srgb, var(--deck-primary) 16%, transparent),
    0 16px 34px color-mix(in srgb, var(--deck-primary) 20%, transparent);
}

.static-problem[data-state="stock-focus"] .saas-nav__item--company {
  background: color-mix(in srgb, var(--deck-surface-paper) 84%, transparent);
  box-shadow: 0 0 0 0.12rem
    color-mix(in srgb, var(--deck-secondary) 34%, transparent);
}

.static-problem[data-state="stock-focus"] .saas-company-menu {
  opacity: 1;
  transform: translate(-64%, 0);
}

.static-problem[data-state="stock-focus"] .saas-company-menu__item--investors {
  background: color-mix(
    in srgb,
    var(--deck-secondary) 72%,
    var(--deck-surface-paper)
  );
  box-shadow:
    0 0 0 0.16rem color-mix(in srgb, var(--deck-secondary) 18%, transparent),
    0 10px 22px color-mix(in srgb, var(--deck-secondary) 22%, transparent);
}

.static-problem[data-state="jobs-focus"] .saas-footer__link--careers,
.static-problem[data-state="jobs-routes"] .saas-footer__link--careers {
  background: color-mix(
    in srgb,
    var(--deck-warning) 72%,
    var(--deck-surface-paper)
  );
  box-shadow:
    0 0 0 0.16rem color-mix(in srgb, var(--deck-warning) 18%, transparent),
    0 10px 22px color-mix(in srgb, var(--deck-warning) 22%, transparent);
}

.saas-button--try {
  border-color: var(--deck-info);
  background: var(--deck-info);
  color: var(--deck-surface-paper);
}

.saas-button--secondary,
.saas-button--ask {
  color: var(--deck-secondary);
  background: color-mix(in srgb, var(--deck-secondary) 10%, transparent);
}

.saas-button--demo {
  color: var(--deck-info);
  background: transparent;
}

.saas-button--buy {
  color: var(--deck-primary);
  background: color-mix(in srgb, var(--deck-primary) 12%, transparent);
}

.saas-wireframe__media {
  aspect-ratio: 0.9;
  border-radius: 0.92rem;
  border: 1.5px solid
    color-mix(in srgb, var(--deck-text-primary) 18%, transparent);
  background:
    repeating-linear-gradient(
      -34deg,
      color-mix(in srgb, var(--deck-text-primary) 16%, transparent) 0 1px,
      transparent 1px 6px
    ),
    color-mix(in srgb, var(--deck-primary) 5%, transparent);
}

.saas-wireframe__logos {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 1.42rem;
  border-block: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 14%, transparent);
  color: color-mix(in srgb, var(--deck-text-primary) 68%, transparent);
  font-family: var(--deck-font-mono);
  font-size: 0.62rem;
  font-weight: 760;
}

.saas-wireframe__pricing {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.58rem;
  align-items: start;
  min-height: 7.05rem;
}

.saas-price-card {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 0.4rem;
  min-height: 5.8rem;
  padding: 0.58rem 0.5rem;
  border: 1.7px solid
    color-mix(in srgb, var(--deck-text-primary) 42%, transparent);
  border-radius: 0.88rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 70%, transparent);
}

.saas-price-card--featured {
  min-height: 6.85rem;
  border-color: color-mix(
    in srgb,
    var(--deck-primary) 46%,
    var(--deck-text-primary)
  );
}

.saas-price-card strong {
  font-size: 0.66rem;
  line-height: 1;
}

.saas-price-card__lines {
  display: grid;
  gap: 0.2rem;
  width: 100%;
}

.saas-price-card__lines span {
  display: block;
  width: 82%;
  height: 0.24rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 13%, transparent);
}

.saas-price-card__lines span:nth-child(2) {
  width: 58%;
}

.saas-price-card__lines span:nth-child(3) {
  width: 72%;
}

.saas-wireframe__testimonials {
  display: grid;
  gap: 0.44rem;
  margin-block-start: 0.08rem;
}

.saas-wireframe__testimonials p {
  margin: 0;
  color: var(--deck-text-primary);
  font-size: 0.66rem;
  font-weight: 720;
}

.saas-wireframe__testimonial-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.saas-testimonial {
  display: grid;
  grid-template-columns: 1.55rem 1fr;
  align-items: center;
  gap: 0.46rem;
  min-height: 2.78rem;
  padding: 0.42rem;
  border: 1.5px solid
    color-mix(in srgb, var(--deck-text-primary) 34%, transparent);
  background: color-mix(in srgb, var(--deck-surface-raised) 58%, transparent);
}

.saas-testimonial__avatar {
  display: block;
  width: 1.42rem;
  height: 1.42rem;
  border: 1.4px solid
    color-mix(in srgb, var(--deck-text-primary) 42%, transparent);
  border-radius: 999px;
}

.saas-testimonial__copy {
  display: grid;
  gap: 0.22rem;
}

.saas-testimonial__copy > span:not(.saas-testimonial__rating) {
  display: block;
  height: 0.22rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 14%, transparent);
}

.saas-testimonial__copy span:nth-child(2) {
  width: 68%;
}

.saas-testimonial__rating {
  display: flex;
  gap: 0.16rem;
}

.saas-testimonial__rating i {
  display: block;
  width: 0.26rem;
  height: 0.26rem;
  border-radius: 999px;
  background: var(--deck-warning);
}

.saas-wireframe__deep-scroll {
  display: grid;
  gap: 1.35rem;
  min-height: 30rem;
  align-content: center;
}

.saas-wireframe__deep-scroll span {
  display: block;
  height: 3.2rem;
  border-radius: 0.82rem;
  border: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--deck-text-primary) 8%, transparent),
      transparent 64%
    ),
    color-mix(in srgb, var(--deck-text-primary) 4%, transparent);
}

.saas-wireframe__deep-scroll span:nth-child(2) {
  width: 76%;
  justify-self: end;
}

.saas-wireframe__deep-scroll span:nth-child(3) {
  width: 88%;
}

.saas-wireframe__deep-scroll span:nth-child(4) {
  width: 64%;
  justify-self: center;
}

.saas-footer {
  display: grid;
  gap: 0.82rem;
  min-height: 7.8rem;
  padding: 0.9rem;
  border-top: 1.6px solid
    color-mix(in srgb, var(--deck-text-primary) 28%, transparent);
  background: color-mix(in srgb, var(--deck-surface-panel) 64%, transparent);
}

.saas-footer__brand {
  display: block;
  width: 4.6rem;
  height: 0.42rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 32%, transparent);
}

.saas-footer__columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}

.saas-footer__column {
  display: grid;
  align-content: start;
  gap: 0.3rem;
}

.saas-footer__column span {
  display: block;
  width: 72%;
  height: 0.3rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 14%, transparent);
}

.saas-footer__column span:nth-child(2) {
  width: 54%;
}

.saas-footer__column span:nth-child(3) {
  width: 64%;
}

.saas-footer__column span:nth-child(4) {
  width: 48%;
}

.route-link {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 19.4rem;
  opacity: 0;
  pointer-events: none;
  transform: translateX(1.5rem) scale(0.98);
  transition:
    opacity 260ms ease 160ms,
    transform 420ms ease;
}

.route-link__segment {
  position: absolute;
  display: block;
  border-color: var(--deck-warning);
  filter: drop-shadow(
    0 4px 8px color-mix(in srgb, var(--deck-warning) 24%, transparent)
  );
}

.static-problem[data-state="jobs-routes"] .route-link {
  position: relative;
  opacity: 1;
  transform: translateX(0) scale(1);
}

.route-link__segment--start {
  left: -0.02rem;
  top: 70%;
  width: 55%;
  border-top: 2px solid var(--deck-warning);
}

.route-link__segment--rise {
  left: 55%;
  top: 38%;
  height: 32%;
  border-left: 2px solid var(--deck-warning);
}

.route-link__segment--end {
  left: 55%;
  top: 38%;
  width: 45%;
  border-top: 2px solid var(--deck-warning);
}

.route-link__segment--direct {
  left: 0;
  top: 42%;
  width: 100%;
  border-top: 2px solid var(--deck-warning);
}

.route-page {
  position: absolute;
  z-index: 2;
  display: grid;
  align-content: start;
  gap: 0.68rem;
  width: 100%;
  min-height: 19.4rem;
  padding: 0.78rem;
  border: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 14%, transparent);
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 84%, transparent);
  box-shadow: 0 18px 42px rgb(16 17 20 / 0.08);
  opacity: 0;
  transform: translateX(1.5rem) scale(0.98);
  transition:
    opacity 320ms ease,
    transform 420ms ease;
}

.static-problem[data-state="jobs-routes"] .route-page {
  position: relative;
  opacity: 1;
  transform: translateX(0) scale(1);
}

.static-problem[data-state="jobs-routes"] .route-page--application {
  transition-delay: 140ms;
}

.route-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.75rem;
  padding-block-end: 0.48rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--deck-text-primary) 12%, transparent);
}

.route-page__header span:first-child {
  display: block;
  width: 2.75rem;
  height: 0.34rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 30%, transparent);
}

.route-page__header span:last-child {
  display: block;
  width: 1.72rem;
  height: 0.78rem;
  border-radius: 0.3rem;
  background: color-mix(in srgb, var(--deck-warning) 20%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-warning) 34%, transparent);
}

.route-page__title {
  display: block;
  width: 62%;
  height: 0.48rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 36%, transparent);
}

.route-page__filters {
  display: flex;
  gap: 0.36rem;
}

.route-page__filters span {
  display: block;
  width: 2.1rem;
  height: 0.78rem;
  border-radius: 0.32rem;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-text-primary) 12%, transparent);
}

.route-page__filters span:nth-child(2) {
  width: 2.7rem;
}

.route-page__jobs {
  display: grid;
  gap: 0.48rem;
  margin-block-start: 0.1rem;
}

.route-page__jobs span {
  display: block;
  height: 2.35rem;
  border-radius: 0.48rem;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--deck-text-primary) 18%, transparent) 0 42%,
      transparent 42%
    ),
    color-mix(in srgb, var(--deck-text-primary) 5%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
}

.route-page__form {
  display: grid;
  gap: 0.52rem;
}

.route-page__form span {
  display: block;
  height: 1.55rem;
  border-radius: 0.42rem;
  background: color-mix(in srgb, var(--deck-text-primary) 5%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-text-primary) 14%, transparent);
}

.route-page__form span:last-child {
  height: 3.2rem;
}

.route-page__submit {
  display: block;
  width: 4.1rem;
  height: 1.02rem;
  margin-block-start: 0.18rem;
  border-radius: 0.38rem;
  background: color-mix(in srgb, var(--deck-warning) 22%, transparent);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--deck-warning) 36%, transparent);
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-routes"]
      .route-link__segment
  ) {
  transform-origin: left center;
  animation: route-line-draw 380ms ease-out both;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-routes"]
      .route-link__segment--start
  ) {
  animation-delay: 220ms;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-routes"]
      .route-link__segment--rise
  ) {
  transform-origin: center bottom;
  animation-name: route-line-rise;
  animation-delay: 520ms;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-routes"]
      .route-link__segment--end
  ) {
  animation-delay: 780ms;
}

:global(
    html:not(.reduced-motion) .static-problem[data-state="jobs-routes"]
      .route-link__segment--direct
  ) {
  animation-delay: 980ms;
}

@media (max-width: 820px) {
  .static-problem {
    justify-content: center;
  }

  .static-problem__stage {
    height: 100%;
  }

  .saas-wireframe {
    height: min(100%, 28rem);
  }

  .static-problem[data-state="jobs-routes"] .route-map {
    gap: 0.7rem;
    grid-template-columns:
      minmax(10.2rem, 1fr) minmax(1.65rem, 0.24fr)
      minmax(8.4rem, 0.84fr) minmax(1.4rem, 0.2fr)
      minmax(8.4rem, 0.84fr);
  }

  .route-page {
    min-height: 17.8rem;
    padding: 0.62rem;
  }

  .route-link {
    height: 17.8rem;
  }
}

:global(.reduced-motion .static-problem *),
:global(.reduced-motion .static-problem *::before),
:global(.reduced-motion .static-problem *::after) {
  transition: none !important;
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .static-problem *,
  .static-problem *::before,
  .static-problem *::after {
    transition: none !important;
    animation: none !important;
  }
}

@keyframes saas-footer-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, -40.5rem, 0);
  }
}

@keyframes saas-scroll-streaks {
  0% {
    opacity: 0;
    transform: translate3d(0, -1.4rem, 0);
  }
  24%,
  68% {
    opacity: 0.42;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 1.2rem, 0);
  }
}

@keyframes route-line-draw {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes route-line-rise {
  0% {
    transform: scaleY(0);
  }
  100% {
    transform: scaleY(1);
  }
}
</style>
