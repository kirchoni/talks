"use client";

import { useEffect, useRef } from "react";

import type { BasicUiCommand, BasicUiFlatNode, BasicUiNode } from "@/lib/ui";

import { JsonCodeBlock } from "./json-code-block";
import { ReplayControls } from "./replay-controls";
import type {
  ReplayMachineState,
  ReplayPosition,
  ThreadTurn,
} from "./replay-machine";
import styles from "./thread-panel.module.css";

type ThreadPanelProps = {
  replay: ReplayMachineState;
  onReplayChange: (next: ReplayMachineState) => void;
  errorMessage?: string | null;
  modelName?: string | null;
  revealHiddenFields: boolean;
  onRevealHiddenFieldsChange: (enabled: boolean) => void;
};

function CommandList({
  commands,
  turnIndex,
  activeTarget,
}: {
  commands: BasicUiCommand[];
  turnIndex: number;
  activeTarget: ReplayPosition | null;
}) {
  if (commands.length === 0) {
    return <p className={styles.muted}>Waiting for UI commands…</p>;
  }

  return (
    <ol className={styles.commandList}>
      {commands.map((command, index) => {
        const isActive =
          activeTarget?.turnIndex === turnIndex &&
          activeTarget.commandIndex === index;

        return (
          <li
            key={`${command.op}-${index}`}
            data-replay-step={isActive ? "true" : undefined}
            className={isActive ? styles.commandActive : undefined}
          >
            <JsonCodeBlock value={command} />
          </li>
        );
      })}
    </ol>
  );
}

function NodeList({
  nodes,
  turnIndex,
  activeTarget,
}: {
  nodes: BasicUiFlatNode[];
  turnIndex: number;
  activeTarget: ReplayPosition | null;
}) {
  if (nodes.length === 0) {
    return <p className={styles.muted}>Waiting for UI nodes…</p>;
  }

  return (
    <ol className={styles.commandList}>
      {nodes.map((node, index) => {
        const isActive =
          activeTarget?.turnIndex === turnIndex &&
          activeTarget.commandIndex === index;

        return (
          <li
            key={`${node.id}-${index}`}
            data-replay-step={isActive ? "true" : undefined}
            className={isActive ? styles.commandActive : undefined}
          >
            <JsonCodeBlock value={node} />
          </li>
        );
      })}
    </ol>
  );
}

function TreeBlock({ root }: { root: BasicUiNode | null }) {
  if (!root) {
    return <p className={styles.muted}>Waiting for tree response…</p>;
  }

  return <JsonCodeBlock value={root} />;
}

function TurnBlock({
  turn,
  turnIndex,
  activeTarget,
}: {
  turn: ThreadTurn;
  turnIndex: number;
  activeTarget: ReplayPosition | null;
}) {
  const isActiveTurn =
    activeTarget?.turnIndex === turnIndex && activeTarget.commandIndex === -1;

  return (
    <article
      className={
        isActiveTurn ? `${styles.turn} ${styles.turnActive}` : styles.turn
      }
      data-replay-step={isActiveTurn ? "true" : undefined}
    >
      <header className={styles.turnHeader}>Turn {turnIndex + 1}</header>

      <section className={styles.messageUser}>
        <h3 className={styles.sectionTitle}>User</h3>
        {turn.user.prompt ? (
          <p className={styles.paragraph}>{turn.user.prompt}</p>
        ) : null}
        {turn.user.action ? (
          <div className={styles.actionBlock}>
            <p className={styles.paragraph}>
              Action: <code>{turn.user.action.name}</code>
            </p>
            <JsonCodeBlock value={turn.user.action.args} />
            <JsonCodeBlock value={turn.user.action.result} />
            {turn.user.action.statePatch ? (
              <JsonCodeBlock value={turn.user.action.statePatch} />
            ) : null}
          </div>
        ) : null}
        <details className={styles.stateDetails}>
          <summary>State snapshot</summary>
          <JsonCodeBlock value={turn.user.state} />
        </details>
      </section>

      <section className={styles.messageAssistant}>
        <h3 className={styles.sectionTitle}>Assistant</h3>
        <p className={styles.muted}>
          {turn.assistant.format === "tree"
            ? "Tree response"
            : turn.assistant.format === "nodes"
              ? "Streamed nodes"
              : "Streamed commands"}
        </p>
        {turn.assistant.format === "tree" ? (
          <TreeBlock root={turn.assistant.root} />
        ) : turn.assistant.format === "nodes" ? (
          <NodeList
            nodes={turn.assistant.nodes}
            turnIndex={turnIndex}
            activeTarget={activeTarget}
          />
        ) : (
          <CommandList
            commands={turn.assistant.commands}
            turnIndex={turnIndex}
            activeTarget={activeTarget}
          />
        )}
      </section>
    </article>
  );
}

export function ThreadPanel({
  replay,
  onReplayChange,
  errorMessage,
  modelName,
  revealHiddenFields,
  onRevealHiddenFieldsChange,
}: ThreadPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTarget = replay.viewingPosition;
  const activeTargetKey = activeTarget
    ? `${activeTarget.turnIndex}:${activeTarget.commandIndex}`
    : null;

  useEffect(() => {
    if (!activeTargetKey || !scrollRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector(
        '[data-replay-step="true"]',
      );
      target?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeTargetKey]);

  return (
    <aside className={styles.root} aria-label="Thread mirror">
      <header className={styles.header}>
        <h2 className={styles.headerTitle}>Thread</h2>
        {modelName ? <span>{modelName}</span> : null}
      </header>

      <label className={styles.revealToggle}>
        <input
          type="checkbox"
          checked={revealHiddenFields}
          onChange={(event) => onRevealHiddenFieldsChange(event.target.checked)}
        />
        <span>Reveal hidden fields</span>
      </label>

      <div ref={scrollRef} className={styles.scroll}>
        {replay.turns.length === 0 ? (
          <p className={styles.muted}>No turns yet.</p>
        ) : (
          replay.turns.map((turn, index) => (
            <TurnBlock
              key={turn.id}
              turn={turn}
              turnIndex={index}
              activeTarget={activeTarget}
            />
          ))
        )}

        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      <ReplayControls replay={replay} onReplayChange={onReplayChange} />
    </aside>
  );
}
