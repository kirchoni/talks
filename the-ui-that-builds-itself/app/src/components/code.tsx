import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Inline code snippet.
 */
export function Code({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "inline-block max-w-full font-mono text-xs px-1.5 py-0.5 rounded border border-border bg-surface-alt text-text break-words" */
  className?: string;
} & Omit<React.ComponentProps<"code">, "children" | "className">) {
  return (
    <code
      className={cx(
        "inline-block max-w-full font-mono text-xs px-1.5 py-0.5 rounded border border-border bg-surface-alt text-text break-words",
        className,
      )}
      {...rest}
    >
      {children}
    </code>
  );
}
