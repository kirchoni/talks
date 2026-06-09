/**
 * Types and interfaces for Progress Observability instrumentation
 */
/**
 * Progress Observability instruments enum that provides granular control over AI agent tracing.
 * Maps to OpenTelemetry JS auto-instrumentations where available.
 */
export declare enum ObservabilityInstruments {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    COHERE = "cohere",
    BEDROCK = "bedrock",
    AZURE_OPENAI = "azure",
    VERTEXAI = "vertexai",
    SAGEMAKER = "sagemaker",
    OLLAMA = "ollama",
    GROQ = "groq",
    MISTRAL = "mistral",
    TOGETHER = "together",
    REPLICATE = "replicate",
    ALEPHALPHA = "alephalpha",
    GOOGLE_GENERATIVEAI = "google_generativeai",
    TRANSFORMERS = "transformers",
    WATSONX = "watsonx",
    LANGCHAIN = "langchain",
    LLAMA_INDEX = "llama_index",
    CREW = "crew",
    HAYSTACK = "haystack",
    OPENAI_AGENTS = "openai_agents",
    MCP = "mcp",
    PINECONE = "pinecone",
    CHROMA = "chroma",
    WEAVIATE = "weaviate",
    QDRANT = "qdrant",
    MILVUS = "milvus",
    LANCEDB = "lancedb",
    MARQO = "marqo",
    REDIS = "redis",
    MYSQL = "mysql",
    REQUESTS = "requests",
    URLLIB = "urllib"
}
/**
 * Progress Observability span kind values for different types of operations
 */
export declare enum ObservabilitySpanKind {
    TASK = "task",
    WORKFLOW = "workflow",
    AGENT = "agent",
    TOOL = "tool"
}
/**
 * Configuration options for Progress Observability instrumentation
 */
export interface ObservabilityConfig {
    /** Application name for telemetry identification */
    appName?: string;
    /** Collector endpoint URL */
    endpoint?: string;
    /** Collector API key for authentication */
    apiKey?: string;
    /** Set of ObservabilityInstruments to enable for tracing */
    instruments?: Set<ObservabilityInstruments>;
    /** Set of ObservabilityInstruments to exclude from tracing */
    blockInstruments?: Set<ObservabilityInstruments>;
    /** Send traces immediately vs batching */
    disableBatch?: boolean;
    /** Whether to log prompts/completions (default true, can also use OBSERVABILITY_TRACE_CONTENT env var) */
    traceContent?: boolean;
    /** Additional resource attributes for traces */
    resourceAttributes?: Record<string, string | number | boolean>;
    /** Custom headers for exporter */
    headers?: Record<string, string>;
    /** Enable debug logging */
    debug?: boolean;
    /** List of string tags to attach to all spans (max 200 chars each) */
    additionalTags?: string[];
}
/**
 * Internal configuration type with all required fields
 */
export interface ObservabilityInternalConfig extends Required<ObservabilityConfig> {
}
/**
 * Decorator options for manual instrumentation
 */
export interface DecoratorOptions {
    /** Optional name override for the span */
    name?: string;
    /** Optional version number */
    version?: number;
    /** Span kind (defaults based on decorator type) */
    spanKind?: ObservabilitySpanKind;
    /** Additional span attributes */
    attributes?: Record<string, unknown>;
    /** Optional list of string tags to attach to the span (max 200 chars each) */
    tags?: string[];
}
/**
 * Environment variable names used by Observability
 */
export declare const OBSERVABILITY_ENV_VARS: readonly ["OBSERVABILITY_API_KEY", "OBSERVABILITY_ENDPOINT", "OBSERVABILITY_APP_NAME"];
/**
 * Context information for span creation
 */
export interface SpanContext {
    name: string;
    kind: ObservabilitySpanKind;
    attributes?: Record<string, unknown>;
    version?: number;
}
//# sourceMappingURL=types.d.ts.map