<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  compact?: boolean;
  click?: number;
}>();

const states = ["idle", "intent", "compose", "match", "action"] as const;
const state = computed(() => states[Math.min(props.click ?? 0, states.length - 1)]);
</script>

<template>
  <figure
    class="self-ui"
    :class="{ 'self-ui--compact': compact }"
    :data-state="state"
    aria-label="A prompt input becoming a task-specific interface"
  >
    <span class="self-ui__stage">
      <span class="self-ui__field" aria-hidden="true">
        <span class="self-ui__field-line self-ui__field-line--one" />
        <span class="self-ui__field-line self-ui__field-line--two" />
        <span class="self-ui__field-line self-ui__field-line--three" />
      </span>

      <span class="self-ui__surface" aria-hidden="true">
        <span class="self-ui__card">
          <span class="self-ui__card-top">
            <span class="self-ui__mark" />
            <span class="self-ui__copy self-ui__copy--wide" />
          </span>
          <span class="self-ui__copy self-ui__copy--medium" />
          <span class="self-ui__choices">
            <span class="self-ui__choice self-ui__choice--selected">
              <span />
              <span />
            </span>
            <span class="self-ui__choice">
              <span />
              <span />
            </span>
          </span>
          <span class="self-ui__card-action" />
        </span>

        <span class="self-ui__form">
          <span class="self-ui__form-summary">
            <span class="self-ui__mark" />
            <span>
              <span class="self-ui__copy self-ui__copy--wide" />
              <span class="self-ui__copy self-ui__copy--short" />
            </span>
          </span>
          <span class="self-ui__field-row">
            <span />
            <span />
          </span>
          <span class="self-ui__field-row self-ui__field-row--split">
            <span />
            <span />
          </span>
          <span class="self-ui__actions">
            <span class="self-ui__ghost-action" />
            <span class="self-ui__primary-action">Update</span>
          </span>
        </span>
      </span>

      <span class="self-ui__prompt">
        <span class="self-ui__prompt-text">
          <span class="self-ui__placeholder" aria-hidden="true" />
          <span class="self-ui__intent">I want to...</span>
          <span class="self-ui__caret" aria-hidden="true" />
        </span>
        <span class="self-ui__prompt-action" aria-hidden="true">
          <span />
        </span>
      </span>
    </span>
  </figure>
</template>

<style scoped>
.self-ui {
  --self-ui-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --self-ui-panel: color-mix(in srgb, var(--deck-surface-paper) 82%, transparent);
  --self-ui-panel-solid: color-mix(in srgb, var(--deck-surface-paper) 94%, var(--deck-surface-canvas));
  --self-ui-line: color-mix(in srgb, var(--deck-text-primary) 18%, transparent);
  --self-ui-line-strong: color-mix(in srgb, var(--deck-text-primary) 28%, transparent);
  --self-ui-primary-soft: color-mix(in srgb, var(--deck-primary) 18%, transparent);
  --self-ui-secondary-soft: color-mix(in srgb, var(--deck-secondary) 12%, transparent);
  --self-ui-shadow: 0 1.3rem 3.4rem rgb(0 0 0 / 0.12);

  display: block;
  width: min(100%, 38rem);
  margin: 0;
  padding: 0;
  color: inherit;
}

.self-ui--compact {
  width: min(100%, 30rem);
}

.self-ui__stage {
  position: relative;
  display: block;
  height: 20rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 1.4rem;
  background: transparent;
  isolation: isolate;
  transition:
    background 800ms var(--self-ui-ease),
    border-color 800ms var(--self-ui-ease),
    box-shadow 800ms var(--self-ui-ease);
}

.self-ui[data-state="compose"] .self-ui__stage,
.self-ui[data-state="match"] .self-ui__stage,
.self-ui[data-state="action"] .self-ui__stage {
  border-color: transparent;
  background: transparent;
}

.self-ui__field {
  position: absolute;
  inset: 1.45rem 1.15rem 4.15rem;
  z-index: 0;
  border-radius: 1.2rem;
  opacity: 0;
  transform: translateY(1.1rem) scale(0.98);
  transition:
    opacity 700ms var(--self-ui-ease),
    transform 900ms var(--self-ui-ease);
}

.self-ui__field::before {
  position: absolute;
  inset: -30% -96%;
  content: "";
  background: linear-gradient(
    128deg,
    transparent 28%,
    color-mix(in srgb, var(--deck-primary) 14%, transparent) 46%,
    color-mix(in srgb, var(--deck-secondary) 9%, transparent) 52%,
    transparent 70%
  );
  filter: blur(0.2px);
  transform: translateX(-24%);
  opacity: 0;
}

.self-ui__field-line {
  position: absolute;
  display: block;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--deck-primary) 32%, transparent),
    transparent
  );
  opacity: 0.48;
}

.self-ui__field-line--one {
  left: 9%;
  right: 18%;
  top: 26%;
  transform: rotate(-16deg);
}

.self-ui__field-line--two {
  left: 17%;
  right: 12%;
  top: 48%;
  transform: rotate(-16deg);
}

.self-ui__field-line--three {
  left: 25%;
  right: 28%;
  top: 70%;
  transform: rotate(-16deg);
}

.self-ui[data-state="compose"] .self-ui__field,
.self-ui[data-state="match"] .self-ui__field,
.self-ui[data-state="action"] .self-ui__field {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.self-ui[data-state="compose"] .self-ui__field::before {
  opacity: 1;
  animation: self-ui-scan 1400ms var(--self-ui-ease) both;
}

.self-ui__surface {
  position: absolute;
  inset: 1.25rem 1.2rem 4.75rem;
  z-index: 1;
}

.self-ui__card,
.self-ui__form {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  flex-direction: column;
  width: min(100%, 23.5rem);
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 12%, transparent);
  border-radius: 0.85rem;
  background: var(--self-ui-panel);
  box-shadow: var(--self-ui-shadow);
  backdrop-filter: blur(16px);
  opacity: 0;
  transform: translate(-50%, -42%) scale(0.72);
  transform-origin: center;
  transition:
    opacity 540ms var(--self-ui-ease),
    transform 740ms var(--self-ui-ease);
}

.self-ui__card {
  gap: 0.75rem;
  padding: 1rem;
}

.self-ui[data-state="match"] .self-ui__card {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition-delay: 80ms;
}

.self-ui[data-state="action"] .self-ui__card {
  opacity: 0;
  transform: translate(-50%, -55%) scale(0.92);
}

.self-ui__form {
  gap: 0.72rem;
  padding: 0.95rem;
  transform: translate(-50%, -45%) scale(0.8);
}

.self-ui[data-state="action"] .self-ui__form {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  transition-delay: 80ms;
}

.self-ui__card-top,
.self-ui__form-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.72rem;
}

.self-ui__form-summary > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.self-ui__mark {
  display: block;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.55rem;
  background:
    linear-gradient(var(--self-ui-primary-soft), var(--self-ui-primary-soft)),
    var(--self-ui-panel-solid);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--deck-primary) 24%, transparent);
}

.self-ui__copy {
  display: block;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--self-ui-line);
}

.self-ui__copy--wide {
  width: 76%;
}

.self-ui__copy--medium {
  width: 54%;
}

.self-ui__copy--short {
  width: 36%;
}

.self-ui__choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.self-ui__choice {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  min-height: 3.4rem;
  padding: 0.65rem;
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 72%, transparent);
}

.self-ui__choice--selected {
  border-color: color-mix(in srgb, var(--deck-primary) 42%, transparent);
  background: color-mix(in srgb, var(--deck-primary) 8%, var(--deck-surface-paper));
}

.self-ui__choice span {
  display: block;
  height: 0.38rem;
  border-radius: 999px;
  background: var(--self-ui-line);
}

.self-ui__choice span:first-child {
  width: 72%;
  background: var(--self-ui-line-strong);
}

.self-ui__choice span:last-child {
  width: 46%;
}

.self-ui__card-action {
  align-self: flex-end;
  display: block;
  width: 4.8rem;
  height: 1.55rem;
  border-radius: 999px;
  background: var(--self-ui-primary-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--deck-primary) 32%, transparent);
}

.self-ui__field-row {
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  gap: 0.55rem;
  padding: 0.62rem;
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  border-radius: 0.62rem;
  background: color-mix(in srgb, var(--deck-surface-paper) 76%, transparent);
}

.self-ui__field-row--split {
  grid-template-columns: 1fr 1fr;
}

.self-ui__field-row span {
  display: block;
  height: 0.44rem;
  border-radius: 999px;
  background: var(--self-ui-line);
}

.self-ui__field-row span:first-child {
  background: var(--self-ui-line-strong);
}

.self-ui__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.15rem;
}

.self-ui__ghost-action,
.self-ui__primary-action {
  display: block;
  width: 4.75rem;
  height: 1.65rem;
  border-radius: 999px;
}

.self-ui__ghost-action {
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 13%, transparent);
  background: color-mix(in srgb, var(--deck-surface-paper) 50%, transparent);
}

.self-ui__primary-action {
  display: grid;
  place-items: center;
  width: 4.9rem;
  background: var(--deck-primary);
  color: var(--deck-on-primary);
  font-size: 0.66rem;
  font-weight: 720;
  line-height: 1;
}

.self-ui__prompt {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  width: 27rem;
  max-width: calc(100% - 2.6rem);
  min-height: 3.45rem;
  padding: 0.7rem 0.72rem 0.7rem 1.15rem;
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 16%, transparent);
  border-radius: 999px;
  background: var(--self-ui-panel);
  box-shadow:
    0 1rem 2.8rem rgb(0 0 0 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.2);
  backdrop-filter: blur(18px);
  transform: translate(-50%, -50%);
  transition:
    top 840ms var(--self-ui-ease),
    width 840ms var(--self-ui-ease),
    min-height 840ms var(--self-ui-ease),
    padding 840ms var(--self-ui-ease),
    box-shadow 840ms var(--self-ui-ease),
    transform 840ms var(--self-ui-ease);
}

.self-ui[data-state="compose"] .self-ui__prompt,
.self-ui[data-state="match"] .self-ui__prompt,
.self-ui[data-state="action"] .self-ui__prompt {
  top: 82%;
  width: 20.5rem;
  min-height: 2.75rem;
  padding: 0.48rem 0.5rem 0.48rem 0.86rem;
  box-shadow:
    0 0.75rem 2rem rgb(0 0 0 / 0.11),
    inset 0 1px 0 rgb(255 255 255 / 0.18);
}

.self-ui__prompt-text {
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--deck-text-primary);
  font-size: 0.88rem;
  font-weight: 620;
  line-height: 1.2;
  white-space: nowrap;
}

.self-ui[data-state="compose"] .self-ui__prompt-text,
.self-ui[data-state="match"] .self-ui__prompt-text,
.self-ui[data-state="action"] .self-ui__prompt-text {
  font-size: 0.76rem;
}

.self-ui__placeholder,
.self-ui__intent {
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    opacity 240ms ease,
    max-width 680ms steps(12, end);
}

.self-ui__placeholder {
  max-width: 12rem;
  color: var(--deck-text-muted);
  opacity: 1;
}

.self-ui[data-state="intent"] .self-ui__placeholder,
.self-ui[data-state="compose"] .self-ui__placeholder,
.self-ui[data-state="match"] .self-ui__placeholder,
.self-ui[data-state="action"] .self-ui__placeholder {
  max-width: 0;
  opacity: 0;
}

.self-ui__intent {
  max-width: 0;
  opacity: 0;
}

.self-ui[data-state="intent"] .self-ui__intent,
.self-ui[data-state="compose"] .self-ui__intent,
.self-ui[data-state="match"] .self-ui__intent,
.self-ui[data-state="action"] .self-ui__intent {
  max-width: 6.5rem;
  opacity: 1;
}

.self-ui__caret {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-inline-start: 0.16rem;
  border-radius: 999px;
  background: var(--deck-primary);
  animation: self-ui-caret 980ms steps(2, start) infinite;
}

.self-ui__prompt-action {
  position: relative;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  margin-inline-start: 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--deck-text-primary) 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--deck-text-primary) 10%, transparent);
  transition:
    background 300ms ease,
    box-shadow 300ms ease,
    transform 360ms var(--self-ui-ease);
}

.self-ui__prompt-action span {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-block-start: 2px solid currentColor;
  border-inline-end: 2px solid currentColor;
  color: var(--deck-text-muted);
  transform: translateX(-1px) rotate(45deg);
  transition:
    color 300ms ease,
    transform 360ms var(--self-ui-ease);
}

.self-ui[data-state="intent"] .self-ui__prompt-action,
.self-ui[data-state="compose"] .self-ui__prompt-action,
.self-ui[data-state="match"] .self-ui__prompt-action,
.self-ui[data-state="action"] .self-ui__prompt-action {
  background: var(--deck-primary);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
}

.self-ui[data-state="intent"] .self-ui__prompt-action span,
.self-ui[data-state="compose"] .self-ui__prompt-action span,
.self-ui[data-state="match"] .self-ui__prompt-action span,
.self-ui[data-state="action"] .self-ui__prompt-action span {
  color: var(--deck-on-primary);
}

.self-ui[data-state="compose"] .self-ui__prompt-action {
  animation: self-ui-send 560ms var(--self-ui-ease) both;
}

.self-ui[data-state="compose"] .self-ui__prompt-action::after {
  position: absolute;
  inset: -0.55rem;
  content: "";
  border: 1px solid color-mix(in srgb, var(--deck-primary) 34%, transparent);
  border-radius: inherit;
  animation: self-ui-pulse 760ms var(--self-ui-ease) both;
}

@keyframes self-ui-caret {
  0%,
  46% {
    opacity: 1;
  }

  47%,
  100% {
    opacity: 0;
  }
}

@keyframes self-ui-send {
  0%,
  100% {
    transform: scale(1);
  }

  42% {
    transform: scale(0.88);
  }

  68% {
    transform: scale(1.06);
  }
}

@keyframes self-ui-pulse {
  0% {
    opacity: 0.48;
    transform: scale(0.72);
  }

  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@keyframes self-ui-scan {
  0% {
    transform: translateX(-24%);
  }

  100% {
    transform: translateX(24%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .self-ui *,
  .self-ui *::before,
  .self-ui *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
</style>
