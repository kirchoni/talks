export function cx(...classes: (string | undefined | false)[]) {
  return [...new Set(classes.filter(Boolean).join(" ").split(/\s+/))]
    .filter(Boolean)
    .join(" ");
}
