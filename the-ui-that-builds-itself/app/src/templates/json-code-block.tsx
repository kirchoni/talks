"use client";

import { type CSSProperties, useEffect, useState } from "react";

import { formatJsonValue } from "@/lib/format-json";

import styles from "./json-code-block.module.css";

type ShikiTheme = "github-dark-default" | "github-light-default";

function resolveTheme(): ShikiTheme {
  if (typeof document === "undefined") {
    return "github-dark-default";
  }

  return document.documentElement.getAttribute("data-theme") === "light"
    ? "github-light-default"
    : "github-dark-default";
}

type JsonCodeBlockProps = {
  value: unknown;
  className?: string;
  style?: CSSProperties;
};

export function JsonCodeBlock({ value, className, style }: JsonCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string>(() =>
    typeof value === "string" ? value : JSON.stringify(value, null, 2),
  );

  useEffect(() => {
    let cancelled = false;

    async function renderBlock() {
      const formatted = await formatJsonValue(value);
      if (cancelled) {
        return;
      }

      setFallback(formatted);

      const { codeToHtml } = await import("shiki");
      const highlighted = await codeToHtml(formatted, {
        lang: "json",
        theme: resolveTheme(),
      });

      if (!cancelled) {
        setHtml(highlighted);
      }
    }

    void renderBlock();

    const observer = new MutationObserver(() => {
      void renderBlock();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [value]);

  const rootClassName = [styles.root, className].filter(Boolean).join(" ");

  if (!html) {
    return (
      <pre className={rootClassName} style={style}>
        <code className={styles.fallback}>{fallback}</code>
      </pre>
    );
  }

  return (
    <div
      className={rootClassName}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
