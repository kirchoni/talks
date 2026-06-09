<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  autoplay?: boolean;
  playOnce?: boolean;
  compact?: boolean;
  click?: number;
  timingScale?: number;
}>();

const clickStates = ["idle", "intent", "dock", "bands", "split"] as const;
const loopStates = [
  { name: "idle", duration: 1400 },
  { name: "intent", duration: 900 },
  { name: "dock", duration: 1100 },
  { name: "surface", duration: 1400 },
  { name: "bands", duration: 1600 },
  { name: "split", duration: 1800 },
  { name: "splitHold", duration: 2200 },
  { name: "reset", duration: 1200 },
] as const;

const loopIndex = ref(0);
const playing = ref(false);
const timingScale = computed(() => Math.max(props.timingScale ?? 1, 0.2));
const isAutoplayMode = computed(() => props.autoplay || props.playOnce);

const state = computed(() => {
  if (isAutoplayMode.value) {
    return loopStates[loopIndex.value].name;
  }

  return clickStates[Math.min(props.click ?? 0, clickStates.length - 1)];
});
const styleVars = computed(() => {
  const scale = timingScale.value;
  const ms = (value: number) => `${Math.round(value * scale)}ms`;

  return {
    "--abstract-ui-stage-duration": ms(1100),
    "--abstract-ui-opacity-duration": ms(1100),
    "--abstract-ui-block-duration": ms(1600),
    "--abstract-ui-piece-duration": ms(1700),
    "--abstract-ui-piece-opacity-duration": ms(1200),
    "--abstract-ui-prompt-duration": ms(1300),
    "--abstract-ui-type-duration": ms(900),
    "--abstract-ui-current-duration": ms(5200),
  };
});

let timer: ReturnType<typeof window.setTimeout> | undefined;

const scheduleNextState = () => {
  if (!playing.value && !props.autoplay) {
    return;
  }

  const currentState = loopStates[loopIndex.value];
  timer = window.setTimeout(() => {
    const nextIndex = loopIndex.value + 1;

    if (props.playOnce && nextIndex >= loopStates.length - 1) {
      playing.value = false;
      return;
    }

    loopIndex.value = nextIndex % loopStates.length;
    scheduleNextState();
  }, currentState.duration * timingScale.value);
};

if (props.playOnce) {
  watch(
    () => props.click,
    (curr, prev) => {
      if (!playing.value && (curr ?? 0) > (prev ?? 0)) {
        playing.value = true;
        loopIndex.value = 1;
        scheduleNextState();
      }
    }
  );
}

onMounted(() => {
  if (props.autoplay) {
    playing.value = true;
    scheduleNextState();
  }
});
onBeforeUnmount(() => {
  if (timer) {
    window.clearTimeout(timer);
  }
});
</script>

<template>
  <figure
    class="abstract-ui"
    :class="{ 'abstract-ui--compact': compact }"
    :data-state="state"
    :style="styleVars"
    aria-label="An abstract prompt-generated interface that expands and recombines"
  >
    <span class="abstract-ui__stage">
      <span class="abstract-ui__current" aria-hidden="true">
        <span class="abstract-ui__current-line abstract-ui__current-line--one" />
        <span class="abstract-ui__current-line abstract-ui__current-line--two" />
        <span class="abstract-ui__current-line abstract-ui__current-line--three" />
      </span>

      <span class="abstract-ui__block" aria-hidden="true">
        <span class="abstract-ui__piece abstract-ui__piece--header" />
        <span class="abstract-ui__piece abstract-ui__piece--nav" />
        <span class="abstract-ui__piece abstract-ui__piece--main" />
        <span class="abstract-ui__piece abstract-ui__piece--rail" />
        <span class="abstract-ui__piece abstract-ui__piece--footer" />
      </span>

      <span class="abstract-ui__prompt">
        <span class="abstract-ui__prompt-text">
          <span class="abstract-ui__intent">I want to...</span>
          <span class="abstract-ui__caret" aria-hidden="true" />
        </span>
        <span class="abstract-ui__prompt-action" aria-hidden="true">
          <span />
        </span>
      </span>
    </span>
  </figure>
</template>

<style scoped>
.abstract-ui {
  --abstract-ui-ease: cubic-bezier(0.2, 0.82, 0.18, 1);
  --abstract-ui-panel: color-mix(in srgb, var(--deck-surface-paper) 80%, transparent);
  --abstract-ui-block: color-mix(in srgb, var(--deck-primary) 4%, transparent);
  --abstract-ui-block-strong: color-mix(in srgb, var(--deck-primary) 6%, transparent);
  --abstract-ui-mask-gradient: linear-gradient(
    128deg,
    color-mix(in srgb, var(--deck-primary) 9%, transparent) 15%,
    color-mix(in srgb, var(--deck-primary) 34%, transparent) 38%,
    color-mix(in srgb, var(--deck-secondary) 34%, transparent) 58%,
    color-mix(in srgb, var(--deck-primary) 13%, transparent) 86%
  );
  --abstract-ui-line: color-mix(in srgb, var(--deck-primary) 32%, transparent);

  display: block;
  width: min(100%, 38rem);
  margin: 0;
  padding: 0;
  color: inherit;
}

.abstract-ui--compact {
  width: min(100%, 30rem);
}

.abstract-ui__stage {
  position: relative;
  display: block;
  height: 20rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 1.4rem;
  background: transparent;
  isolation: isolate;
  transition:
    border-color var(--abstract-ui-stage-duration) var(--abstract-ui-ease),
    background var(--abstract-ui-stage-duration) var(--abstract-ui-ease);
}

.abstract-ui[data-state="dock"] .abstract-ui__stage,
.abstract-ui[data-state="surface"] .abstract-ui__stage,
.abstract-ui[data-state="bands"] .abstract-ui__stage,
.abstract-ui[data-state="split"] .abstract-ui__stage,
.abstract-ui[data-state="splitHold"] .abstract-ui__stage,
.abstract-ui[data-state="return"] .abstract-ui__stage,
.abstract-ui[data-state="returnHold"] .abstract-ui__stage {
  border-color: transparent;
  background: transparent;
}

.abstract-ui__current {
  position: absolute;
  inset: 1.2rem 1.1rem 4.2rem;
  z-index: 0;
  overflow: hidden;
  border-radius: 1.15rem;
  opacity: 0;
  transition: opacity var(--abstract-ui-opacity-duration) var(--abstract-ui-ease);
}

.abstract-ui__current::before {
  position: absolute;
  inset: -26% -92%;
  content: "";
  background: var(--abstract-ui-mask-gradient);
  transform: translateX(-24%);
  opacity: 0;
  transition: opacity var(--abstract-ui-opacity-duration) var(--abstract-ui-ease);
}

.abstract-ui__current-line {
  position: absolute;
  display: block;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--abstract-ui-line), transparent);
  opacity: 0;
}

.abstract-ui__current-line--one {
  left: 13%;
  right: 23%;
  top: 26%;
  transform: rotate(-15deg);
}

.abstract-ui__current-line--two {
  left: 19%;
  right: 13%;
  top: 50%;
  transform: rotate(-15deg);
}

.abstract-ui__current-line--three {
  left: 29%;
  right: 28%;
  top: 72%;
  transform: rotate(-15deg);
}

.abstract-ui[data-state="dock"] .abstract-ui__current,
.abstract-ui[data-state="surface"] .abstract-ui__current,
.abstract-ui[data-state="bands"] .abstract-ui__current,
.abstract-ui[data-state="split"] .abstract-ui__current,
.abstract-ui[data-state="splitHold"] .abstract-ui__current,
.abstract-ui[data-state="return"] .abstract-ui__current,
.abstract-ui[data-state="returnHold"] .abstract-ui__current {
  opacity: 1;
}

.abstract-ui[data-state="dock"] .abstract-ui__current::before,
.abstract-ui[data-state="surface"] .abstract-ui__current::before,
.abstract-ui[data-state="bands"] .abstract-ui__current::before,
.abstract-ui[data-state="split"] .abstract-ui__current::before,
.abstract-ui[data-state="splitHold"] .abstract-ui__current::before,
.abstract-ui[data-state="return"] .abstract-ui__current::before,
.abstract-ui[data-state="returnHold"] .abstract-ui__current::before {
  opacity: 0;
  animation: abstract-ui-scan var(--abstract-ui-current-duration) ease-in-out infinite alternate;
}

.abstract-ui__block {
  position: absolute;
  left: 50%;
  top: 44%;
  z-index: 1;
  display: block;
  width: 21.4rem;
  height: 12.8rem;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.72);
  transition:
    opacity var(--abstract-ui-opacity-duration) var(--abstract-ui-ease),
    transform var(--abstract-ui-block-duration) var(--abstract-ui-ease);
}

.abstract-ui[data-state="dock"] .abstract-ui__block,
.abstract-ui[data-state="surface"] .abstract-ui__block,
.abstract-ui[data-state="return"] .abstract-ui__block,
.abstract-ui[data-state="returnHold"] .abstract-ui__block {
  opacity: 1;
  transform: translate(-50%, -50%) scale(0.88);
}

.abstract-ui[data-state="bands"] .abstract-ui__block,
.abstract-ui[data-state="split"] .abstract-ui__block,
.abstract-ui[data-state="splitHold"] .abstract-ui__block {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.abstract-ui[data-state="reset"] .abstract-ui__block {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1);
}

.abstract-ui__piece {
  position: absolute;
  display: block;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--deck-text-primary) 11%, transparent);
  border-radius: 0.7rem;
  background: var(--abstract-ui-block);
  box-shadow: 0 1rem 2.6rem rgb(0 0 0 / 0.09);
  transition:
    left var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    top var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    width var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    height var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    border-radius var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    background var(--abstract-ui-piece-duration) var(--abstract-ui-ease),
    opacity var(--abstract-ui-piece-opacity-duration) var(--abstract-ui-ease),
    transform var(--abstract-ui-piece-duration) var(--abstract-ui-ease);
}

.abstract-ui__piece::before {
  position: absolute;
  inset: -55% -130%;
  z-index: -1;
  content: "";
  background: var(--abstract-ui-mask-gradient);
  opacity: 0.86;
  transform: translateX(-24%);
  animation: abstract-ui-scan var(--abstract-ui-current-duration) ease-in-out infinite alternate;
}

.abstract-ui__piece--header,
.abstract-ui__piece--nav,
.abstract-ui__piece--main,
.abstract-ui__piece--rail,
.abstract-ui__piece--footer {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  opacity: 0;
}

.abstract-ui__piece--main {
  background: var(--abstract-ui-block-strong);
  opacity: 0.94;
}

.abstract-ui[data-state="bands"] .abstract-ui__piece--header {
  left: 4%;
  top: 6%;
  width: 92%;
  height: 22%;
  border-radius: 0.78rem;
  opacity: 0.94;
  transform: translateY(-0.08rem);
}

.abstract-ui[data-state="bands"] .abstract-ui__piece--nav {
  left: 24%;
  top: 38%;
  width: 52%;
  height: 42%;
  opacity: 0;
  transform: scale(0.94);
}

.abstract-ui[data-state="bands"] .abstract-ui__piece--main {
  left: 4%;
  top: 38%;
  width: 92%;
  height: 42%;
  border-radius: 0.78rem;
}

.abstract-ui[data-state="bands"] .abstract-ui__piece--rail {
  left: 24%;
  top: 38%;
  width: 52%;
  height: 42%;
  opacity: 0;
  transform: scale(0.94);
}

.abstract-ui[data-state="bands"] .abstract-ui__piece--footer {
  left: 4%;
  top: 86%;
  width: 92%;
  height: 10%;
  border-radius: 0.78rem;
  opacity: 0.94;
}

.abstract-ui[data-state="split"] .abstract-ui__piece--header,
.abstract-ui[data-state="splitHold"] .abstract-ui__piece--header,
.abstract-ui[data-state="reset"] .abstract-ui__piece--header {
  left: 8%;
  top: 3%;
  width: 64%;
  height: 18%;
  border-radius: 0.62rem;
  opacity: 0.94;
  transform: translateY(-0.15rem);
}

.abstract-ui[data-state="split"] .abstract-ui__piece--nav,
.abstract-ui[data-state="splitHold"] .abstract-ui__piece--nav,
.abstract-ui[data-state="reset"] .abstract-ui__piece--nav {
  left: 8%;
  top: 29%;
  width: 16%;
  height: 48%;
  border-radius: 0.62rem;
  opacity: 0.94;
  transform: translateX(-0.18rem);
}

.abstract-ui[data-state="split"] .abstract-ui__piece--main,
.abstract-ui[data-state="splitHold"] .abstract-ui__piece--main,
.abstract-ui[data-state="reset"] .abstract-ui__piece--main {
  left: 30%;
  top: 29%;
  width: 42%;
  height: 48%;
  border-radius: 0.62rem;
  opacity: 0.94;
}

.abstract-ui[data-state="split"] .abstract-ui__piece--rail,
.abstract-ui[data-state="splitHold"] .abstract-ui__piece--rail,
.abstract-ui[data-state="reset"] .abstract-ui__piece--rail {
  left: 78%;
  top: 12%;
  width: 16%;
  height: 65%;
  border-radius: 0.62rem;
  opacity: 0.94;
  transform: translateX(0.18rem);
}

.abstract-ui[data-state="split"] .abstract-ui__piece--footer,
.abstract-ui[data-state="splitHold"] .abstract-ui__piece--footer,
.abstract-ui[data-state="reset"] .abstract-ui__piece--footer {
  left: 8%;
  top: 84%;
  width: 64%;
  height: 13%;
  border-radius: 0.62rem;
  opacity: 0.94;
  transform: translateY(0.12rem);
}

.abstract-ui[data-state="return"] .abstract-ui__piece--header,
.abstract-ui[data-state="returnHold"] .abstract-ui__piece--header,
.abstract-ui[data-state="return"] .abstract-ui__piece--nav,
.abstract-ui[data-state="returnHold"] .abstract-ui__piece--nav,
.abstract-ui[data-state="return"] .abstract-ui__piece--rail,
.abstract-ui[data-state="returnHold"] .abstract-ui__piece--rail,
.abstract-ui[data-state="return"] .abstract-ui__piece--footer,
.abstract-ui[data-state="returnHold"] .abstract-ui__piece--footer {
  opacity: 0;
  transform: scale(0.985);
}

.abstract-ui__prompt {
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
  background: var(--abstract-ui-panel);
  box-shadow:
    0 1rem 2.8rem rgb(0 0 0 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.2);
  backdrop-filter: blur(18px);
  transform: translate(-50%, -50%);
  transition:
    top var(--abstract-ui-prompt-duration) var(--abstract-ui-ease),
    width var(--abstract-ui-prompt-duration) var(--abstract-ui-ease),
    min-height var(--abstract-ui-prompt-duration) var(--abstract-ui-ease),
    padding var(--abstract-ui-prompt-duration) var(--abstract-ui-ease),
    box-shadow var(--abstract-ui-prompt-duration) var(--abstract-ui-ease);
}

.abstract-ui[data-state="dock"] .abstract-ui__prompt,
.abstract-ui[data-state="surface"] .abstract-ui__prompt,
.abstract-ui[data-state="bands"] .abstract-ui__prompt,
.abstract-ui[data-state="split"] .abstract-ui__prompt,
.abstract-ui[data-state="splitHold"] .abstract-ui__prompt,
.abstract-ui[data-state="return"] .abstract-ui__prompt,
.abstract-ui[data-state="returnHold"] .abstract-ui__prompt {
  top: 82%;
  width: 20.5rem;
  min-height: 2.75rem;
  padding: 0.48rem 0.5rem 0.48rem 0.86rem;
  box-shadow:
    0 0.75rem 2rem rgb(0 0 0 / 0.11),
    inset 0 1px 0 rgb(255 255 255 / 0.18);
}

.abstract-ui__prompt-text {
  display: flex;
  align-items: center;
  min-width: 0;
  color: var(--deck-text-primary);
  font-size: 0.88rem;
  font-weight: 620;
  line-height: 1.2;
  white-space: nowrap;
}

.abstract-ui[data-state="dock"] .abstract-ui__prompt-text,
.abstract-ui[data-state="surface"] .abstract-ui__prompt-text,
.abstract-ui[data-state="bands"] .abstract-ui__prompt-text,
.abstract-ui[data-state="split"] .abstract-ui__prompt-text,
.abstract-ui[data-state="splitHold"] .abstract-ui__prompt-text,
.abstract-ui[data-state="return"] .abstract-ui__prompt-text,
.abstract-ui[data-state="returnHold"] .abstract-ui__prompt-text {
  font-size: 0.76rem;
}

.abstract-ui__intent {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  text-overflow: ellipsis;
  transition:
    opacity 240ms ease,
    max-width var(--abstract-ui-type-duration) steps(12, end);
}

.abstract-ui[data-state="intent"] .abstract-ui__intent,
.abstract-ui[data-state="dock"] .abstract-ui__intent,
.abstract-ui[data-state="surface"] .abstract-ui__intent,
.abstract-ui[data-state="bands"] .abstract-ui__intent,
.abstract-ui[data-state="split"] .abstract-ui__intent,
.abstract-ui[data-state="splitHold"] .abstract-ui__intent,
.abstract-ui[data-state="return"] .abstract-ui__intent,
.abstract-ui[data-state="returnHold"] .abstract-ui__intent {
  max-width: 6.5rem;
  opacity: 1;
}

.abstract-ui__caret {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-inline-start: 0.16rem;
  border-radius: 999px;
  background: var(--deck-primary);
  animation: abstract-ui-caret 980ms steps(2, start) infinite;
}

.abstract-ui__prompt-action {
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
    transform 360ms var(--abstract-ui-ease);
}

.abstract-ui__prompt-action span {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-block-start: 2px solid currentColor;
  border-inline-end: 2px solid currentColor;
  color: var(--deck-text-muted);
  transform: translateX(-1px) rotate(45deg);
  transition: color 300ms ease;
}

.abstract-ui[data-state="intent"] .abstract-ui__prompt-action,
.abstract-ui[data-state="dock"] .abstract-ui__prompt-action,
.abstract-ui[data-state="surface"] .abstract-ui__prompt-action,
.abstract-ui[data-state="bands"] .abstract-ui__prompt-action,
.abstract-ui[data-state="split"] .abstract-ui__prompt-action,
.abstract-ui[data-state="splitHold"] .abstract-ui__prompt-action,
.abstract-ui[data-state="return"] .abstract-ui__prompt-action,
.abstract-ui[data-state="returnHold"] .abstract-ui__prompt-action {
  background: var(--deck-primary);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.18);
}

.abstract-ui[data-state="intent"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="dock"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="surface"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="bands"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="split"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="splitHold"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="return"] .abstract-ui__prompt-action span,
.abstract-ui[data-state="returnHold"] .abstract-ui__prompt-action span {
  color: var(--deck-on-primary);
}

.abstract-ui[data-state="dock"] .abstract-ui__prompt-action {
  animation: abstract-ui-send 560ms var(--abstract-ui-ease) both;
}

.abstract-ui[data-state="dock"] .abstract-ui__prompt-action::after {
  position: absolute;
  inset: -0.55rem;
  content: "";
  border: 1px solid color-mix(in srgb, var(--deck-primary) 34%, transparent);
  border-radius: inherit;
  animation: abstract-ui-pulse 760ms var(--abstract-ui-ease) both;
}

@keyframes abstract-ui-caret {
  0%,
  46% {
    opacity: 1;
  }

  47%,
  100% {
    opacity: 0;
  }
}

@keyframes abstract-ui-send {
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

@keyframes abstract-ui-pulse {
  0% {
    opacity: 0.48;
    transform: scale(0.72);
  }

  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@keyframes abstract-ui-scan {
  0% {
    transform: translateX(-24%);
  }

  100% {
    transform: translateX(24%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .abstract-ui *,
  .abstract-ui *::before,
  .abstract-ui *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
</style>
