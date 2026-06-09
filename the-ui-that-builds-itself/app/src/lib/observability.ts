import "server-only";

import type { TelemetrySettings } from "ai";

import {
  APP_NAME,
  getProgressObservability,
  isAgentRunObservabilityEnabled,
  messageFromUnknown,
  stringifyObservabilityJson,
  type GenAiMessage,
} from "@/lib/observability-register";

const SPAN_NAME = "openrouter.chat";

type ProgressObservability = typeof import("@progress/observability");

export type AgentRunLogEvent = {
  label: string;
  at: Date | string;
  detail?: unknown;
};

export { isAgentRunObservabilityEnabled };

export type AgentRunLogInput = {
  modelName: string;
  systemPrompt: string;
  userPrompt: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  events?: AgentRunLogEvent[];
  result?: unknown;
  caughtError?: unknown;
};

type AgentRunInput = AgentRunLogInput;

type LoggableResult = {
  steps?: unknown[];
  request?: unknown;
  response?: {
    id?: unknown;
    timestamp?: unknown;
    modelId?: unknown;
    headers?: unknown;
    messages?: unknown;
    body?: unknown;
  };
  totalUsage?: unknown;
  warnings?: unknown;
  providerMetadata?: unknown;
  output?: unknown;
  materializationErrors?: unknown;
};

export type StreamTextLogSource = {
  steps: PromiseLike<unknown[]>;
  request: PromiseLike<unknown>;
  response: PromiseLike<LoggableResult["response"]>;
  totalUsage: PromiseLike<unknown>;
  warnings: PromiseLike<unknown>;
  providerMetadata: PromiseLike<unknown>;
  output: PromiseLike<unknown>;
};

function shouldTraceLlmContent() {
  const raw = process.env.OBSERVABILITY_TRACE_CONTENT;
  if (raw === undefined) {
    return true;
  }

  const normalized = raw.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function createAiSdkTelemetrySettings({
  functionId,
  metadata,
}: {
  functionId: string;
  metadata?: TelemetrySettings["metadata"];
}): TelemetrySettings {
  const recordContent = shouldTraceLlmContent();

  return {
    isEnabled: isAgentRunObservabilityEnabled(),
    functionId,
    metadata,
    recordInputs: recordContent,
    recordOutputs: recordContent,
  };
}

function isoTimestamp(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function elapsedMs(start: string | undefined, end: string | undefined) {
  if (!start || !end) {
    return undefined;
  }

  const delta = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(delta) ? delta : undefined;
}

function toJson(value: unknown) {
  return JSON.stringify(
    value,
    (_key, val: unknown) => {
      if (val instanceof Date) {
        return val.toISOString();
      }
      if (typeof val === "bigint") {
        return val.toString();
      }
      return val;
    },
    2,
  );
}

function mdJsonSection(title: string, value: unknown) {
  return [`## ${title}`, "", "```json", toJson(value), "```", ""].join("\n");
}

function mdTextSection(title: string, body: string) {
  return [`## ${title}`, "", "```", body, "```", ""].join("\n");
}

function asLoggableResult(value: unknown): LoggableResult | undefined {
  return value && typeof value === "object"
    ? (value as LoggableResult)
    : undefined;
}

function serializeCaughtError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error), name: typeof error };
  }

  const record = error as Record<string, unknown>;
  const cause = record.cause;

  return {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? (error.stack ?? null) : null,
    name: error instanceof Error ? error.name : typeof error,
    cause:
      cause instanceof Error
        ? {
            message: cause.message,
            stack: cause.stack ?? null,
            name: cause.name,
          }
        : (cause ?? null),
    text: typeof record.text === "string" ? record.text : null,
    response: record.response ?? null,
    usage: record.usage ?? null,
    finishReason: record.finishReason ?? null,
  };
}

async function writeAgentRunLog(input: AgentRunInput) {
  const [{ mkdir, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const logsDir = path.join(process.cwd(), "logs");

  await mkdir(logsDir, { recursive: true });

  const writtenAt = new Date().toISOString();
  const startedAt = isoTimestamp(input.startedAt);
  const completedAt = isoTimestamp(input.completedAt);
  const durationMs = elapsedMs(startedAt, completedAt);
  const filepath = path.join(
    logsDir,
    `ui-generation-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
  );
  const result = asLoggableResult(input.result);
  const steps = Array.isArray(result?.steps) ? result.steps : undefined;
  const parts: string[] = [
    "# UI generation (LLM run)",
    "",
    `- **Written (UTC):** ${writtenAt}`,
  ];

  if (startedAt) parts.push(`- **Started (UTC):** ${startedAt}`);
  if (completedAt) parts.push(`- **Completed (UTC):** ${completedAt}`);
  if (durationMs !== undefined) parts.push(`- **Duration:** ${durationMs}ms`);
  parts.push(`- **Model id:** ${input.modelName}`);
  parts.push(`- **LLM rounds:** ${steps ? steps.length : "(not resolved)"}`);
  parts.push("");
  parts.push(mdTextSection("System prompt", input.systemPrompt));
  parts.push(mdTextSection("User prompt", input.userPrompt));

  if (input.events?.length) {
    parts.push(
      mdJsonSection(
        "Timeline",
        input.events.map((event) => {
          const at = isoTimestamp(event.at);
          return {
            ...event,
            at,
            elapsedMs: elapsedMs(startedAt, at) ?? null,
          };
        }),
      ),
    );
  }

  if (result) {
    parts.push(mdJsonSection("Request", result.request ?? null));
    parts.push(mdJsonSection("Response", result.response ?? null));
    parts.push(mdJsonSection("Total usage", result.totalUsage ?? null));
    parts.push(mdJsonSection("Warnings", result.warnings ?? null));
    parts.push(
      mdJsonSection("Provider metadata", result.providerMetadata ?? null),
    );
    if (result.output !== undefined) {
      parts.push(mdJsonSection("Structured output", result.output));
    }
    if (result.materializationErrors !== undefined) {
      parts.push(
        mdJsonSection(
          "Stream materialization errors",
          result.materializationErrors,
        ),
      );
    }
    if (steps) {
      parts.push(mdJsonSection("Steps", steps));
    }
  }

  if (input.caughtError !== undefined) {
    parts.push(
      mdJsonSection("Caught error", serializeCaughtError(input.caughtError)),
    );
  }

  await writeFile(filepath, parts.join("\n"), "utf8");
  return filepath;
}

function textPart(content: unknown): GenAiMessage["parts"] {
  return messageFromUnknown({ role: "assistant", content })?.parts ?? [];
}

type OpenRouterUsage = {
  costUsd?: number;
  promptCostUsd?: number;
  completionCostUsd?: number;
};

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function usageCostFromRecord(record: Record<string, unknown>): OpenRouterUsage {
  const costDetails = record.costDetails as Record<string, unknown> | undefined;
  return {
    costUsd: readNumber(record.cost),
    promptCostUsd:
      readNumber(costDetails?.upstreamInferencePromptCost) ??
      readNumber(costDetails?.upstream_inference_prompt_cost),
    completionCostUsd:
      readNumber(costDetails?.upstreamInferenceCompletionsCost) ??
      readNumber(costDetails?.upstream_inference_completions_cost),
  };
}

function mergeOpenRouterUsage(
  base: OpenRouterUsage,
  next: OpenRouterUsage,
): OpenRouterUsage {
  return {
    costUsd: (base.costUsd ?? 0) + (next.costUsd ?? 0) || undefined,
    promptCostUsd:
      (base.promptCostUsd ?? 0) + (next.promptCostUsd ?? 0) || undefined,
    completionCostUsd:
      (base.completionCostUsd ?? 0) + (next.completionCostUsd ?? 0) ||
      undefined,
  };
}

function extractOpenRouterUsage(result: unknown): OpenRouterUsage {
  if (!result || typeof result !== "object") {
    return {};
  }

  const record = result as Record<string, unknown>;
  const steps = record.steps;
  if (Array.isArray(steps)) {
    let usage: OpenRouterUsage = {};
    for (const step of steps) {
      if (!step || typeof step !== "object") {
        continue;
      }
      const metadata = (step as Record<string, unknown>).providerMetadata as
        | Record<string, unknown>
        | undefined;
      const openrouter = metadata?.openrouter as
        | Record<string, unknown>
        | undefined;
      const stepUsage = openrouter?.usage as
        | Record<string, unknown>
        | undefined;
      if (stepUsage) {
        usage = mergeOpenRouterUsage(usage, usageCostFromRecord(stepUsage));
      }
    }
    if (usage.costUsd !== undefined) {
      return usage;
    }
  }

  const metadata = record.providerMetadata as
    | Record<string, unknown>
    | undefined;
  const openrouter = metadata?.openrouter as
    | Record<string, unknown>
    | undefined;
  const usage = openrouter?.usage as Record<string, unknown> | undefined;

  return usage ? usageCostFromRecord(usage) : {};
}

function extractResponseModel(result: unknown, fallbackModel: string) {
  if (!result || typeof result !== "object") {
    return fallbackModel;
  }

  const response = (result as Record<string, unknown>).response;
  if (response && typeof response === "object") {
    const modelId = (response as Record<string, unknown>).modelId;
    if (typeof modelId === "string" && modelId.trim()) {
      return modelId;
    }
  }

  return fallbackModel;
}

function extractStructuredOutput(result: unknown) {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  return (result as LoggableResult).output;
}

function parseInputMessages(input: AgentRunInput): GenAiMessage[] {
  try {
    const parsed: unknown = JSON.parse(input.userPrompt);
    if (Array.isArray(parsed)) {
      const messages = parsed
        .map((message) => messageFromUnknown(message))
        .filter((message): message is GenAiMessage => Boolean(message));
      if (messages.length > 0) {
        return messages;
      }
    }
  } catch {}

  return [
    { role: "system", parts: textPart(input.systemPrompt) },
    { role: "user", parts: textPart(input.userPrompt) },
  ];
}

function extractOutputMessages(result: unknown): GenAiMessage[] {
  if (!result || typeof result !== "object") {
    return [];
  }

  const record = result as LoggableResult;
  const structuredOutput = extractStructuredOutput(result);

  if (structuredOutput !== undefined && structuredOutput !== null) {
    return [
      {
        role: "assistant",
        parts: [
          {
            type: "text",
            content: stringifyObservabilityJson(structuredOutput),
          },
        ],
        finish_reason: "stop",
      },
    ];
  }

  const response = record.response;
  if (!response || typeof response !== "object") {
    return [];
  }

  const messages = (response as Record<string, unknown>).messages;
  return Array.isArray(messages)
    ? messages
        .map((message) => messageFromUnknown(message))
        .filter((message): message is GenAiMessage => Boolean(message))
    : [];
}

function spanTime(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function buildSpanAttributes(input: AgentRunInput) {
  const usage = extractOpenRouterUsage(input.result);
  const attributes: Record<string, string | number | boolean> = {
    "observability.span.kind": "workflow",
    "traceloop.span.kind": "workflow",
    "llm.request.type": "chat",
    "gen_ai.provider.name": "OpenRouter",
    "gen_ai.system": "OpenRouter",
    "gen_ai.request.model": input.modelName,
    "gen_ai.response.model": extractResponseModel(
      input.result,
      input.modelName,
    ),
    "gen_ai.openai.api_base": "https://openrouter.ai/api/v1",
  };

  if (usage.costUsd !== undefined) {
    attributes["openrouter.usage.cost_usd"] = usage.costUsd;
  }
  if (usage.promptCostUsd !== undefined) {
    attributes["openrouter.usage.prompt_cost_usd"] = usage.promptCostUsd;
  }
  if (usage.completionCostUsd !== undefined) {
    attributes["openrouter.usage.completion_cost_usd"] =
      usage.completionCostUsd;
  }

  if (shouldTraceLlmContent()) {
    attributes["gen_ai.input.messages"] = stringifyObservabilityJson(
      parseInputMessages(input),
    );
    const outputMessages = extractOutputMessages(input.result);
    if (outputMessages.length > 0) {
      attributes["gen_ai.output.messages"] =
        stringifyObservabilityJson(outputMessages);
    }
  }

  return attributes;
}

function applyError(
  span: NonNullable<
    Awaited<ReturnType<ProgressObservability["trace"]["getActiveSpan"]>>
  >,
  error: unknown,
  SpanStatusCode: ProgressObservability["SpanStatusCode"],
) {
  const message = error instanceof Error ? error.message : String(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message });
  span.recordException(error instanceof Error ? error : new Error(message));
}

async function recordAgentRunObservability(input: AgentRunInput) {
  if (!isAgentRunObservabilityEnabled()) {
    return;
  }

  const { trace, SpanStatusCode } = await getProgressObservability();
  const attributes = buildSpanAttributes(input);
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttributes(attributes);
    if (input.caughtError !== undefined) {
      applyError(activeSpan, input.caughtError, SpanStatusCode);
    } else {
      activeSpan.setStatus({ code: SpanStatusCode.OK });
    }
    return;
  }

  const span = trace.getTracer(APP_NAME).startSpan(SPAN_NAME, {
    attributes,
    startTime: spanTime(input.startedAt),
  });

  if (input.caughtError !== undefined) {
    applyError(span, input.caughtError, SpanStatusCode);
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }

  span.end(spanTime(input.completedAt));
}

async function withAgentRunSpan<T>(
  input: Pick<AgentRunInput, "modelName" | "systemPrompt" | "userPrompt">,
  run: () => Promise<T>,
  beforeEnd: (
    outcome: { ok: true; value: T } | { ok: false; error: unknown },
  ) => void | Promise<void>,
) {
  if (!isAgentRunObservabilityEnabled()) {
    return run();
  }

  const { trace, SpanStatusCode } = await getProgressObservability();

  return trace.getTracer(APP_NAME).startActiveSpan(
    SPAN_NAME,
    {
      attributes: {
        "observability.span.kind": "workflow",
        "traceloop.span.kind": "workflow",
        "llm.request.type": "chat",
        "gen_ai.provider.name": "OpenRouter",
        "gen_ai.request.model": input.modelName,
      },
    },
    async (
      span: NonNullable<
        Awaited<ReturnType<ProgressObservability["trace"]["getActiveSpan"]>>
      >,
    ) => {
      try {
        const result = await run();
        await beforeEnd({ ok: true, value: result });
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        await beforeEnd({ ok: false, error });
        applyError(span, error, SpanStatusCode);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

export async function finalizeAgentRun(
  input: AgentRunInput,
  options: {
    onRunRecorded?: (input: AgentRunLogInput) => void | Promise<void>;
    recordObservability?: boolean;
  } = {},
) {
  const recordObservability =
    options.recordObservability ?? isAgentRunObservabilityEnabled();

  if (options.onRunRecorded) {
    try {
      await options.onRunRecorded(input);
    } catch (error) {
      console.error("[agent-run-log] Failed to write run log:", error);
    }
  }

  if (recordObservability) {
    try {
      await recordAgentRunObservability(input);
    } catch (error) {
      console.error("[agent-run-log] Failed to record observability:", error);
    }
  }
}

export async function logLlmRun<T>({
  writeDebugLog,
  modelName,
  resultDetail,
  run,
  systemPrompt,
  userPrompt,
}: {
  writeDebugLog?: boolean;
  modelName: string;
  systemPrompt: string;
  userPrompt: string;
  run: () => Promise<T>;
  resultDetail?: (result: T) => unknown;
}) {
  const onRunRecorded = writeDebugLog
    ? async (input: AgentRunLogInput) => {
        const pathWritten = await writeAgentRunLog(input);
        console.info(`[agent-run-log] Wrote LLM run log: ${pathWritten}`);
      }
    : undefined;
  const startedAt = new Date();
  const observabilityEnabled = isAgentRunObservabilityEnabled();
  const shouldFinalize = Boolean(onRunRecorded) || observabilityEnabled;
  const baseInput = { modelName, systemPrompt, userPrompt, startedAt };
  const eventsFor = (completedAt: Date, result: T): AgentRunLogEvent[] => [
    { label: "generateText:start", at: startedAt },
    {
      label: "generateText:complete",
      at: completedAt,
      detail: resultDetail?.(result),
    },
  ];

  try {
    const result = observabilityEnabled
      ? await withAgentRunSpan(baseInput, run, async (outcome) => {
          const completedAt = new Date();
          await recordAgentRunObservability(
            outcome.ok
              ? {
                  ...baseInput,
                  completedAt,
                  result: outcome.value,
                  events: eventsFor(completedAt, outcome.value),
                }
              : {
                  ...baseInput,
                  completedAt,
                  caughtError: outcome.error,
                },
          );
        })
      : await run();

    if (shouldFinalize) {
      const completedAt = new Date();
      await finalizeAgentRun(
        {
          ...baseInput,
          completedAt,
          result,
          events: eventsFor(completedAt, result),
        },
        {
          onRunRecorded,
          recordObservability: !observabilityEnabled,
        },
      );
    }

    return result;
  } catch (error) {
    if (shouldFinalize) {
      await finalizeAgentRun(
        {
          ...baseInput,
          completedAt: new Date(),
          caughtError: error,
        },
        {
          onRunRecorded,
          recordObservability: !observabilityEnabled,
        },
      );
    }
    throw error;
  }
}

export async function streamTextResultToLogPayload(
  result: StreamTextLogSource,
) {
  const settled = await Promise.allSettled([
    result.steps,
    result.request,
    result.response,
    result.totalUsage,
    result.warnings,
    result.providerMetadata,
    result.output,
  ]);
  const valueAt = (index: number) =>
    settled[index]?.status === "fulfilled" ? settled[index].value : undefined;
  const errorAt = (index: number) => {
    const item = settled[index];

    if (item?.status !== "rejected") {
      return undefined;
    }

    return item.reason instanceof Error
      ? item.reason.message
      : String(item.reason);
  };

  return {
    steps: valueAt(0),
    request: valueAt(1),
    response: valueAt(2),
    totalUsage: valueAt(3),
    warnings: valueAt(4),
    providerMetadata: valueAt(5),
    output: valueAt(6),
    materializationErrors: {
      steps: errorAt(0),
      request: errorAt(1),
      response: errorAt(2),
      totalUsage: errorAt(3),
      warnings: errorAt(4),
      providerMetadata: errorAt(5),
      output: errorAt(6),
    },
  };
}
