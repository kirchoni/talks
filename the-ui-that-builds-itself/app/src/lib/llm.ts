import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  generateText,
  Output,
  stepCountIs,
  streamText,
  type ModelMessage,
} from "ai";

import {
  getDesignSystemCatalogText,
  getDesignTokensText,
  readCapabilityCatalog,
} from "@/lib/catalog";
import { createAiSdkTelemetrySettings } from "@/lib/observability";
import type { StreamTextLogSource } from "@/lib/observability";
import {
  getBasicUiCommandArrayOutput,
  getTreeUINodeSchema,
} from "@/lib/schema";
import { uiGenerationTools } from "@/lib/tools";
import type { BasicUiCommand } from "@/lib/ui";
import type { ClientDemoState } from "@/templates/demo-state";

const defaultModel = "openai/gpt-5.4-nano";
const uiGenerationStepLimit = 8;

export type StreamUiCommandsResult = {
  elementStream: AsyncIterable<BasicUiCommand>;
  output: PromiseLike<BasicUiCommand[]>;
  response: PromiseLike<{ messages?: unknown }>;
} & Omit<StreamTextLogSource, "output" | "response">;

export const uiGenerationSystemPrompt = `
You generate full-screen, data-rich, coherent Dynamic User Interface.

Update after each action.
Always query for relevant data files.

Each action should be rendered as a form with a submit button.
Include a named field for every required parameter; optional parameters only when the user should choose a value.
Buttons outside of forms are forbidden.
Use React props for validation, formatting, and enforcing constraints.
When a parameter value is already known from the session snapshot or prior results, include it as a named hidden form field; JSON-stringify object values into defaultValue.
`.trim();

function getOpenRouterModel(modelName: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return createOpenRouter({
    apiKey,
    appName: "The UI That Builds Itself",
    appUrl: "http://localhost:3000",
  })(modelName);
}

export function getUiGenerationModelName() {
  return process.env.OPENROUTER_MODEL ?? defaultModel;
}

export async function buildInitialMessages({
  prompt,
  state,
}: {
  prompt: string;
  state: ClientDemoState;
}): Promise<ModelMessage[]> {
  const capabilities = await readCapabilityCatalog();

  return [
    { role: "system", content: uiGenerationSystemPrompt },
    {
      role: "user",
      content: `Available capabilities:\n\n${JSON.stringify(
        capabilities,
        null,
        2,
      )}`,
    },
    {
      role: "user",
      content: `Available design-system components:\n\n${getDesignSystemCatalogText()}`,
    },
    {
      role: "user",
      content: `Design tokens:\n\n${getDesignTokensText()}`,
    },
    {
      role: "user",
      content: `Current session snapshot:\n\n${JSON.stringify(state, null, 2)}`,
    },
    {
      role: "user",
      content: `User intent:\n\n${prompt}`,
    },
  ];
}

export function buildActionMessages({
  actionResponse,
  state,
}: {
  actionResponse: unknown;
  state: ClientDemoState;
}): ModelMessage[] {
  return [
    {
      role: "user",
      content: `User action response:\n\n${JSON.stringify(actionResponse, null, 2)}`,
    },
    {
      role: "user",
      content: `Current session snapshot:\n\n${JSON.stringify(state, null, 2)}`,
    },
  ];
}

export function readOutputMessages(result: {
  response?: { messages?: unknown };
}) {
  if (Array.isArray(result.response?.messages)) {
    return result.response.messages as ModelMessage[];
  }

  throw new Error("The model response did not include assistant messages.");
}

export function generateUiTree({
  inputMessages,
  modelName,
}: {
  inputMessages: ModelMessage[];
  modelName: string;
}) {
  return generateText({
    model: getOpenRouterModel(modelName),
    messages: inputMessages,
    tools: uiGenerationTools,
    allowSystemInMessages: true,
    experimental_telemetry: createAiSdkTelemetrySettings({
      functionId: "generate-ui.generate",
      metadata: {
        modelName,
        route: "/api/generate-ui",
      },
    }),
    output: Output.object({
      schema: getTreeUINodeSchema(),
      name: "basic_ui_node",
      description: "A renderable React-like UI tree.",
    }),
    stopWhen: stepCountIs(uiGenerationStepLimit),
  });
}

export function streamUiCommands({
  inputMessages,
  modelName,
}: {
  inputMessages: ModelMessage[];
  modelName: string;
}) {
  return streamText({
    model: getOpenRouterModel(modelName),
    messages: inputMessages,
    tools: uiGenerationTools,
    allowSystemInMessages: true,
    experimental_telemetry: createAiSdkTelemetrySettings({
      functionId: "generate-ui.patch",
      metadata: {
        modelName,
        route: "/api/generate-ui",
      },
    }),
    output: getBasicUiCommandArrayOutput(),
    stopWhen: stepCountIs(uiGenerationStepLimit),
  }) as unknown as StreamUiCommandsResult;
}
