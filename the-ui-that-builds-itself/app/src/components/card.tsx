import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Bounded content surface.
 */
export function Card({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "grid gap-3 p-4 rounded-lg border border-border bg-surface text-text" */
  className?: string;
} & Omit<React.ComponentProps<"section">, "children" | "className">) {
  return (
    <section
      className={cx(
        "grid gap-3 p-4 rounded-lg border border-border bg-surface text-text",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
