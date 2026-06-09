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
 * Text input.
 */
export function Input({
  autoComplete,
  className,
  defaultValue,
  hidden,
  name,
  placeholder,
  required,
  type = "text",
  ...rest
}: {
  autoComplete?: string;
  /** @default "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none placeholder:text-text-muted focus:border-text" */
  className?: string;
  defaultValue?: string;
  /** When true, the field submits but is not shown to the user. */
  hidden?: boolean;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "hidden"
    | "tel"
    | "url"
    | "date"
    | "search";
} & Omit<
  React.ComponentProps<"input">,
  "children" | "className" | "name" | "type" | "defaultValue" | "hidden"
>) {
  const revealHidden = useRevealHiddenFields();
  const isHiddenField = hidden || type === "hidden";
  const rawValue = defaultValue ?? "";

  if (isHiddenField && revealHidden) {
    return (
      <RevealedHiddenFieldChrome name={name} rawValue={rawValue}>
        <input
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          name={name}
          placeholder={placeholder}
          readOnly
          required={required}
          type="text"
          className={cx(
            "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none placeholder:text-text-muted focus:border-text",
            revealedFieldClassName,
            className,
          )}
          {...rest}
        />
      </RevealedHiddenFieldChrome>
    );
  }

  // prev: hidden fields always rendered as type="hidden" with no reveal branch.
  if (isHiddenField) {
    return (
      <input
        name={name}
        type="hidden"
        value={defaultValue}
        {...rest}
      />
    );
  }

  return (
    <input
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      name={name}
      placeholder={placeholder}
      required={required}
      type={type}
      className={cx(
        "min-h-9 min-w-0 w-full px-3 py-2 rounded-md border border-border bg-surface text-text text-sm outline-none placeholder:text-text-muted focus:border-text",
        className,
      )}
      {...rest}
    />
  );
}
