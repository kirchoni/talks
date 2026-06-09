import { jsonSchema, tool } from "ai";

import { queryData, readDataResource } from "@/lib/parag";

const queryDataInputSchema = jsonSchema<{ query: string }>(
  {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Specific app data to find.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  {
    validate(value) {
      const record =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};

      if (typeof record.query === "string") {
        return { success: true, value: { query: record.query } };
      }

      return {
        success: false,
        error: new Error("queryData requires a query string."),
      };
    },
  },
);

const readDataResourceInputSchema = jsonSchema<{
  resourceId: string;
  fieldId: string;
}>(
  {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "Resource id returned by queryData.",
      },
      fieldId: {
        type: "string",
        description:
          "Field id from queryData. You may pass a bare file field id, a /f/... file field path, or /a/title to read the resource's first file.",
      },
    },
    required: ["resourceId", "fieldId"],
    additionalProperties: false,
  },
  {
    validate(value) {
      const record =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};

      if (
        typeof record.resourceId === "string" &&
        typeof record.fieldId === "string"
      ) {
        return {
          success: true,
          value: {
            resourceId: record.resourceId,
            fieldId: record.fieldId,
          },
        };
      }

      return {
        success: false,
        error: new Error(
          "readDataResource requires resourceId and fieldId strings.",
        ),
      };
    },
  },
);

export const uiGenerationTools = {
  queryData: tool({
    description:
      "Search app data. Returns compact Progress Agentic RAG results: resource ids, titles, mime types, and matched paragraph text.",
    inputSchema: queryDataInputSchema,
    execute: async ({ query }) => queryData(query),
  }),
  readDataResource: tool({
    description:
      "Read original file content and extracted text for a file resource returned by queryData.",
    inputSchema: readDataResourceInputSchema,
    execute: async ({ resourceId, fieldId }) =>
      readDataResource(resourceId, fieldId),
  }),
};
