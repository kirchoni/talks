export type ParagQueryResult = {
  query: string;
  total: number;
  resources: Array<{
    id: string;
    slug: string;
    title: string;
    mimeType?: string;
    summary?: string;
    fileFields?: Array<{
      fieldId: string;
      filename?: string;
      contentType?: string;
    }>;
    paragraphs: Array<{
      field: string;
      id: string;
      order: number;
      score?: number;
      scoreType?: string;
      text: string;
    }>;
  }>;
};

export type ParagResourceResult = {
  resourceId: string;
  fieldId: string;
  fieldType: "file";
  contentType?: string;
  filename?: string;
  original?: unknown;
  extractedText?: string;
};

type ParagRecord = Record<string, unknown>;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getParagKnowledgeBoxUrl() {
  const endpoint = readRequiredEnv("PARAG_API_ENDPOINT").replace(/\/+$/, "");

  if (endpoint.endsWith("/find")) {
    return endpoint.slice(0, -"/find".length);
  }

  if (endpoint.includes("/api/v1/kb/")) {
    return endpoint;
  }

  const knowledgeBoxId = readRequiredEnv("PARAG_KB_ID");

  return `${endpoint}/api/v1/kb/${knowledgeBoxId}`;
}

function getParagFindUrl() {
  return `${getParagKnowledgeBoxUrl()}/find`;
}

function asRecord(value: unknown): ParagRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ParagRecord)
    : {};
}

function readString(record: ParagRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNumber(record: ParagRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function readResources(payload: unknown) {
  const resources = asRecord(asRecord(payload).resources);
  return Object.values(resources).map(asRecord);
}

function readFileFields(resource: ParagRecord) {
  const files = asRecord(asRecord(asRecord(resource.data).files));

  return Object.entries(files).map(([fieldId, fieldValue]) => {
    const file = asRecord(asRecord(asRecord(fieldValue).value).file);

    return {
      fieldId,
      filename: readString(file, ["filename"]) || undefined,
      contentType: readString(file, ["content_type"]) || undefined,
    };
  });
}

function compactFindPayload(payload: unknown): ParagQueryResult {
  const record = asRecord(payload);

  return {
    query: readString(record, ["query", "rephrased_query"]),
    total: readNumber(record, ["total"]) ?? 0,
    resources: readResources(payload).map((resource) => {
      const fields = asRecord(resource.fields);

      return {
        id: readString(resource, ["id"]),
        slug: readString(resource, ["slug"]),
        title: readString(resource, ["title"]) || "Untitled resource",
        mimeType: readString(resource, ["icon"]) || undefined,
        summary: readString(resource, ["summary"]) || undefined,
        fileFields: readFileFields(resource),
        paragraphs: Object.entries(fields)
          .flatMap(([field, value]) => {
            const paragraphs = asRecord(asRecord(value).paragraphs);

            return Object.values(paragraphs).map((paragraph) => {
              const paragraphRecord = asRecord(paragraph);

              return {
                field,
                id: readString(paragraphRecord, ["id"]),
                order: readNumber(paragraphRecord, ["order"]) ?? 0,
                score: readNumber(paragraphRecord, ["score"]),
                scoreType:
                  readString(paragraphRecord, ["score_type"]) || undefined,
                text: readString(paragraphRecord, ["text"]),
              };
            });
          })
          .filter((paragraph) => paragraph.text)
          .sort((a, b) => a.order - b.order),
      };
    }),
  };
}

async function postFind({
  apiKey,
  authHeader,
  text,
}: {
  apiKey: string;
  authHeader: "X-NUCLIA-SERVICEACCOUNT" | "Authorization";
  text: string;
}) {
  const response = await fetch(getParagFindUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeader]: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: text,
      features: ["keyword"],
      page_size: 6,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Progress Agentic RAG query failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response.json();
}

async function fetchParag({ path }: { path: string }) {
  const apiKey = readRequiredEnv("PARAG_API_KEY");
  const headers = {
    "X-NUCLIA-SERVICEACCOUNT": `Bearer ${apiKey}`,
  };
  let response = await fetch(`${getParagKnowledgeBoxUrl()}${path}`, {
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    response = await fetch(`${getParagKnowledgeBoxUrl()}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  if (!response.ok) {
    throw new Error(
      `Progress Agentic RAG request failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response;
}

async function discoverFileFieldId(resourceId: string) {
  const response = await fetchParag({
    path: `/resource/${resourceId}?show=values`,
  });
  const payload = asRecord(await response.json());
  const files = asRecord(asRecord(asRecord(payload.data).files));
  const firstFileId = Object.keys(files)[0];

  if (!firstFileId) {
    throw new Error(`No file fields found for resource ${resourceId}.`);
  }

  return firstFileId;
}

async function resolveFileFieldId(resourceId: string, fieldId: string) {
  const trimmed = fieldId.trim();

  if (trimmed.startsWith("/f/") || trimmed.startsWith("f/")) {
    return trimmed.replace(/^\/?f\//, "").split("/")[0] ?? "";
  }

  if (trimmed.startsWith("/a/") || trimmed.startsWith("a/")) {
    return discoverFileFieldId(resourceId);
  }

  return trimmed;
}

async function fetchFileField(resourceId: string, fieldId: string) {
  return fetchParag({
    path: `/resource/${resourceId}/file/${fieldId}?show=value&show=extracted`,
  });
}

/**
 * Query the Progress Agentic RAG Knowledge Box for app data.
 */
export async function queryData(text: string): Promise<ParagQueryResult> {
  const query = text.trim();

  if (!query) {
    return {
      query,
      resources: [],
      total: 0,
    };
  }

  const apiKey = readRequiredEnv("PARAG_API_KEY");
  let payload: unknown;

  try {
    payload = await postFind({
      apiKey,
      authHeader: "X-NUCLIA-SERVICEACCOUNT",
      text: query,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("401") &&
      !error.message.includes("403")
    ) {
      throw error;
    }

    payload = await postFind({
      apiKey,
      authHeader: "Authorization",
      text: query,
    });
  }

  return compactFindPayload(payload);
}

/**
 * Read a file field from a Progress Agentic RAG resource returned by queryData.
 */
export async function readDataResource(
  resourceId: string,
  fieldId: string,
): Promise<ParagResourceResult> {
  const resource = resourceId.trim();
  const field = await resolveFileFieldId(resource, fieldId);

  if (!resource || !field) {
    throw new Error("resourceId and fieldId are required.");
  }

  let resolvedField = field;
  let fieldResponse: Response;

  try {
    fieldResponse = await fetchFileField(resource, resolvedField);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("Resource field does not exist")
    ) {
      throw error;
    }

    resolvedField = await discoverFileFieldId(resource);
    fieldResponse = await fetchFileField(resource, resolvedField);
  }

  const fieldPayload = asRecord(await fieldResponse.json());
  const value = asRecord(fieldPayload.value);
  const file = asRecord(value.file);
  const extracted = asRecord(fieldPayload.extracted);
  const extractedText = readString(
    asRecord(asRecord(extracted.text).text ? extracted.text : {}),
    ["text"],
  );
  let original: unknown;

  try {
    const originalResponse = await fetchParag({
      path: `/resource/${resource}/file/${resolvedField}/download/field`,
    });
    const contentType = originalResponse.headers.get("content-type") ?? "";
    const body = await originalResponse.text();
    original = contentType.includes("application/json")
      ? JSON.parse(body)
      : body;
  } catch {
    original = undefined;
  }

  return {
    resourceId: resource,
    fieldId: resolvedField,
    fieldType: "file",
    contentType: readString(file, ["content_type"]) || undefined,
    filename: readString(file, ["filename"]) || undefined,
    original,
    extractedText: extractedText || undefined,
  };
}
