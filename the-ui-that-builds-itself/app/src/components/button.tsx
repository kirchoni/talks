import React, { type ReactNode } from "react";

import { cx } from "./cx";

export const buttonVariantClassNames = {
  primary:
    "inline-flex items-center justify-center min-h-9 w-fit px-4 py-2 rounded-full border border-primary bg-primary text-on-primary text-sm font-medium leading-ui cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "inline-flex items-center justify-center min-h-9 w-fit px-4 py-2 rounded-full border border-border bg-transparent text-text text-sm font-medium leading-ui cursor-pointer transition-opacity hover:bg-surface-alt hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed",
} as const;

export type ButtonVariant = keyof typeof buttonVariantClassNames;

/**
 * Clickable action control.
 */
export function Button({
  children,
  className,
  disabled,
  name,
  type = "submit",
  value,
  variant = "primary",
  ...rest
}: {
  children?: ReactNode;
  /** @default "inline-flex items-center justify-center min-h-9 w-fit px-4 py-2 rounded-full border border-primary bg-primary text-on-primary text-sm font-medium leading-ui cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" */
  className?: string;
  disabled?: boolean;
  name?: string;
  type?: "button" | "submit" | "reset";
  value?: string;
  /** @default "primary" */
  variant?: ButtonVariant;
} & Omit<
  React.ComponentProps<"button">,
  "children" | "className" | "type" | "value"
>) {
  return (
    <button
      disabled={disabled}
      name={name}
      type={type}
      value={value}
      className={cx(buttonVariantClassNames[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
