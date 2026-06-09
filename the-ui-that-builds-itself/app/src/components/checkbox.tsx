"use client";

import React, { type ReactNode } from "react";

import {
  RevealedHiddenFieldChrome,
  useRevealHiddenFields,
} from "@/templates/reveal-hidden-fields";

import { cx } from "./cx";

/**
 * Checkbox option for confirmations, preferences, or filters.
 */
export function Checkbox({
  children,
  className,
  defaultChecked,
  defaultValue,
  hidden,
  name,
  required,
  type = "checkbox",
  value = "true",
  ...rest
}: {
  children?: ReactNode;
  /** @default "inline-flex items-center gap-2 text-sm text-text" */
  className?: string;
  defaultChecked?: boolean;
  /** @deprecated LLM output alias; maps to submitted `value`. */
  defaultValue?: string;
  /** When true, the field submits but is not shown to the user. */
  hidden?: boolean;
  name: string;
  required?: boolean;
  type?: "checkbox";
  /** @default "true" Submitted value when checked. */
  value?: string;
} & Omit<
  React.ComponentProps<"input">,
  "children" | "className" | "name" | "type" | "defaultValue" | "value" | "hidden"
>) {
  const revealHidden = useRevealHiddenFields();
  const submittedValue = value ?? defaultValue ?? "true";
  const rawValue = defaultChecked ? submittedValue : "";

  if (hidden && revealHidden) {
    return (
      <>
        {defaultChecked ? (
          <input name={name} type="hidden" value={submittedValue} />
        ) : null}
        <RevealedHiddenFieldChrome name={name} rawValue={rawValue}>
          <label
            className={cx(
              "inline-flex items-center gap-2 text-sm text-text opacity-70 cursor-default",
              className,
            )}
          >
            <input
              defaultChecked={defaultChecked}
              readOnly
              required={required}
              type={type}
              value={submittedValue}
              className="size-4 shrink-0 accent-primary pointer-events-none"
              {...rest}
            />
            {children ? <span>{children}</span> : null}
          </label>
        </RevealedHiddenFieldChrome>
      </>
    );
  }

  // prev: hidden checkboxes used the native hidden attribute on the label.
  return (
    <label
      hidden={hidden}
      className={cx(
        "inline-flex items-center gap-2 text-sm text-text",
        className,
      )}
    >
      <input
        defaultChecked={defaultChecked}
        name={name}
        required={required}
        type={type}
        value={submittedValue}
        className="size-4 shrink-0 accent-primary"
        {...rest}
      />
      {children ? <span>{children}</span> : null}
    </label>
  );
}
