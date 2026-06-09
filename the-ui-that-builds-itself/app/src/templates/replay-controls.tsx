"use client";

import {
  getReplayBounds,
  isViewingLive,
  returnToLive,
  stepReplay,
  type ReplayMachineState,
} from "./replay-machine";
import { Button } from "@/components";
import styles from "./replay-controls.module.css";

type ReplayControlsProps = {
  replay: ReplayMachineState;
  onReplayChange: (next: ReplayMachineState) => void;
};

export function ReplayControls({
  replay,
  onReplayChange,
}: ReplayControlsProps) {
  const { snapshotCount } = getReplayBounds(replay);
  const live = isViewingLive(replay);

  if (snapshotCount === 0) {
    return null;
  }

  const currentIndex = live
    ? snapshotCount - 1
    : replay.snapshots.findIndex(
        (snapshot) =>
          snapshot.turnIndex === replay.viewingPosition!.turnIndex &&
          snapshot.commandIndex === replay.viewingPosition!.commandIndex,
      );

  const activeSnapshot = replay.snapshots[Math.max(0, currentIndex)];

  return (
    <section className={styles.root} aria-label="Replay controls">
      <div className={styles.row}>
        <Button
          type="button"
          variant="ghost"
          disabled={currentIndex <= 0}
          onClick={() => onReplayChange(stepReplay(replay, -1))}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={currentIndex >= snapshotCount - 1}
          onClick={() => onReplayChange(stepReplay(replay, 1))}
        >
          Next
        </Button>
        {!live ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onReplayChange(returnToLive(replay))}
          >
            Live
          </Button>
        ) : null}
      </div>
      <p className={styles.label}>{activeSnapshot?.label ?? "Replay"}</p>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={Math.max(0, snapshotCount - 1)}
        value={Math.max(0, currentIndex)}
        onChange={(event) => {
          const index = Number(event.target.value);
          const snapshot = replay.snapshots[index];
          if (!snapshot) {
            return;
          }

          onReplayChange({
            ...replay,
            viewingPosition: {
              turnIndex: snapshot.turnIndex,
              commandIndex: snapshot.commandIndex,
            },
          });
        }}
      />
    </section>
  );
}
