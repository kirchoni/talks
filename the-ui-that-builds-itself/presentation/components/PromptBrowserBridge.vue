<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const state = computed(() => ((props.click ?? 0) > 0 ? "code" : "prompt"));
const codeStep = computed(() => Math.min(Math.max(props.click ?? 0, 1), 5));
</script>

<template>
  <section
    class="prompt-browser-bridge"
    :data-state="state"
    aria-label="Prompt surface transitioning to code editor"
  >
    <div class="bridge-scene">
      <div class="bridge-flipper">
        <div class="bridge-face bridge-face--front">
          <div class="browser-shell">
            <div class="browser-shell__chrome" aria-hidden="true">
              <span class="browser-shell__dot browser-shell__dot--close" />
              <span class="browser-shell__dot browser-shell__dot--minimize" />
              <span class="browser-shell__dot browser-shell__dot--maximize" />
              <span class="browser-shell__address">
                <span class="browser-shell__address-line" />
              </span>
            </div>

            <div class="browser-shell__page">
              <div class="prompt-input" role="textbox" aria-label="Prompt">
                <span class="prompt-input__placeholder">I want to ...</span>
                <span class="prompt-input__submit" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bridge-face bridge-face--back">
          <div class="code-shell">
            <div class="code-shell__chrome">
              <span class="code-shell__tab">ui.ts</span>
            </div>

            <pre
              class="code-editor"
              aria-label="Abstract UI function"
            ><code class="code-block"><span class="code-line"><span class="code-keyword">function</span> <span class="code-fn">ui</span><span class="code-punctuation">(</span><span class="code-param">prompt</span><span v-if="codeStep >= 2" class="code-arg-group"><span class="code-punctuation">,</span> <span class="code-param">data</span></span><span v-if="codeStep >= 3" class="code-arg-group"><span class="code-punctuation">,</span> <span class="code-param">state</span></span><span v-if="codeStep >= 4" class="code-arg-group"><span class="code-punctuation">,</span> <span class="code-param">capabilities</span></span><span v-if="codeStep >= 5" class="code-arg-group"><span class="code-punctuation">,</span> <span class="code-param">design_system</span></span><span class="code-punctuation">) {</span></span>
<span class="code-line">  <span class="code-comment">/* TODO */</span></span>
<span class="code-line"><span class="code-punctuation">}</span></span></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.prompt-browser-bridge {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.bridge-scene {
  width: min(100%, 56rem);
  height: min(100%, 29rem);
  min-height: 22rem;
  overflow: visible;
  perspective: 126rem;
}

.bridge-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.prompt-browser-bridge[data-state="code"] .bridge-flipper {
  transform: rotateY(180deg);
}

.bridge-face {
  position: absolute;
  inset: 0;
  display: grid;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.bridge-face--front {
  transform: none;
}

.bridge-face--back {
  transform: rotateY(180deg);
}

.browser-shell {
  display: grid;
  grid-template-rows: 3rem minmax(0, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: var(--deck-radius-lg);
  background: #ffffff;
  box-shadow:
    0 2rem 5rem rgb(0 0 0 / 0.34),
    0 0 0 1px rgb(16 17 20 / 0.22);
}

.browser-shell__chrome {
  display: grid;
  grid-template-columns: 0.72rem 0.72rem 0.72rem minmax(0, 1fr);
  align-items: center;
  gap: 0.46rem;
  padding: 0 1.05rem;
  border-bottom: 1px solid rgb(16 17 20 / 0.1);
  background: #f6f7f9;
}

.browser-shell__dot {
  display: block;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(16 17 20 / 0.08);
}

.browser-shell__dot--close {
  background: #ff5f57;
}

.browser-shell__dot--minimize {
  background: #ffbd2e;
}

.browser-shell__dot--maximize {
  background: #28c840;
}

.browser-shell__address {
  display: grid;
  align-items: center;
  justify-self: center;
  width: min(28rem, 58%);
  height: 1.45rem;
  margin-inline-start: 1.4rem;
  padding: 0 0.8rem;
  border: 1px solid rgb(16 17 20 / 0.08);
  border-radius: var(--deck-radius-pill);
  background: #ffffff;
}

.browser-shell__address-line {
  display: block;
  width: 42%;
  height: 0.3rem;
  border-radius: var(--deck-radius-pill);
  background: rgb(16 17 20 / 0.14);
}

.browser-shell__page {
  display: grid;
  place-items: center;
  min-height: 0;
  background:
    linear-gradient(180deg, rgb(16 17 20 / 0.018), transparent 26%), #ffffff;
}

.prompt-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2.35rem;
  align-items: center;
  width: min(34rem, calc(100% - 4rem));
  height: 3.55rem;
  padding: 0.36rem 0.42rem 0.36rem 1.25rem;
  border: 1px solid rgb(16 17 20 / 0.12);
  border-radius: 1.15rem;
  background: #ffffff;
  color: #101114;
  box-shadow:
    0 1.1rem 3.2rem rgb(16 17 20 / 0.1),
    0 0 0 4px rgb(16 17 20 / 0.025);
}

.prompt-input__placeholder {
  overflow: hidden;
  color: rgb(16 17 20 / 0.42);
  font-size: 1.05rem;
  font-weight: 540;
  letter-spacing: 0;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-input__submit {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.82rem;
  background:
    linear-gradient(135deg, rgb(0 128 102 / 0.12), rgb(168 85 247 / 0.14)),
    #f8fafc;
  box-shadow:
    inset 0 0 0 1px rgb(16 17 20 / 0.1),
    0 0.45rem 1rem rgb(16 17 20 / 0.08);
  color: #5d6470;
}

.prompt-input__submit svg {
  display: block;
  width: 1.18rem;
  height: 1.18rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.code-shell {
  display: grid;
  grid-template-rows: 3rem minmax(0, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--deck-border-subtle);
  border-radius: var(--deck-radius-lg);
  background: var(--deck-code-background);
  box-shadow:
    0 2rem 5rem rgb(0 0 0 / 0.26),
    0 0 0 1px rgb(255 253 250 / 0.08);
}

.code-shell__chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 1rem;
  border-bottom: 1px solid var(--deck-border-subtle);
  background: color-mix(in srgb, var(--deck-surface-panel) 82%, transparent);
}

.code-shell__tab,
.code-shell__status {
  display: block;
  font-family: var(--deck-font-mono);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0;
  line-height: 1;
}

.code-shell__tab {
  max-width: 70%;
  overflow: hidden;
  color: var(--deck-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-shell__status {
  color: var(--deck-primary);
}

.code-editor {
  display: grid;
  align-content: center;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  padding: 1.45rem 2rem;
  color: var(--deck-code-foreground);
  font-family: var(--deck-font-mono);
  font-size: clamp(0.92rem, 0.78rem + 0.58vw, 1.28rem);
  font-weight: 560;
  letter-spacing: 0;
  line-height: 1.45;
  white-space: pre;
}

.code-line {
  display: block;
}

.code-block {
  display: block;
  width: max-content;
  max-width: 100%;
}

.code-arg-group {
  display: inline-block;
}

.code-keyword {
  color: var(--deck-secondary);
}

.code-fn {
  color: var(--deck-primary);
  filter: drop-shadow(
    0 0 0.35rem color-mix(in srgb, var(--deck-primary) 18%, transparent)
  );
  font-weight: 720;
}

.code-param {
  color: color-mix(
    in srgb,
    var(--deck-warning) 86%,
    var(--deck-code-foreground)
  );
}

.code-punctuation {
  color: color-mix(in srgb, var(--deck-code-foreground) 74%, transparent);
}

.code-comment {
  color: var(--deck-text-muted);
  font-style: italic;
}

:global(html:not(.reduced-motion) .prompt-browser-bridge .bridge-flipper) {
  transition: transform 820ms cubic-bezier(0.18, 0.86, 0.2, 1);
}

:global(
  html:not(.reduced-motion)
    .prompt-browser-bridge[data-state="code"]
    .code-arg-group
) {
  animation: code-args-in 520ms cubic-bezier(0.18, 0.86, 0.2, 1) both;
}

:global(.reduced-motion .prompt-browser-bridge .bridge-flipper) {
  transition: none !important;
}

:global(.reduced-motion .prompt-browser-bridge .code-arg-group) {
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .bridge-flipper {
    transition: none !important;
  }

  .code-arg-group {
    animation: none !important;
  }
}

@keyframes code-args-in {
  from {
    clip-path: inset(0 100% 0 0);
    opacity: 0.72;
    transform: translateX(-0.18rem);
  }

  to {
    clip-path: inset(0 0 0 0);
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 820px) {
  .bridge-scene {
    width: 100%;
    height: 24rem;
    min-height: 0;
  }

  .browser-shell,
  .code-shell {
    grid-template-rows: 2.65rem minmax(0, 1fr);
  }

  .browser-shell__address {
    width: min(17rem, 62%);
    margin-inline-start: 0.72rem;
  }

  .prompt-input {
    width: calc(100% - 2rem);
  }

  .code-editor {
    padding: 1.1rem;
    font-size: 0.78rem;
    line-height: 1.38;
  }
}
</style>
