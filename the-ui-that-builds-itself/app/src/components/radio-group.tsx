import React, { type ReactNode } from "react";

import { cx } from "./cx";

/**
 * Fieldset for related radio choices.
 */
export function RadioGroup({
  children,
  className,
  ...rest
}: {
  children?: ReactNode;
  /** @default "grid gap-2 border-0 p-0 m-0" */
  className?: string;
} & Omit<React.ComponentProps<"fieldset">, "children" | "className">) {
  return (
    <fieldset
      className={cx("grid gap-2 border-0 p-0 m-0", className)}
      {...rest}
    >
      {children}
    </fieldset>
  );
}
