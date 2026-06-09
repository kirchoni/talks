import React, { type ReactNode } from "react";

/**
 * Option inside a Select dropdown.
 */
export function Option({
  children,
  disabled,
  value,
}: {
  children?: ReactNode;
  disabled?: boolean;
  value: string;
}) {
  return (
    <option disabled={disabled} value={value}>
      {children}
    </option>
  );
}
