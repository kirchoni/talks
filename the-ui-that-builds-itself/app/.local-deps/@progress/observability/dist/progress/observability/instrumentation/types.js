"use strict";
/**
 * Types and interfaces for Progress Observability instrumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OBSERVABILITY_ENV_VARS = exports.ObservabilitySpanKind = exports.ObservabilityInstruments = void 0;
/**
 * Progress Observability instruments enum that provides granular control over AI agent tracing.
 * Maps to OpenTelemetry JS auto-instrumentations where available.
 */
/* eslint-disable no-unused-vars */
var ObservabilityInstruments;
(function (ObservabilityInstruments) {
    // LLM Providers
    ObservabilityInstruments["OPENAI"] = "openai";
    ObservabilityInstruments["ANTHROPIC"] = "anthropic";
    ObservabilityInstruments["COHERE"] = "cohere";
    ObservabilityInstruments["BEDROCK"] = "bedrock";
    ObservabilityInstruments["AZURE_OPENAI"] = "azure";
    ObservabilityInstruments["VERTEXAI"] = "vertexai";
    ObservabilityInstruments["SAGEMAKER"] = "sagemaker";
    ObservabilityInstruments["OLLAMA"] = "ollama";
    ObservabilityInstruments["GROQ"] = "groq";
    ObservabilityInstruments["MISTRAL"] = "mistral";
    ObservabilityInstruments["TOGETHER"] = "together";
    ObservabilityInstruments["REPLICATE"] = "replicate";
    ObservabilityInstruments["ALEPHALPHA"] = "alephalpha";
    ObservabilityInstruments["GOOGLE_GENERATIVEAI"] = "google_generativeai";
    ObservabilityInstruments["TRANSFORMERS"] = "transformers";
    ObservabilityInstruments["WATSONX"] = "watsonx";
    // Agent and Chain Frameworks
    ObservabilityInstruments["LANGCHAIN"] = "langchain";
    ObservabilityInstruments["LLAMA_INDEX"] = "llama_index";
    ObservabilityInstruments["CREW"] = "crew";
    ObservabilityInstruments["HAYSTACK"] = "haystack";
    ObservabilityInstruments["OPENAI_AGENTS"] = "openai_agents";
    ObservabilityInstruments["MCP"] = "mcp";
    // Vector Databases
    ObservabilityInstruments["PINECONE"] = "pinecone";
    ObservabilityInstruments["CHROMA"] = "chroma";
    ObservabilityInstruments["WEAVIATE"] = "weaviate";
    ObservabilityInstruments["QDRANT"] = "qdrant";
    ObservabilityInstruments["MILVUS"] = "milvus";
    ObservabilityInstruments["LANCEDB"] = "lancedb";
    ObservabilityInstruments["MARQO"] = "marqo";
    ObservabilityInstruments["REDIS"] = "redis";
    ObservabilityInstruments["MYSQL"] = "mysql";
    // Tools and Infrastructure
    ObservabilityInstruments["REQUESTS"] = "requests";
    ObservabilityInstruments["URLLIB"] = "urllib";
})(ObservabilityInstruments || (exports.ObservabilityInstruments = ObservabilityInstruments = {}));
/* eslint-enable no-unused-vars */
/**
 * Progress Observability span kind values for different types of operations
 */
/* eslint-disable no-unused-vars */
var ObservabilitySpanKind;
(function (ObservabilitySpanKind) {
    ObservabilitySpanKind["TASK"] = "task";
    ObservabilitySpanKind["WORKFLOW"] = "workflow";
    ObservabilitySpanKind["AGENT"] = "agent";
    ObservabilitySpanKind["TOOL"] = "tool";
})(ObservabilitySpanKind || (exports.ObservabilitySpanKind = ObservabilitySpanKind = {}));
/**
 * Environment variable names used by Observability
 */
exports.OBSERVABILITY_ENV_VARS = [
    'OBSERVABILITY_API_KEY',
    'OBSERVABILITY_ENDPOINT',
    'OBSERVABILITY_APP_NAME',
];
//# sourceMappingURL=types.js.map