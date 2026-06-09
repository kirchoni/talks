"use client";

import React, { type ReactNode } from "react";

import {
  RevealedHiddenFieldChrome,
  useRevealHiddenFields,
} from "@/templates/reveal-hidden-fields";

import { cx } from "./cx";

/**
 * Radio input control.
 */
export function Radio({
  children,
  className,
  defaultValue,
  hidden,
  name,
  required,
  type = "radio",
  ...rest
}: {
  children?: ReactNode;
  /** @default "inline-flex items-center gap-2 text-sm text-text" */
  className?: string;
  defaultValue: string;
  /** When true, the field submits but is not shown to the user. */
  hidden?: boolean;
  name: string;
  required?: boolean;
  type?: "radio";
} & Omit<
  React.ComponentProps<"input">,
  "children" | "className" | "name" | "type" | "defaultValue" | "hidden"
>) {
  const revealHidden = useRevealHiddenFields();

  if (hidden && revealHidden) {
    return (
      <>
        <input name={name} type="hidden" value={defaultValue} />
        <RevealedHiddenFieldChrome name={name} rawValue={defaultValue}>
          <label
            className={cx(
              "inline-flex items-center gap-2 text-sm text-text opacity-70 cursor-default",
              className,
            )}
          >
            <input
              defaultChecked
              readOnly
              required={required}
              type={type}
              value={defaultValue}
              className="size-4 shrink-0 accent-primary pointer-events-none"
              {...rest}
            />
            {children ? <span>{children}</span> : null}
          </label>
        </RevealedHiddenFieldChrome>
      </>
    );
  }

  // prev: hidden radios used the native hidden attribute on the label.
  return (
    <label
      hidden={hidden}
      className={cx(
        "inline-flex items-center gap-2 text-sm text-text",
        className,
      )}
    >
      <input
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
        className="size-4 shrink-0 accent-primary"
        {...rest}
      />
      {children ? <span>{children}</span> : null}
    </label>
  );
}
