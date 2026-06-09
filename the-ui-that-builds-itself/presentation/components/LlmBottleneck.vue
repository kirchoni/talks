<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  click?: number;
}>();

const panned = computed(() => (props.click ?? 0) >= 1);
</script>

<template>
  <section
    class="llm-bottleneck"
    aria-label="LLM as the bottleneck"
  >
    <div class="llm-bottleneck__viewport">
      <div
        class="llm-bottleneck__stage"
        :class="{ 'llm-bottleneck__stage--panned': panned }"
      >
        <svg
          class="hourglass"
          viewBox="0 0 2200 200"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <!-- Bottle: wide → narrow at bottleneck → stays narrow → widens again (the future) -->
          <path
            class="hourglass__edge hourglass__edge--top"
            d="M 36 40  L 320 40
               C 420 40  460 82  500 82
               L 920 82
               C 1020 82  1150 40  1300 -80
               L 2164 -600"
          />
          <path
            class="hourglass__edge hourglass__edge--bottom"
            d="M 36 160  L 320 160
               C 420 160  460 118  500 118
               L 920 118
               C 1020 118  1150 160  1300 280
               L 2164 800"
          />
          <line
            class="bottleneck-line"
            x1="470" y1="6" x2="470" y2="194"
          />
        </svg>

        <div class="llm-anchor" aria-label="Large language model">
          <span class="llm-anchor__core">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M9 13a4.5 4.5 0 0 0 3-4" />
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
              <path d="M6 18a4 4 0 0 1-1.967-.516" />
              <path d="M12 13h4" />
              <path d="M12 18h6a2 2 0 0 1 2 2v1" />
              <path d="M12 8h8" />
              <path d="M16 8V5a2 2 0 0 1 2-2" />
              <circle cx="16" cy="13" r=".5" />
              <circle cx="18" cy="3" r=".5" />
              <circle cx="20" cy="21" r=".5" />
              <circle cx="20" cy="8" r=".5" />
            </svg>
          </span>
        </div>

        <blockquote
          class="future-quote"
          :class="{ 'future-quote--visible': panned }"
        >
          <p>“To build the experience of the <strong>future</strong>,</p>
          <p>We must build the tooling of <strong>tomorrow</strong> — <strong>today</strong>”</p>
        </blockquote>
      </div>
    </div>
  </section>
</template>

<style scoped>
.llm-bottleneck {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--deck-text-primary);
}

.llm-bottleneck__viewport {
  width: min(100%, 54rem);
  height: min(100%, 17rem);
  overflow: visible;
  position: relative;
}

.llm-bottleneck__stage {
  position: relative;
  width: 300%;
  height: 100%;
  display: grid;
  place-items: center;
  transition: transform 2.4s cubic-bezier(0.4, 0, 0.15, 1);
  will-change: transform;
}

.llm-bottleneck__stage--panned {
  transform: translateX(-62%);
}

.hourglass {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.hourglass__edge {
  fill: none;
  stroke: var(--deck-primary);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3.6;
  filter: drop-shadow(
    0 0 0.45rem color-mix(in srgb, var(--deck-primary) 34%, transparent)
  );
}

.bottleneck-line {
  stroke: var(--deck-secondary);
  stroke-width: 2.6;
  stroke-dasharray: 10 8;
  stroke-linecap: round;
  opacity: 0.72;
  filter: drop-shadow(
    0 0 0.3rem color-mix(in srgb, var(--deck-secondary) 28%, transparent)
  );
}

.llm-anchor {
  position: absolute;
  /* Matches bottleneck-line x1=470 in viewBox 2200 */
  left: calc(470 / 2200 * 100%);
  top: 12%;
  z-index: 2;
  transform: translateX(0.55rem);
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.llm-anchor__core {
  display: grid;
  place-items: center;
  width: 3.8rem;
  height: 3.5rem;
  border: 1.5px solid color-mix(in srgb, var(--deck-secondary) 48%, transparent);
  border-radius: var(--deck-radius-md);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--deck-secondary) 12%, transparent),
      color-mix(in srgb, var(--deck-primary) 14%, transparent)
    ),
    var(--deck-surface-paper);
  box-shadow:
    0 0 0 0.32rem color-mix(in srgb, var(--deck-secondary) 8%, transparent),
    0 18px 50px rgb(16 17 20 / 0.11);
  color: color-mix(in srgb, var(--deck-secondary) 76%, var(--deck-primary));
}

.llm-anchor__core svg {
  width: 2.2rem;
  height: 2.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  transform: rotate(90deg);
}

/* --- Inspirational quote --- */
.future-quote {
  position: absolute;
  right: 18%;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  max-width: 28rem;
  opacity: 0;
  filter: blur(6px);
  transition:
    opacity 1.2s 1.4s ease-out,
    filter 1.2s 1.4s ease-out;
  border: none;
  margin: 0;
  padding: 0;
}

.future-quote--visible {
  opacity: 1;
  filter: blur(0);
}

.future-quote p {
  font-family: var(--deck-font-display, var(--deck-font-body));
  font-size: 1.45rem;
  font-weight: 300;
  line-height: 1.55;
  letter-spacing: -0.01em;
  font-style: italic;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--deck-cool) 20%, var(--deck-text-primary)) 0%,
    color-mix(in srgb, var(--deck-cool) 30%, var(--deck-text-primary)) 60%,
    color-mix(in srgb, var(--deck-cool) 38%, var(--deck-text-secondary)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.future-quote strong {
  font-weight: 580;
  font-style: italic;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--deck-cool) 50%, var(--deck-text-primary)) 0%,
    color-mix(in srgb, var(--deck-cool) 62%, var(--deck-secondary) 10%) 52%,
    color-mix(in srgb, var(--deck-cool) 72%, var(--deck-text-primary)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 820px) {
  .llm-bottleneck__viewport {
    width: 100%;
    height: 11rem;
  }

  .llm-anchor__core {
    width: 4.6rem;
    height: 4.25rem;
  }

  .llm-anchor__core svg {
    width: 2.85rem;
    height: 2.85rem;
  }

  .llm-anchor {
    top: 40%;
    transform: translate(0.55rem, -100%);
  }

  .future-quote p {
    font-size: 1.1rem;
  }
}
</style>
