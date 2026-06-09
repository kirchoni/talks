"use client";

import {
  createElement,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Badge as DsBadge,
  Button as DsButton,
  Card as DsCard,
  Checkbox as DsCheckbox,
  Code as DsCode,
  Divider as DsDivider,
  Form as DsForm,
  Input as DsInput,
  Label as DsLabel,
  Option as DsOption,
  Pre as DsPre,
  Radio as DsRadio,
  RadioGroup as DsRadioGroup,
  Select as DsSelect,
  Text as DsText,
  Textarea as DsTextarea,
} from "@/components";
import { applyBasicUiCommands, flatNodesToBasicUiNode } from "@/lib/ui";
import type { BasicUiCommand, BasicUiFlatNode, BasicUiNode } from "@/lib/ui";
import type { ClientDemoState } from "@/templates/demo-state";

export type { BasicUiCommand, BasicUiFlatNode, BasicUiNode };

export type ActionResponse = {
  action: string;
  result: unknown;
  statePatch?: Record<string, unknown> | null;
};

type DoneEvent = {
  commands?: BasicUiCommand[];
  css?: string;
  model?: string;
  sessionId?: string;
};

type CommandStreamHandlers = {
  baseNodes: BasicUiFlatNode[];
  onCommand: (
    command: BasicUiCommand,
    nodes: BasicUiFlatNode[],
    root: BasicUiNode | null,
  ) => void;
  onCss: (css: string) => void;
  onDone: (
    done: DoneEvent,
    nodes: BasicUiFlatNode[],
    root: BasicUiNode | null,
    commands: BasicUiCommand[],
  ) => void;
};

const designSystemComponentRegistry: Record<string, ElementType> = {
  Badge: DsBadge,
  Button: DsButton,
  Card: DsCard,
  Checkbox: DsCheckbox,
  Code: DsCode,
  Divider: DsDivider,
  Form: DsForm,
  Input: DsInput,
  Label: DsLabel,
  Option: DsOption,
  Pre: DsPre,
  Radio: DsRadio,
  RadioGroup: DsRadioGroup,
  Select: DsSelect,
  Text: DsText,
  Textarea: DsTextarea,
};
const childlessComponentTypes = new Set(["Input"]);

export async function executeAction(
  action: string,
  args: Record<string, string>,
  state: ClientDemoState,
): Promise<ActionResponse> {
  const response = await fetch("/api/generate-ui/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args, state }),
  });
  const payload = (await response.json()) as ActionResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to run action.");
  }

  return payload;
}

export function statePatchFrom(response: ActionResponse) {
  return response.statePatch &&
    typeof response.statePatch === "object" &&
    !Array.isArray(response.statePatch)
    ? response.statePatch
    : null;
}

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent.split("\n");
  const event =
    lines
      .find((line) => line.startsWith("event:"))
      ?.slice("event:".length)
      .trim() ?? "message";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n");

  return {
    event,
    data: data ? JSON.parse(data) : null,
  };
}

export async function readGeneratedUiCommandStream(
  response: Response,
  { baseNodes, onCommand, onCss, onDone }: CommandStreamHandlers,
) {
  if (!response.ok || !response.body) {
    throw new Error("Failed to generate UI.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let nodes = baseNodes;
  let commands: BasicUiCommand[] = [];
  let sawDone = false;

  const applyCss = (css: unknown) => {
    if (typeof css === "string") {
      onCss(css);
    }
  };

  const handleEvent = (rawEvent: string) => {
    if (!rawEvent.trim()) {
      return;
    }

    const parsed = parseSseEvent(rawEvent);

    if (parsed.event === "command") {
      const command = parsed.data as BasicUiCommand;
      commands = [...commands, command];
      nodes = applyBasicUiCommands(nodes, [command]);
      onCommand(command, nodes, flatNodesToBasicUiNode(nodes));
      return;
    }

    if (parsed.event === "styles") {
      applyCss((parsed.data as { css?: string }).css);
      return;
    }

    if (parsed.event === "done") {
      const done = parsed.data as DoneEvent;
      if (done.commands) {
        commands = done.commands;
        nodes = applyBasicUiCommands(baseNodes, commands);
      }
      applyCss(done.css);
      onDone(done, nodes, flatNodesToBasicUiNode(nodes), commands);
      sawDone = true;
      return;
    }

    if (parsed.event === "error") {
      const payload = parsed.data as { error?: string };
      throw new Error(payload.error ?? "Failed to generate UI.");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      handleEvent(event);
    }

    if (done) {
      break;
    }
  }

  handleEvent(buffer);
  if (!sawDone) {
    throw new Error("UI stream ended before completion.");
  }
}

function formArgs(event: FormEvent<HTMLFormElement>) {
  const submitter =
    "submitter" in event.nativeEvent
      ? (event.nativeEvent.submitter as HTMLElement | null)
      : null;
  const formData =
    submitter instanceof HTMLButtonElement ||
    submitter instanceof HTMLInputElement
      ? new FormData(event.currentTarget, submitter)
      : new FormData(event.currentTarget);
  const args: Record<string, string> = {};

  for (const [name, value] of formData.entries()) {
    args[name] = String(value);
  }

  return args;
}

export function renderBasicUiNode(
  node: BasicUiNode | string,
  onAction?: (action: string, args: Record<string, string>) => void,
  key = "root",
): ReactNode {
  if (typeof node === "string") {
    return node;
  }

  const children =
    typeof node.children === "string"
      ? node.children
      : node.children?.map((child, index) =>
          renderBasicUiNode(child, onAction, `${key}-${index}`),
        );
  const props = { ...(node.props ?? {}) };
  const renderedChildren = childlessComponentTypes.has(node.type)
    ? undefined
    : (children ?? (props.children as ReactNode));
  const isForm = node.type === "Form";
  const Component = designSystemComponentRegistry[node.type] ?? node.type;

  delete props.children;

  if (isForm && node.action && onAction) {
    delete props.action;
    delete props.method;
    delete props.onSubmit;

    return createElement(
      Component,
      {
        key,
        ...props,
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onAction(node.action!, formArgs(event));
        },
      },
      renderedChildren,
    );
  }

  return createElement(Component, { key, ...props }, renderedChildren);
}
