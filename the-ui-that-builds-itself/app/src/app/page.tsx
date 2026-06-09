"use client";

import { useEffect, useState, type FormEvent } from "react";

import { BoxelShell } from "@/templates/boxel-shell";
import {
  clientStateStorageKey,
  loggedOutClientState,
  normalizeClientState,
  preserveAuthClientState,
  type ClientDemoState,
} from "@/templates/demo-state";
import { EmptyState } from "@/templates/empty-state";
import {
  appendThreadCommand,
  createReplayMachineState,
  finalizeThreadTree,
  finalizeThreadTurn,
  getActiveRoot,
  isViewingLive,
  resetReplayMachine,
  startThreadTurn,
  type ReplayMachineState,
  ThreadPanel,
} from "@/templates/debug";
import { OutputShadow } from "@/templates/output-shadow";
import { RevealHiddenFieldsProvider } from "@/templates/reveal-hidden-fields";
import {
  executeAction,
  readGeneratedUiCommandStream,
  renderBasicUiNode,
  statePatchFrom,
  type BasicUiFlatNode,
  type BasicUiNode,
} from "./client";
import styles from "./page.module.css";

type GenerationState = "idle" | "loading" | "done" | "error";

function persistAuthClientState(state: ClientDemoState) {
  const authOnlyState = preserveAuthClientState(state);

  if (authOnlyState.user) {
    window.localStorage.setItem(
      clientStateStorageKey,
      JSON.stringify(authOnlyState),
    );
  } else {
    window.localStorage.removeItem(clientStateStorageKey);
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState("I want to purchase a license");
  const [status, setStatus] = useState<GenerationState>("idle");
  const [root, setRoot] = useState<BasicUiNode | null>(null);
  const [flatNodes, setFlatNodes] = useState<BasicUiFlatNode[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [clientState, setClientState] =
    useState<ClientDemoState>(loggedOutClientState);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [css, setCss] = useState("");
  const [threadOpen, setThreadOpen] = useState(false);
  const [revealHiddenFields, setRevealHiddenFields] = useState(false);
  const [replay, setReplay] = useState<ReplayMachineState>(() =>
    createReplayMachineState(),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(clientStateStorageKey);
    if (!stored) {
      return;
    }

    try {
      setClientState(
        preserveAuthClientState(normalizeClientState(JSON.parse(stored))),
      );
    } catch {
      window.localStorage.removeItem(clientStateStorageKey);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "t" && event.shiftKey && event.metaKey) {
        event.preventDefault();
        setThreadOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function resetDemoState() {
    const authOnlyState = preserveAuthClientState(clientState);

    setRoot(null);
    setFlatNodes([]);
    setCss("");
    setStatus("idle");
    setErrorMessage(null);
    setModelName(null);
    setSessionId(null);
    setReplay(resetReplayMachine());
    setClientState(authOnlyState);
    persistAuthClientState(authOnlyState);
  }

  async function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setStatus("error");
      setErrorMessage("Add a prompt before generating UI.");
      return;
    }

    setStatus("loading");
    setRoot(null);
    setFlatNodes([]);
    setCss("");
    setErrorMessage(null);
    setModelName(null);
    setSessionId(null);
    setReplay(
      startThreadTurn(
        resetReplayMachine(),
        {
          prompt: trimmedPrompt,
          state: clientState,
        },
        "stream",
      ),
    );

    try {
      const response = await fetch("/api/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          state: clientState,
          debug: true,
          stream: true,
          flatNodes: [],
        }),
      });

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        await readGeneratedUiCommandStream(response, {
          baseNodes: [],
          onCommand(command, nodes, nextRoot) {
            setFlatNodes(nodes);
            setRoot(nextRoot);
            setReplay((current) => appendThreadCommand(current, command));
          },
          onCss: setCss,
          onDone(doneEvent, nodes, finalRoot, commands) {
            setFlatNodes(nodes);
            setRoot(finalRoot);
            setModelName(doneEvent.model ?? null);
            setSessionId(doneEvent.sessionId ?? null);
            setReplay((current) => finalizeThreadTurn(current, commands));
            setStatus("done");
          },
        });

        return;
      }

      const payload = (await response.json()) as {
        root?: BasicUiNode;
        model?: string;
        sessionId?: string;
        error?: string;
      };

      if (!response.ok || !payload.root) {
        throw new Error(payload.error ?? "Failed to generate UI.");
      }

      setRoot(payload.root);
      setFlatNodes([]);
      setModelName(payload.model ?? null);
      setSessionId(payload.sessionId ?? null);
      setReplay((current) => finalizeThreadTree(current, payload.root ?? null));
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate UI.",
      );
    }
  }

  async function handleAction(action: string, args: Record<string, string>) {
    setErrorMessage(null);

    try {
      const response = await executeAction(action, args, clientState);
      const statePatch = statePatchFrom(response);
      const nextState = {
        ...clientState,
        ...(statePatch ?? {}),
      };
      const actionTurn = {
        name: response.action,
        args,
        result: response.result,
        statePatch,
      };

      if (statePatch) {
        setClientState(nextState);
        persistAuthClientState(nextState);
      }

      setStatus("loading");
      setModelName(null);
      const baseNodes = flatNodes;

      setReplay((current) =>
        startThreadTurn(
          current,
          {
            state: nextState,
            action: actionTurn,
          },
          "stream",
        ),
      );

      const nextResponse = await fetch("/api/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          state: nextState,
          sessionId,
          actionResponse: response,
          debug: true,
          stream: true,
          flatNodes: baseNodes,
        }),
      });

      if (
        nextResponse.headers.get("content-type")?.includes("text/event-stream")
      ) {
        await readGeneratedUiCommandStream(nextResponse, {
          baseNodes,
          onCommand(command, nodes, nextRoot) {
            setFlatNodes(nodes);
            setRoot(nextRoot);
            setReplay((current) => appendThreadCommand(current, command));
          },
          onCss: setCss,
          onDone(doneEvent, nodes, finalRoot, commands) {
            setFlatNodes(nodes);
            setRoot(finalRoot);
            setModelName(doneEvent.model ?? null);
            setSessionId(doneEvent.sessionId ?? null);
            setReplay((current) => finalizeThreadTurn(current, commands));
            setStatus("done");
          },
        });

        return;
      }

      const nextPayload = (await nextResponse.json()) as {
        root?: BasicUiNode;
        model?: string;
        sessionId?: string;
        error?: string;
      };

      if (!nextResponse.ok || !nextPayload.root) {
        throw new Error(nextPayload.error ?? "Failed to generate UI.");
      }

      setRoot(nextPayload.root);
      setFlatNodes([]);
      setModelName(nextPayload.model ?? null);
      setSessionId(nextPayload.sessionId ?? null);
      setReplay((current) =>
        finalizeThreadTree(current, nextPayload.root ?? null),
      );
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to run action.",
      );
    }
  }

  const viewingLive = isViewingLive(replay);
  const replayRoot = getActiveRoot(replay);
  const displayRoot = viewingLive ? root : replayRoot;
  const onAction = viewingLive ? handleAction : undefined;

  return (
    <BoxelShell
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={submitPrompt}
      isLoading={status === "loading"}
      clientState={clientState}
      onClientStateChange={setClientState}
      threadOpen={threadOpen}
      onThreadToggle={() => setThreadOpen((value) => !value)}
      onResetState={resetDemoState}
      sidePanel={
        <ThreadPanel
          replay={replay}
          onReplayChange={setReplay}
          errorMessage={errorMessage}
          modelName={modelName}
          revealHiddenFields={revealHiddenFields}
          onRevealHiddenFieldsChange={setRevealHiddenFields}
        />
      }
    >
      {!displayRoot && status !== "loading" ? <EmptyState /> : null}

      {displayRoot ? (
        <OutputShadow css={css}>
          <RevealHiddenFieldsProvider enabled={revealHiddenFields}>
            {renderBasicUiNode(displayRoot, onAction)}
          </RevealHiddenFieldsProvider>
        </OutputShadow>
      ) : null}

      {!displayRoot && status === "loading" ? (
        <p className={styles.loading}>Waiting for the model.</p>
      ) : null}
    </BoxelShell>
  );
}
