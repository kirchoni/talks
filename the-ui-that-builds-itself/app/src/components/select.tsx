"use client";

import React, { type ReactNode } from "react";

import {
  RevealedHiddenFieldChrome,
  useRevealHiddenFields,
} from "@/templates/reveal-hidden-fields";

import { cx } from "./cx";

/**
 * Dropdown select.
 */
export function Select({
  children,
  className,
  defaultValue,
  hidden,
  name,
  required,
  ...rest
}: {
  children?: ReactNode;
  /** @default "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none focus:border-text" */
  className?: string;
  defaultValue?: string;
  /** When true, the field submits but is not shown to the user. */
  hidden?: boolean;
  name: string;
  required?: boolean;
} & Omit<
  React.ComponentProps<"select">,
  "children" | "className" | "name" | "defaultValue" | "hidden"
>) {
  const revealHidden = useRevealHiddenFields();
  const rawValue = defaultValue ?? "";

  if (hidden && revealHidden) {
    return (
      <>
        <input name={name} type="hidden" value={rawValue} />
        <RevealedHiddenFieldChrome name={name} rawValue={rawValue}>
          <select
            defaultValue={defaultValue}
            required={required}
            className={cx(
              "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none focus:border-text opacity-70 cursor-default bg-surface-alt pointer-events-none",
              className,
            )}
            {...rest}
          >
            {children}
          </select>
        </RevealedHiddenFieldChrome>
      </>
    );
  }

  // prev: hidden selects used the native hidden attribute with no reveal branch.
  return (
    <select
      defaultValue={defaultValue}
      hidden={hidden}
      name={name}
      required={required}
      className={cx(
        "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none focus:border-text",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
