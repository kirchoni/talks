import { cx } from "./cx";

/**
 * Visual separator.
 */
export function Divider({
  className,
}: {
  /** @default "border-none border-t border-border my-2" */
  className?: string;
} = {}) {
  return (
    <hr className={cx("border-none border-t border-border my-2", className)} />
  );
}
