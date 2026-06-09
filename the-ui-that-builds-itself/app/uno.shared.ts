import type { UserConfig } from "@unocss/core";
import { presetWind4 } from "@unocss/preset-wind4";

import { unoTheme } from "./src/design/uno-theme.generated";

type UnoSharedConfigOptions = {
  /** Include Tailwind preflight reset (enabled for shadow-DOM LLM output). */
  reset?: boolean;
};

/** Shared Uno config for PostCSS scanning and programmatic LLM CSS generation. */
export function getUnoSharedConfig(
  options: UnoSharedConfigOptions = {},
): UserConfig {
  const { reset = false } = options;

  return {
    presets: [
      presetWind4({
        preflights: {
          reset,
          theme: "on-demand",
          property: { parent: false },
        },
      }),
    ],
    theme: {
      colors: unoTheme.colors,
      spacing: unoTheme.spacing,
      fontSize: unoTheme.fontSize,
      lineHeight: unoTheme.lineHeight,
      fontFamily: unoTheme.fontFamily,
      fontWeight: unoTheme.fontWeight,
    },
  };
}
