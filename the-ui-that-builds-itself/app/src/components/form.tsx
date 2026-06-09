import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Form container.
 */
export function Form({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "grid gap-3" */
  className?: string;
} & Omit<React.ComponentProps<"form">, "children" | "className">) {
  return (
    <form {...rest} className={cx("grid gap-3", className)}>
      {children}
    </form>
  );
}
