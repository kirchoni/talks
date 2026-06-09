import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Preformatted code or text block.
 */
export function Pre({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "m-0 overflow-x-auto p-3 rounded-md border border-border bg-surface-alt font-mono text-xs leading-normal text-text whitespace-pre-wrap break-words" */
  className?: string;
} & Omit<React.ComponentProps<"pre">, "children" | "className">) {
  return (
    <pre
      className={cx(
        "m-0 overflow-x-auto p-3 rounded-md border border-border bg-surface-alt font-mono text-xs leading-normal text-text whitespace-pre-wrap break-words",
        className,
      )}
      {...rest}
    >
      {children}
    </pre>
  );
}
