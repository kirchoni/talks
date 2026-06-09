import React, { type ReactNode } from "react";

import { cx } from "./cx";

const headingElements = new Set(["h1", "h2", "h3"]);

/**
 * Text element.
 */
export function Text({
  as = "p",
  children,
  className,
  ...rest
}: {
  /** HTML element to render. */
  as?: "h1" | "h2" | "h3" | "p" | "span" | "small" | "strong";
  children?: ReactNode;
  /** @default "m-0 text-text" (headings add font-sans; body inherits from shell or shadow host) */
  className?: string;
} & Omit<React.ComponentProps<"p">, "children" | "className">) {
  const Element = as;

  return (
    <Element
      className={cx(
        "m-0 text-text",
        headingElements.has(as) && "font-sans leading-tight",
        className,
      )}
      {...rest}
    >
      {children}
    </Element>
  );
}
