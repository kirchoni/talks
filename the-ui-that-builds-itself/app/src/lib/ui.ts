export type BasicUiNode = {
  type: string;
  action?: string;
  props?: Record<string, unknown>;
  children?: Array<BasicUiNode | string> | string;
};

export type BasicUiFlatNode = {
  id: string;
  parentId: string | null;
  type?: string;
  action?: string;
  props?: Record<string, unknown>;
  text?: string;
};

/** Partial node fields for updateNode. Only keys present in the patch are applied. */
export type BasicUiNodePatch = {
  parentId?: string | null;
  type?: string | null;
  action?: string | null;
  props?: Record<string, unknown> | null;
  text?: string | null;
};

export type BasicUiCreateCommand = {
  op: "createNode";
  id: string;
  parentId: string | null;
  type: string;
  action?: string;
  props?: Record<string, unknown>;
  text?: string;
};

export type BasicUiUpdateCommand = {
  op: "updateNode";
  id: string;
  parentId: string | null;
  type: string;
  action?: string;
  props?: Record<string, unknown>;
  /** null leaves existing label unchanged; "" clears it. */
  text: string | null;
  children?: null;
};

export type BasicUiCommand =
  | BasicUiCreateCommand
  | BasicUiUpdateCommand
  | {
      op: "removeNode";
      targetId: string;
    };

const CLEARABLE_PATCH_KEYS = ["type", "action", "text"] as const;

function isTextNode(node: BasicUiFlatNode) {
  return node.type === undefined && node.text !== undefined;
}

function getSubtreeIds(nodes: BasicUiFlatNode[], targetId: string) {
  const ids = new Set<string>();
  const pending = [targetId];

  while (pending.length > 0) {
    const id = pending.pop()!;
    if (ids.has(id)) {
      continue;
    }

    ids.add(id);
    for (const node of nodes) {
      if (node.parentId === id) {
        pending.push(node.id);
      }
    }
  }

  return ids;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeProps(
  existing: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = { ...(existing ?? {}) };

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete merged[key];
      continue;
    }

    const current = merged[key];
    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = deepMergeProps(current, value) ?? {};
      continue;
    }

    merged[key] = value;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function nodeFromCreateCommand(command: BasicUiCreateCommand): BasicUiFlatNode {
  return {
    id: command.id,
    parentId: command.parentId,
    type: command.type,
    ...(command.action ? { action: command.action } : {}),
    ...(command.props ? { props: command.props } : {}),
    ...(command.text ? { text: command.text } : {}),
  };
}

function buildUpdatePatch(
  existing: BasicUiFlatNode | undefined,
  command: BasicUiUpdateCommand,
): BasicUiNodePatch {
  if (!existing) {
    return {
      parentId: command.parentId,
      type: command.type,
      ...(command.action ? { action: command.action } : {}),
      ...(command.text && command.text !== "" ? { text: command.text } : {}),
      ...(command.text === "" ? { text: null } : {}),
      ...(command.props ? { props: command.props } : {}),
    };
  }

  const patch: BasicUiNodePatch = {};

  if (command.parentId !== existing.parentId) {
    patch.parentId = command.parentId;
  }

  if (command.type !== existing.type) {
    patch.type = command.type;
  }

  if (command.action !== existing.action) {
    patch.action = command.action ?? null;
  }

  if (command.text !== null) {
    if (command.text === "") {
      patch.text = null;
    } else if (command.text !== existing.text) {
      patch.text = command.text;
    }
  }

  if (command.props !== undefined) {
    patch.props = command.props;
  }

  return patch;
}

function applyNodePatch(
  existing: BasicUiFlatNode,
  patch: BasicUiNodePatch,
): BasicUiFlatNode {
  const next: BasicUiFlatNode = { ...existing };

  if ("parentId" in patch) {
    next.parentId = patch.parentId ?? null;
  }

  for (const key of CLEARABLE_PATCH_KEYS) {
    if (!(key in patch)) {
      continue;
    }

    const value = patch[key];
    if (value === null || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }

  if ("props" in patch) {
    if (patch.props === null) {
      delete next.props;
    } else if (patch.props !== undefined) {
      next.props = deepMergeProps(existing.props, patch.props);
    }
  }

  return next;
}

function applyBasicUiCommand(
  nodes: BasicUiFlatNode[],
  command: BasicUiCommand,
): BasicUiFlatNode[] {
  if (command.op === "createNode") {
    if (nodes.some((candidate) => candidate.id === command.id)) {
      return nodes;
    }

    return [...nodes, nodeFromCreateCommand(command)];
  }

  if (command.op === "updateNode") {
    const existing = nodes.find((candidate) => candidate.id === command.id);
    const patch = buildUpdatePatch(existing, command);
    const node = applyNodePatch(
      existing ?? { id: command.id, parentId: null },
      patch,
    );
    const descendantIds =
      command.children === null ? getSubtreeIds(nodes, command.id) : new Set();
    descendantIds.delete(command.id);

    if (existing) {
      return nodes
        .filter((candidate) => !descendantIds.has(candidate.id))
        .map((candidate) => (candidate.id === command.id ? node : candidate));
    }

    return [...nodes, node];
  }

  if (command.op === "removeNode") {
    const subtreeIds = getSubtreeIds(nodes, command.targetId);
    return nodes.filter((node) => !subtreeIds.has(node.id));
  }

  return nodes;
}

export function applyBasicUiCommands(
  nodes: BasicUiFlatNode[],
  commands: BasicUiCommand[],
): BasicUiFlatNode[] {
  return commands.reduce(applyBasicUiCommand, nodes);
}

export function flatNodesToBasicUiNode(
  nodes: BasicUiFlatNode[],
): BasicUiNode | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rootNodes = nodes.filter(
    (node) => node.parentId === null && !isTextNode(node),
  );

  function buildNode(
    id: string,
    ancestry = new Set<string>(),
  ): BasicUiNode | null {
    const node = byId.get(id);

    if (!node || isTextNode(node) || ancestry.has(id)) {
      return null;
    }

    const nextAncestry = new Set(ancestry);
    nextAncestry.add(id);

    const childNodes = nodes
      .filter((child) => child.parentId === id)
      .map((child) =>
        isTextNode(child)
          ? (child.text ?? "")
          : buildNode(child.id, nextAncestry),
      )
      .filter((child): child is BasicUiNode | string => child !== null);
    const children =
      node.text !== undefined ? [node.text, ...childNodes] : childNodes;

    return {
      type: node.type ?? "div",
      ...(node.action ? { action: node.action } : {}),
      props: {
        ...(node.props ?? {}),
        "data-ui-id": node.id,
      },
      ...(children.length > 0 ? { children } : {}),
    };
  }

  const roots = rootNodes
    .map((node) => buildNode(node.id))
    .filter((node): node is BasicUiNode => node !== null);

  if (roots.length === 0) {
    return null;
  }

  return roots.length === 1
    ? roots[0]
    : {
        type: "div",
        children: roots,
      };
}
