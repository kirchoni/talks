"use client";

import React from "react";

import {
  RevealedHiddenFieldChrome,
  useRevealHiddenFields,
} from "@/templates/reveal-hidden-fields";

import { cx } from "./cx";

const revealedFieldClassName =
  "opacity-70 cursor-default bg-surface-alt";

/**
 * Multiline text input for longer form responses.
 */
export function Textarea({
  className,
  defaultValue,
  hidden,
  name,
  placeholder,
  required,
  rows = 4,
  ...rest
}: {
  /** @default "block min-h-24 min-w-0 w-full resize-y px-3 py-2.5 rounded-md border border-border bg-surface text-text text-sm leading-normal outline-none placeholder:text-text-muted focus:border-text disabled:opacity-50 disabled:cursor-not-allowed" */
  className?: string;
  defaultValue?: string;
  /** When true, the field submits but is not shown to the user. */
  hidden?: boolean;
  name: string;
  placeholder?: string;
  required?: boolean;
  /** @default 4 */
  rows?: number;
} & Omit<
  React.ComponentProps<"textarea">,
  "children" | "className" | "name" | "defaultValue" | "rows" | "hidden"
>) {
  const revealHidden = useRevealHiddenFields();
  const rawValue = defaultValue ?? "";

  if (hidden && revealHidden) {
    return (
      <RevealedHiddenFieldChrome name={name} rawValue={rawValue}>
        <textarea
          defaultValue={defaultValue}
          name={name}
          placeholder={placeholder}
          readOnly
          required={required}
          rows={rows}
          className={cx(
            "block min-h-24 min-w-0 w-full resize-y px-3 py-2.5 rounded-md border border-border bg-surface text-text text-sm leading-normal outline-none placeholder:text-text-muted focus:border-text disabled:opacity-50 disabled:cursor-not-allowed",
            revealedFieldClassName,
            className,
          )}
          {...rest}
        />
      </RevealedHiddenFieldChrome>
    );
  }

  // prev: hidden textareas used the native hidden attribute with no reveal branch.
  return (
    <textarea
      defaultValue={defaultValue}
      hidden={hidden}
      name={name}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className={cx(
        "block min-h-24 min-w-0 w-full resize-y px-3 py-2.5 rounded-md border border-border bg-surface text-text text-sm leading-normal outline-none placeholder:text-text-muted focus:border-text disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    />
  );
}
