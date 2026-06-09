import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Semantic status or category label.
 */
export function Badge({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "inline-block self-start w-fit px-2.5 py-0.5 whitespace-nowrap  rounded-full text-xs font-medium leading-normal border border-border bg-surface-alt text-text" */
  className?: string;
} & Omit<React.ComponentProps<"span">, "children" | "className">) {
  return (
    <span
      className={cx(
        "inline-block self-start w-fit px-2.5 py-0.5 whitespace-nowrap rounded-full text-xs font-medium leading-normal border border-border bg-surface-alt text-text",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
