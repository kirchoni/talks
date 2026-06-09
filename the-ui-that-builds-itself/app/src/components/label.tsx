import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Form field label.
 */
export function Label({
  children,
  className,
  htmlFor,
  ...rest
}: {
  children?: ReactNode;
  /** @default "text-sm font-medium text-text" */
  className?: string;
  /** The id of the associated input element. */
  htmlFor?: string;
} & Omit<React.ComponentProps<"label">, "children" | "className">) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx("text-sm font-medium text-text", className)}
      {...rest}
    >
      {children}
    </label>
  );
}
