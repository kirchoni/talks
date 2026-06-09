"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import styles from "./output-shadow.module.css";

const GENERATED_UI_BASE_STYLE = `
:host {
  display: block;
  color: var(--ui-color-text);
  font-family: var(--ui-font-family-serif);
  font-size: var(--ui-font-size-md);
  line-height: var(--ui-line-height-normal);
  -webkit-font-smoothing: antialiased;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

h1,
h2,
h3 {
  font-family: var(--ui-font-family-sans);
  line-height: var(--ui-line-height-tight);
}
`;

const REPLAY_HIGHLIGHT_STYLE = `
[data-replay-highlight] {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
  box-shadow: 0 0 0 4px color-mix(in srgb, #ffffff 18%, transparent);
  animation: boxel-replay-highlight 1.1s ease;
}

@keyframes boxel-replay-highlight {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, #ffffff 40%, transparent);
  }
  70% {
    box-shadow: 0 0 0 8px color-mix(in srgb, #ffffff 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 4px color-mix(in srgb, #ffffff 18%, transparent);
  }
}
`;

function clearReplayHighlights(shadowRoot: ShadowRoot) {
  shadowRoot.querySelectorAll("[data-replay-highlight]").forEach((element) => {
    element.removeAttribute("data-replay-highlight");
  });
}

function applyReplayHighlights(shadowRoot: ShadowRoot, highlightIds: string[]) {
  clearReplayHighlights(shadowRoot);

  if (highlightIds.length === 0) {
    return;
  }

  const targets: Element[] = [];

  for (const id of highlightIds) {
    const element = shadowRoot.querySelector(
      `[data-ui-id="${CSS.escape(id)}"]`,
    );
    if (element) {
      element.setAttribute("data-replay-highlight", "true");
      targets.push(element);
    }
  }

  targets[0]?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "nearest",
  });
}

type OutputShadowProps = {
  children: ReactNode;
  css: string;
  highlightIds?: string[];
  includeBaseStyle?: boolean;
};

export function OutputShadow({
  children,
  css,
  highlightIds = [],
  includeBaseStyle = true,
}: OutputShadowProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const highlightKey = highlightIds.join("\u0000");

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    setShadowRoot(
      hostRef.current.shadowRoot ??
        hostRef.current.attachShadow({ mode: "open" }),
    );
  }, []);

  useEffect(() => {
    if (!shadowRoot) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      applyReplayHighlights(shadowRoot, highlightIds);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [shadowRoot, highlightKey, children]);

  useEffect(() => {
    return () => {
      if (shadowRoot) {
        clearReplayHighlights(shadowRoot);
      }
    };
  }, [shadowRoot]);

  return (
    <div ref={hostRef} className={styles.host}>
      {shadowRoot
        ? createPortal(
            <>
              {includeBaseStyle ? (
                <style>{GENERATED_UI_BASE_STYLE}</style>
              ) : null}
              {highlightIds.length > 0 ? (
                <style>{REPLAY_HIGHLIGHT_STYLE}</style>
              ) : null}
              {css ? <style>{css}</style> : null}
              {children}
            </>,
            shadowRoot,
          )
        : null}
    </div>
  );
}
