import { applyBasicUiCommands, flatNodesToBasicUiNode } from "@/lib/ui";
import type { BasicUiCommand, BasicUiFlatNode, BasicUiNode } from "@/lib/ui";

import type { ClientDemoState } from "./demo-state";

export type ThreadUserMessage = {
  prompt?: string;
  state: ClientDemoState;
  action?: {
    name: string;
    args: Record<string, string>;
    result: unknown;
    statePatch?: Record<string, unknown> | null;
  };
};

export type ThreadAssistantMessage =
  | {
      format: "tree";
      root: BasicUiNode | null;
    }
  | {
      format: "nodes";
      nodes: BasicUiFlatNode[];
    }
  | {
      format: "stream";
      commands: BasicUiCommand[];
    };

export type ThreadTurn = {
  id: string;
  user: ThreadUserMessage;
  assistant: ThreadAssistantMessage;
};

export type ReplaySnapshot = {
  turnIndex: number;
  commandIndex: number;
  flatNodes: BasicUiFlatNode[];
  root: BasicUiNode | null;
  // prev: llmCss: string;
  label: string;
  highlightIds: string[];
};

export type ReplayPosition = {
  turnIndex: number;
  commandIndex: number;
};

export type ReplayMachineState = {
  turns: ThreadTurn[];
  snapshots: ReplaySnapshot[];
  // prev: cssByTurn: string[];
  livePosition: ReplayPosition | null;
  viewingPosition: ReplayPosition | null;
};

function isElementNode(node: BasicUiFlatNode) {
  return node.type !== undefined;
}

function isNodePayloadCommand(
  command: BasicUiCommand,
): command is Extract<BasicUiCommand, { id: string }> {
  return "id" in command;
}

function isTargetCommand(
  command: BasicUiCommand,
): command is Extract<BasicUiCommand, { targetId: string }> {
  return "targetId" in command;
}

function highlightIdsForCommand(
  command: BasicUiCommand,
  before: BasicUiFlatNode[],
  after: BasicUiFlatNode[],
): string[] {
  if (command.op === "createNode" || command.op === "updateNode") {
    if (!isNodePayloadCommand(command)) {
      return [];
    }

    return after.some((node) => node.id === command.id) ? [command.id] : [];
  }

  if (command.op !== "removeNode" || !isTargetCommand(command)) {
    return [];
  }

  const target = before.find((node) => node.id === command.targetId);
  if (!target) {
    return [];
  }

  if (target.parentId && after.some((node) => node.id === target.parentId)) {
    return [target.parentId];
  }

  const sibling = after.find(
    (node) => node.parentId === target.parentId && isElementNode(node),
  );

  return sibling ? [sibling.id] : [];
}

function snapshotLabel(
  turnIndex: number,
  commandIndex: number,
  item?: BasicUiCommand | BasicUiFlatNode,
) {
  if (commandIndex < 0) {
    return turnIndex === 0
      ? "Before generation"
      : `Turn ${turnIndex + 1} start`;
  }

  if (!item) {
    return `Turn ${turnIndex + 1} complete`;
  }

  return "op" in item
    ? `Turn ${turnIndex + 1} · ${item.op}`
    : `Turn ${turnIndex + 1} · node`;
}

function buildSnapshots(turns: ThreadTurn[]): ReplaySnapshot[] {
  const snapshots: ReplaySnapshot[] = [];
  let flatNodes: BasicUiFlatNode[] = [];

  turns.forEach((turn, turnIndex) => {
    if (turn.assistant.format === "nodes") {
      flatNodes = [];
    }

    snapshots.push({
      turnIndex,
      commandIndex: -1,
      flatNodes: [...flatNodes],
      root: flatNodesToBasicUiNode(flatNodes),
      label: snapshotLabel(turnIndex, -1),
      highlightIds: [],
    });

    if (turn.assistant.format === "tree") {
      snapshots.push({
        turnIndex,
        commandIndex: 0,
        flatNodes: [...flatNodes],
        root: turn.assistant.root,
        label: `Turn ${turnIndex + 1} · tree`,
        highlightIds: [],
      });
      return;
    }

    if (turn.assistant.format === "nodes") {
      turn.assistant.nodes.forEach((node, nodeIndex) => {
        flatNodes = [...flatNodes, node];
        snapshots.push({
          turnIndex,
          commandIndex: nodeIndex,
          flatNodes: [...flatNodes],
          root: flatNodesToBasicUiNode(flatNodes),
          label: snapshotLabel(turnIndex, nodeIndex, node),
          highlightIds: [node.id],
        });
      });
      return;
    }

    turn.assistant.commands.forEach((command, commandIndex) => {
      const before = flatNodes;
      flatNodes = applyBasicUiCommands(flatNodes, [command]);
      snapshots.push({
        turnIndex,
        commandIndex,
        flatNodes: [...flatNodes],
        root: flatNodesToBasicUiNode(flatNodes),
        label: snapshotLabel(turnIndex, commandIndex, command),
        highlightIds: highlightIdsForCommand(command, before, flatNodes),
      });
    });
  });

  return snapshots;
}

export function createReplayMachineState(): ReplayMachineState {
  return {
    turns: [],
    snapshots: [],
    livePosition: null,
    viewingPosition: null,
  };
}

export function startThreadTurn(
  state: ReplayMachineState,
  user: ThreadUserMessage,
  format: ThreadAssistantMessage["format"] = "stream",
): ReplayMachineState {
  const turn: ThreadTurn = {
    id: `turn-${state.turns.length + 1}`,
    user,
    assistant:
      format === "tree"
        ? {
            format,
            root: null,
          }
        : format === "nodes"
          ? {
              format,
              nodes: [],
            }
          : {
              format,
              commands: [],
            },
  };

  return {
    ...state,
    turns: [...state.turns, turn],
    viewingPosition: null,
  };
}

export function appendThreadNode(
  state: ReplayMachineState,
  node: BasicUiFlatNode,
): ReplayMachineState {
  const turns = [...state.turns];
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return state;
  }

  const nodes =
    lastTurn.assistant.format === "nodes"
      ? [...lastTurn.assistant.nodes, node]
      : [node];
  const nextTurn: ThreadTurn = {
    ...lastTurn,
    assistant: {
      format: "nodes",
      nodes,
    },
  };

  turns[turns.length - 1] = nextTurn;

  const snapshots = buildSnapshots(turns);
  const livePosition: ReplayPosition = {
    turnIndex: turns.length - 1,
    commandIndex: nodes.length - 1,
  };

  return {
    turns,
    snapshots,
    livePosition,
    viewingPosition: null,
  };
}

export function finalizeThreadNodes(
  state: ReplayMachineState,
  nodes: BasicUiFlatNode[],
): ReplayMachineState {
  const turns = [...state.turns];
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return state;
  }

  const nextTurn: ThreadTurn = {
    ...lastTurn,
    assistant: {
      format: "nodes",
      nodes,
    },
  };

  turns[turns.length - 1] = nextTurn;

  const snapshots = buildSnapshots(turns);
  const livePosition: ReplayPosition = {
    turnIndex: turns.length - 1,
    commandIndex: nodes.length > 0 ? nodes.length - 1 : -1,
  };

  return {
    turns,
    snapshots,
    livePosition,
    viewingPosition: null,
  };
}

export function appendThreadCommand(
  state: ReplayMachineState,
  command: BasicUiCommand,
): ReplayMachineState {
  const turns = [...state.turns];
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return state;
  }

  const commands =
    lastTurn.assistant.format === "stream"
      ? [...lastTurn.assistant.commands, command]
      : [command];
  const nextTurn: ThreadTurn = {
    ...lastTurn,
    assistant: {
      format: "stream",
      commands,
    },
  };

  turns[turns.length - 1] = nextTurn;

  const snapshots = buildSnapshots(turns);
  const livePosition: ReplayPosition = {
    turnIndex: turns.length - 1,
    commandIndex: commands.length - 1,
  };

  return {
    turns,
    snapshots,
    livePosition,
    viewingPosition: null,
  };
}

export function finalizeThreadTurn(
  state: ReplayMachineState,
  commands: BasicUiCommand[],
): ReplayMachineState {
  const turns = [...state.turns];
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return state;
  }

  const nextTurn: ThreadTurn = {
    ...lastTurn,
    assistant: {
      format: "stream",
      commands,
    },
  };

  turns[turns.length - 1] = nextTurn;

  const snapshots = buildSnapshots(turns);
  const livePosition: ReplayPosition = {
    turnIndex: turns.length - 1,
    commandIndex: commands.length - 1,
  };

  return {
    turns,
    snapshots,
    livePosition,
    viewingPosition: null,
  };
}

export function finalizeThreadTree(
  state: ReplayMachineState,
  root: BasicUiNode | null,
): ReplayMachineState {
  const turns = [...state.turns];
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return state;
  }

  const nextTurn: ThreadTurn = {
    ...lastTurn,
    assistant: {
      format: "tree",
      root,
    },
  };

  turns[turns.length - 1] = nextTurn;

  const snapshots = buildSnapshots(turns);
  const livePosition: ReplayPosition = {
    turnIndex: turns.length - 1,
    commandIndex: 0,
  };

  return {
    turns,
    snapshots,
    livePosition,
    viewingPosition: null,
  };
}

export function setReplayPosition(
  state: ReplayMachineState,
  position: ReplayPosition | null,
): ReplayMachineState {
  return {
    ...state,
    viewingPosition: position,
  };
}

export function resetReplayMachine(): ReplayMachineState {
  return createReplayMachineState();
}

function findSnapshot(
  snapshots: ReplaySnapshot[],
  position: ReplayPosition,
): ReplaySnapshot | null {
  return (
    snapshots.find(
      (snapshot) =>
        snapshot.turnIndex === position.turnIndex &&
        snapshot.commandIndex === position.commandIndex,
    ) ?? null
  );
}

export function getActiveSnapshot(
  state: ReplayMachineState,
): ReplaySnapshot | null {
  const position = state.viewingPosition ?? state.livePosition;

  if (!position || state.snapshots.length === 0) {
    return null;
  }

  return findSnapshot(state.snapshots, position);
}

export function getActiveRoot(state: ReplayMachineState): BasicUiNode | null {
  const snapshot = getActiveSnapshot(state);
  return snapshot ? snapshot.root : null;
}

export function getReplayBounds(state: ReplayMachineState) {
  return {
    snapshotCount: state.snapshots.length,
    turnCount: state.turns.length,
  };
}

export function stepReplay(
  state: ReplayMachineState,
  direction: -1 | 1,
): ReplayMachineState {
  if (state.snapshots.length === 0) {
    return state;
  }

  const currentIndex = state.viewingPosition
    ? state.snapshots.findIndex(
        (snapshot) =>
          snapshot.turnIndex === state.viewingPosition!.turnIndex &&
          snapshot.commandIndex === state.viewingPosition!.commandIndex,
      )
    : state.snapshots.length - 1;

  const nextIndex = Math.max(
    0,
    Math.min(state.snapshots.length - 1, currentIndex + direction),
  );
  const snapshot = state.snapshots[nextIndex]!;

  return setReplayPosition(state, {
    turnIndex: snapshot.turnIndex,
    commandIndex: snapshot.commandIndex,
  });
}

export function jumpReplayToTurn(
  state: ReplayMachineState,
  turnIndex: number,
): ReplayMachineState {
  const snapshot = state.snapshots.find(
    (candidate) => candidate.turnIndex === turnIndex,
  );

  if (!snapshot) {
    return state;
  }

  return setReplayPosition(state, {
    turnIndex: snapshot.turnIndex,
    commandIndex: snapshot.commandIndex,
  });
}

export function returnToLive(state: ReplayMachineState): ReplayMachineState {
  return {
    ...state,
    viewingPosition: null,
  };
}

export function isViewingLive(state: ReplayMachineState) {
  return state.viewingPosition === null;
}
