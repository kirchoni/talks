"use client";

import { type FormEvent, type ReactNode } from "react";

import { Button, Input } from "@/components";

import { AvatarMenu } from "./avatar-menu";
import type { ClientDemoState } from "./demo-state";
import styles from "./boxel-shell.module.css";

type BoxelShellProps = {
  children: ReactNode;
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  clientState: ClientDemoState;
  onClientStateChange: (state: ClientDemoState) => void;
  threadOpen: boolean;
  onThreadToggle: () => void;
  onResetState: () => void;
  sidePanel?: ReactNode;
};

export function BoxelShell({
  children,
  prompt,
  onPromptChange,
  onSubmit,
  isLoading,
  clientState,
  onClientStateChange,
  threadOpen,
  onThreadToggle,
  onResetState,
  sidePanel,
}: BoxelShellProps) {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img
            className={`${styles.logo} ${styles.logoDark}`}
            src="/brand/boxel-logo-dark.png"
            alt="Boxel"
            width={96}
            height={28}
          />
          <img
            className={`${styles.logo} ${styles.logoLight}`}
            src="/brand/boxel-logo-light.png"
            alt="Boxel"
            width={96}
            height={28}
          />
        </div>

        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="ghost"
            className={threadOpen ? "bg-surface-alt" : undefined}
            aria-pressed={threadOpen}
            onClick={onThreadToggle}
          >
            Thread
          </Button>
          <AvatarMenu
            clientState={clientState}
            onClientStateChange={onClientStateChange}
            onResetState={onResetState}
            disabled={isLoading}
          />
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.stage}>{children}</main>
        {threadOpen && sidePanel ? (
          <div className={styles.sidePanel}>{sidePanel}</div>
        ) : null}
      </div>

      <footer className={styles.promptBar}>
        <form className={styles.promptForm} onSubmit={onSubmit}>
          <Input
            id="demo-prompt"
            name="prompt"
            type="text"
            value={prompt}
            placeholder="I want to purchase a license"
            onChange={(event) => onPromptChange(event.target.value)}
            disabled={isLoading}
            className="rounded-full px-4"
          />
          <Button type="submit" disabled={isLoading} className="shrink-0">
            {isLoading ? "Generating…" : "Go"}
          </Button>
        </form>
      </footer>
    </div>
  );
}
