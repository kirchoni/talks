<script setup lang="ts">
defineProps<{
  click?: number;
}>();
</script>

<template>
  <section class="ui-fn-resolved" aria-label="UI function with LLM body">
    <div class="resolved-scene">
      <div class="code-shell">
        <div class="code-shell__chrome">
          <span class="code-shell__tab">ui.ts</span>
        </div>

        <pre
          class="code-editor"
          aria-label="UI function resolved"
        ><code class="code-block"><span class="code-line"><span class="code-keyword">function</span> <span class="code-fn">ui</span><span class="code-punctuation">(</span><span class="code-param">prompt</span><span class="code-punctuation">,</span> <span class="code-param">data</span><span class="code-punctuation">,</span> <span class="code-param">state</span><span class="code-punctuation">,</span> <span class="code-param">capabilities</span><span class="code-punctuation">,</span> <span class="code-param">design_system</span><span class="code-punctuation">) {</span></span>
<span class="code-line">  <span class="code-return">return</span> <span class="code-llm">llm</span><span class="code-punctuation">(</span><span class="code-spread">...arguments</span><span class="code-punctuation">)</span></span>
<span class="code-line"><span class="code-punctuation">}</span></span></code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-fn-resolved {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.resolved-scene {
  width: min(100%, 56rem);
  height: min(100%, 29rem);
  min-height: 22rem;
  overflow: visible;
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

.code-shell__tab {
  display: block;
  font-family: var(--deck-font-mono);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0;
  line-height: 1;
  max-width: 70%;
  overflow: hidden;
  color: var(--deck-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
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

.code-return {
  color: var(--deck-info);
  font-weight: 680;
}

.code-llm {
  color: var(--deck-primary);
  filter: drop-shadow(
    0 0 0.35rem color-mix(in srgb, var(--deck-primary) 18%, transparent)
  );
  font-weight: 720;
}

.code-spread {
  color: #f97316;
  font-weight: 620;
}

@media (max-width: 820px) {
  .resolved-scene {
    width: 100%;
    height: 24rem;
    min-height: 0;
  }

  .code-shell {
    grid-template-rows: 2.65rem minmax(0, 1fr);
  }

  .code-editor {
    padding: 1.1rem;
    font-size: 0.78rem;
    line-height: 1.38;
  }
}
</style>
