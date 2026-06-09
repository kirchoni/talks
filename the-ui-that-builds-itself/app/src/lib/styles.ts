import { createGenerator } from "@unocss/core";

import { buttonVariantClassNames } from "@/components/button";
import { getDefaultClassNameTokens } from "@/lib/catalog";
import type { SseSender } from "@/lib/sse";
import type { BasicUiCommand, BasicUiFlatNode } from "@/lib/ui";
import { getUnoSharedConfig } from "../../uno.shared";

let generator: Awaited<ReturnType<typeof createGenerator>> | null = null;

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function addClasses(tokens: Set<string>, classNames: string) {
  let added = false;

  for (const token of classNames.split(/\s+/)) {
    if (token && !tokens.has(token)) {
      tokens.add(token);
      added = true;
    }
  }

  return added;
}

function defaultTokens() {
  const tokens = getDefaultClassNameTokens();

  for (const classNames of Object.values(buttonVariantClassNames)) {
    addClasses(tokens, classNames);
  }

  addClasses(tokens, "font-sans leading-tight");
  return tokens;
}

function collectTokens(flatNodes: BasicUiFlatNode[]) {
  const tokens = defaultTokens();

  for (const node of flatNodes) {
    const classNames = node.props?.className;
    if (typeof classNames === "string") {
      addClasses(tokens, classNames);
    }
  }

  return tokens;
}

async function unoCss(tokens: Set<string>) {
  const classNames = [...tokens].join(" ").trim();
  if (!classNames) {
    return "";
  }

  const html = `<div class="${escapeAttr(classNames)}"></div>`;

  try {
    generator ??= await createGenerator(getUnoSharedConfig({ reset: true }));
    const { css } = await generator.generate(html, { preflights: true });
    return css?.trim() ?? "";
  } catch (error) {
    console.error("[unocss] CSS generation failed:", error);
    return "";
  }
}

function classesFromCommand(command: BasicUiCommand) {
  if (command.op === "removeNode") {
    return "";
  }

  const classNames = command.props?.className;
  return typeof classNames === "string" ? classNames : "";
}

export async function createStyleStream(
  send: SseSender,
  flatNodes: BasicUiFlatNode[],
) {
  const tokens = collectTokens(flatNodes);
  let lastCss = "";

  async function publish() {
    const css = await unoCss(tokens);
    if (css && css !== lastCss) {
      lastCss = css;
      send("styles", { css });
    }
  }

  await publish();

  return {
    async onCommand(command: BasicUiCommand) {
      if (addClasses(tokens, classesFromCommand(command))) {
        await publish();
      }
    },

    async finish(commands: BasicUiCommand[]) {
      for (const command of commands) {
        addClasses(tokens, classesFromCommand(command));
      }

      return unoCss(tokens);
    },
  };
}
