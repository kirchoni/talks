"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

const RevealHiddenFieldsContext = createContext(false);

export function RevealHiddenFieldsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <RevealHiddenFieldsContext.Provider value={enabled}>
      {children}
    </RevealHiddenFieldsContext.Provider>
  );
}

export function useRevealHiddenFields() {
  return useContext(RevealHiddenFieldsContext);
}

export function RevealedHiddenFieldChrome({
  name,
  rawValue,
  children,
}: {
  name: string;
  rawValue: string;
  children: ReactNode;
}) {
  const displayValue = rawValue || "(empty)";

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-2">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span aria-hidden="true">🔒</span>
        <span>inferred</span>
        <code className="text-xs">{name}</code>
      </div>
      {children}
      <details className="text-xs text-text-muted">
        <summary className="cursor-pointer select-none">raw value</summary>
        <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] text-text">
          {displayValue}
        </pre>
      </details>
    </div>
  );
}
