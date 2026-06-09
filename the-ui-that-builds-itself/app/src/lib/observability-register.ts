const APP_NAME = "the-ui-that-builds-itself";
const OBSERVABILITY_JSON_INDENT = 2;
const GENAI_MESSAGE_ATTRIBUTES = [
  "gen_ai.input.messages",
  "gen_ai.output.messages",
] as const;

type ProgressObservability = typeof import("@progress/observability");

type GenAiMessagePart = {
  type: string;
  content?: unknown;
  [key: string]: unknown;
};

export type GenAiMessage = {
  role: string;
  parts: GenAiMessagePart[];
  finish_reason?: string;
};

type WritableSpan = {
  _attributes?: Record<string, unknown>;
};

type ExportableSpan = {
  name: string;
  attributes: Record<string, unknown>;
};

let progressObservability: ProgressObservability | null = null;
let bootstrapOnce: Promise<ProgressObservability> | null = null;

export function isAgentRunObservabilityEnabled() {
  return Boolean(
    process.env.OBSERVABILITY_API_KEY || process.env.OBSERVABILITY_ENDPOINT,
  );
}

function parseEmbeddedJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function stringifyObservabilityJson(value: unknown) {
  return JSON.stringify(value, null, OBSERVABILITY_JSON_INDENT);
}

function formatTextPartContent(value: unknown): unknown {
  if (typeof value === "string") {
    const parsed = parseEmbeddedJson(value);
    if (parsed !== value) {
      return stringifyObservabilityJson(parsed);
    }

    return value;
  }

  if (value !== null && typeof value === "object") {
    return stringifyObservabilityJson(value);
  }

  return value;
}

function textPart(content: unknown): GenAiMessagePart[] {
  return [{ type: "text", content: formatTextPartContent(content) }];
}

function normalizeObservabilityPart(
  value: unknown,
): GenAiMessagePart | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "text";
  const part: GenAiMessagePart = { type };

  if ("content" in record) {
    part.content =
      type === "text"
        ? formatTextPartContent(record.content)
        : record.content;
  } else if ("text" in record) {
    part.content =
      type === "text" ? formatTextPartContent(record.text) : record.text;
  }

  for (const [key, fieldValue] of Object.entries(record)) {
    if (key in part) {
      continue;
    }

    part[key] =
      key === "arguments" ? parseEmbeddedJson(fieldValue) : fieldValue;
  }

  return part;
}

export function messageFromUnknown(value: unknown): GenAiMessage | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const role = typeof record.role === "string" ? record.role : "user";
  const finishReason =
    typeof record.finish_reason === "string"
      ? record.finish_reason
      : undefined;

  if (Array.isArray(record.parts)) {
    const parts = record.parts
      .map((part) => normalizeObservabilityPart(part))
      .filter((part): part is GenAiMessagePart => Boolean(part));

    if (parts.length > 0) {
      return finishReason
        ? { role, parts, finish_reason: finishReason }
        : { role, parts };
    }
  }

  const content = record.content;

  if (typeof content === "string") {
    return { role, parts: textPart(content) };
  }

  if (Array.isArray(content)) {
    const parts = content
      .map((part) => normalizeObservabilityPart(part))
      .filter((part): part is GenAiMessagePart => Boolean(part));

    if (parts.length > 0) {
      return finishReason
        ? { role, parts, finish_reason: finishReason }
        : { role, parts };
    }
  }

  return undefined;
}

function normalizeObservabilityMessages(value: unknown): GenAiMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((message) => messageFromUnknown(message))
    .filter((message): message is GenAiMessage => Boolean(message));
}

function reformatGenAiMessagesAttribute(raw: string) {
  try {
    const parsed: unknown = JSON.parse(raw);
    const messages = normalizeObservabilityMessages(parsed);
    if (messages.length === 0) {
      return raw;
    }

    return stringifyObservabilityJson(messages);
  } catch {
    return raw;
  }
}

function getWritableSpanAttributes(span: WritableSpan) {
  return span._attributes ?? null;
}

function createGenAiMessageFormatProcessor() {
  return {
    onStart() {},
    onEnd(span: WritableSpan) {
      const attributes = getWritableSpanAttributes(span);
      if (!attributes) {
        return;
      }

      for (const key of GENAI_MESSAGE_ATTRIBUTES) {
        const value = attributes[key];
        if (typeof value === "string") {
          attributes[key] = reformatGenAiMessagesAttribute(value);
        }
      }
    },
    async shutdown() {},
    async forceFlush() {},
  };
}

function findTracerProvider(trace: {
  getTracerProvider: () => unknown;
}) {
  let provider = trace.getTracerProvider() as Record<string, unknown> | null;

  if (!provider) {
    return null;
  }

  for (const prop of [
    "_delegate",
    "_target",
    "provider",
    "_provider",
    "_tracerProvider",
    "tracerProvider",
  ]) {
    const delegate = provider[prop];
    if (
      delegate &&
      typeof delegate === "object" &&
      "_activeSpanProcessor" in (delegate as Record<string, unknown>)
    ) {
      provider = delegate as Record<string, unknown>;
      break;
    }
  }

  return provider;
}

function registerGenAiMessageFormatProcessor(
  processors: unknown[] | undefined,
) {
  if (!Array.isArray(processors)) {
    return;
  }

  processors.splice(2, 0, createGenAiMessageFormatProcessor());
}

function shouldExportSpan(span: ExportableSpan) {
  const attributes = span.attributes;

  if (typeof attributes["next.span_type"] === "string") {
    return false;
  }

  if (span.name === "openrouter.chat") {
    return true;
  }

  return Object.keys(attributes).some((key) => key.startsWith("gen_ai."));
}

function registerAiOnlySpanExportFilter(processors: unknown[] | undefined) {
  if (!Array.isArray(processors)) {
    return;
  }

  for (const processor of processors) {
    if (!processor || typeof processor !== "object") {
      continue;
    }

    const exportProcessor = processor as {
      constructor?: { name?: string };
      onEnd?: (span: ExportableSpan) => void;
    };
    const processorName = exportProcessor.constructor?.name ?? "";

    if (
      processorName !== "BatchSpanProcessor" &&
      processorName !== "SimpleSpanProcessor"
    ) {
      continue;
    }

    const originalOnEnd = exportProcessor.onEnd?.bind(exportProcessor);
    if (!originalOnEnd) {
      continue;
    }

    exportProcessor.onEnd = (span: ExportableSpan) => {
      if (shouldExportSpan(span)) {
        originalOnEnd(span);
      }
    };

    return;
  }
}

async function registerSpanProcessors() {
  const { trace } = await import("@progress/observability");
  const provider = findTracerProvider(trace);
  const processors = (
    provider?.["_activeSpanProcessor"] as
      | { _spanProcessors?: unknown[] }
      | undefined
  )?._spanProcessors;

  registerGenAiMessageFormatProcessor(processors);
  registerAiOnlySpanExportFilter(processors);
}

async function bootstrapProgressObservability() {
  if (bootstrapOnce) {
    return bootstrapOnce;
  }

  bootstrapOnce = (async () => {
    await import("@progress/observability/register/hooks");
    progressObservability = await import("@progress/observability");

    if (isAgentRunObservabilityEnabled()) {
      const { Observability, ObservabilityInstruments } = progressObservability;
      await Observability.instrument({
        appName: process.env.OBSERVABILITY_APP_NAME ?? APP_NAME,
        endpoint: process.env.OBSERVABILITY_ENDPOINT,
        apiKey: process.env.OBSERVABILITY_API_KEY,
        debug: process.env.OBSERVABILITY_DEBUG === "1",
        instruments: new Set([ObservabilityInstruments.OPENAI]),
      });
      await registerSpanProcessors();
    }

    return progressObservability;
  })();

  return bootstrapOnce;
}

export async function getProgressObservability() {
  return bootstrapProgressObservability();
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  await bootstrapProgressObservability();
}

export { APP_NAME };
