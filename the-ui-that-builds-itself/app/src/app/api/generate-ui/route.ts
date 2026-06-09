import {
  buildActionMessages,
  buildInitialMessages,
  generateUiTree,
  getUiGenerationModelName,
  readOutputMessages,
  streamUiCommands,
  uiGenerationSystemPrompt,
} from "@/lib/llm";
import { appendSessionMessages, loadOrCreateSession } from "@/lib/db";
import { logLlmRun, streamTextResultToLogPayload } from "@/lib/observability";
import { sseResponse } from "@/lib/sse";
import { createStyleStream } from "@/lib/styles";
import type { BasicUiFlatNode } from "@/lib/ui";
import {
  loggedOutClientState,
  normalizeClientState,
} from "@/templates/demo-state";

export const runtime = "nodejs";
export const maxDuration = 60;

function readFlatNodes(value: unknown): BasicUiFlatNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (node): node is BasicUiFlatNode =>
      typeof node === "object" &&
      node !== null &&
      typeof (node as BasicUiFlatNode).id === "string",
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  const debug = record.debug === true;
  const stream = record.stream === true;
  const state = normalizeClientState(record.state ?? loggedOutClientState);
  const sessionId =
    typeof record.sessionId === "string" ? record.sessionId.trim() : "";
  const isActionTurn = "actionResponse" in record;
  const actionResponse = isActionTurn ? record.actionResponse : null;
  const flatNodes = readFlatNodes(record.flatNodes);

  if (!prompt && !sessionId) {
    return Response.json(
      { error: "Add a prompt before generating UI." },
      { status: 400 },
    );
  }

  try {
    const modelName = getUiGenerationModelName();
    const session = await loadOrCreateSession({
      sessionId,
    });
    const input = isActionTurn
      ? buildActionMessages({ actionResponse, state })
      : await buildInitialMessages({
          prompt,
          state,
        });
    // The important stuff!
    const inputMessages = [...session.messages, ...input];

    if (stream) {
      return sseResponse(async (send) => {
        try {
          let finalCss = "";
          const result = await logLlmRun({
            writeDebugLog: debug,
            modelName,
            systemPrompt: uiGenerationSystemPrompt,
            userPrompt: JSON.stringify(inputMessages, null, 2),
            resultDetail: (result) => ({
              commandCount: result.output.length,
            }),
            run: async () => {
              const streamResult = streamUiCommands({
                inputMessages,
                modelName,
              });
              const styles = await createStyleStream(send, flatNodes);

              for await (const command of streamResult.elementStream) {
                send("command", command);
                await styles.onCommand(command);
              }

              const commands = await streamResult.output;
              finalCss = await styles.finish(commands);
              const response = await streamResult.response;
              const logPayload =
                await streamTextResultToLogPayload(streamResult);

              return {
                ...logPayload,
                output: commands,
                response,
              };
            },
          });
          const updatedSession = await appendSessionMessages({
            session,
            inputMessages,
            outputMessages: readOutputMessages(result),
          });

          send("done", {
            model: modelName,
            commands: result.output,
            css: finalCss || undefined,
            sessionId: updatedSession.id,
          });
        } catch (error) {
          send("error", {
            error:
              error instanceof Error ? error.message : "Failed to generate UI.",
          });
        }
      });
    }

    const result = await logLlmRun({
      writeDebugLog: debug,
      modelName,
      systemPrompt: uiGenerationSystemPrompt,
      userPrompt: JSON.stringify(inputMessages, null, 2),
      resultDetail: (result) => ({
        hasRoot: Boolean(result.output),
      }),
      run: () =>
        generateUiTree({
          inputMessages,
          modelName,
        }),
    });
    const updatedSession = await appendSessionMessages({
      session,
      inputMessages,
      outputMessages: readOutputMessages(result),
    });

    return Response.json({
      model: modelName,
      root: result.output,
      sessionId: updatedSession.id,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate UI.",
      },
      { status: 500 },
    );
  }
}
