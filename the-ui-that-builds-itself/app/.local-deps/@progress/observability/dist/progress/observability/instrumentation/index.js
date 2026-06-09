"use strict";
/**
 * Progress Observability - Zero-intrusion AI agent telemetry for TypeScript/JavaScript
 *
 * Provides granular control over AI agent tracing with zero code changes required
 * to existing agent implementations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpanStatusCode = exports.SpanKind = exports.context = exports.trace = exports.createTracingHandlerClass = exports.createTracingHandler = exports.TAG_MAX_LENGTH = exports.TAGS_ATTRIBUTE_KEY = exports.clearSdkEnvVars = exports.OBSERVABILITY_ENV_VARS = exports.ObservabilitySpanKind = exports.ObservabilityInstruments = exports.wrapFunctionWithSpan = exports.tool = exports.agent = exports.workflow = exports.task = exports.getContextTags = exports.validateTags = exports.propagateAttributes = exports.TagsSpanProcessor = exports.ModelFixProcessor = exports.Observability = void 0;
var sdk_1 = require("./sdk");
Object.defineProperty(exports, "Observability", { enumerable: true, get: function () { return sdk_1.Observability; } });
var model_fix_processor_1 = require("./model-fix-processor");
Object.defineProperty(exports, "ModelFixProcessor", { enumerable: true, get: function () { return model_fix_processor_1.ModelFixProcessor; } });
var tags_1 = require("./tags");
Object.defineProperty(exports, "TagsSpanProcessor", { enumerable: true, get: function () { return tags_1.TagsSpanProcessor; } });
Object.defineProperty(exports, "propagateAttributes", { enumerable: true, get: function () { return tags_1.propagateAttributes; } });
Object.defineProperty(exports, "validateTags", { enumerable: true, get: function () { return tags_1.validateTags; } });
Object.defineProperty(exports, "getContextTags", { enumerable: true, get: function () { return tags_1.getContextTags; } });
var decorators_1 = require("./decorators");
Object.defineProperty(exports, "task", { enumerable: true, get: function () { return decorators_1.task; } });
Object.defineProperty(exports, "workflow", { enumerable: true, get: function () { return decorators_1.workflow; } });
Object.defineProperty(exports, "agent", { enumerable: true, get: function () { return decorators_1.agent; } });
Object.defineProperty(exports, "tool", { enumerable: true, get: function () { return decorators_1.tool; } });
Object.defineProperty(exports, "wrapFunctionWithSpan", { enumerable: true, get: function () { return decorators_1.wrapFunctionWithSpan; } });
var types_1 = require("./types");
Object.defineProperty(exports, "ObservabilityInstruments", { enumerable: true, get: function () { return types_1.ObservabilityInstruments; } });
Object.defineProperty(exports, "ObservabilitySpanKind", { enumerable: true, get: function () { return types_1.ObservabilitySpanKind; } });
Object.defineProperty(exports, "OBSERVABILITY_ENV_VARS", { enumerable: true, get: function () { return types_1.OBSERVABILITY_ENV_VARS; } });
var helpers_1 = require("./helpers");
Object.defineProperty(exports, "clearSdkEnvVars", { enumerable: true, get: function () { return helpers_1.clearSdkEnvVars; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "TAGS_ATTRIBUTE_KEY", { enumerable: true, get: function () { return constants_1.TAGS_ATTRIBUTE_KEY; } });
Object.defineProperty(exports, "TAG_MAX_LENGTH", { enumerable: true, get: function () { return constants_1.TAG_MAX_LENGTH; } });
var langchain_callback_handler_1 = require("./langchain-callback-handler");
Object.defineProperty(exports, "createTracingHandler", { enumerable: true, get: function () { return langchain_callback_handler_1.createTracingHandler; } });
Object.defineProperty(exports, "createTracingHandlerClass", { enumerable: true, get: function () { return langchain_callback_handler_1.createTracingHandlerClass; } });
// Re-export useful OpenTelemetry types for convenience
var api_1 = require("@opentelemetry/api");
Object.defineProperty(exports, "trace", { enumerable: true, get: function () { return api_1.trace; } });
Object.defineProperty(exports, "context", { enumerable: true, get: function () { return api_1.context; } });
Object.defineProperty(exports, "SpanKind", { enumerable: true, get: function () { return api_1.SpanKind; } });
Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: function () { return api_1.SpanStatusCode; } });
// Re-export for default import
const sdk_2 = require("./sdk");
/**
 * Default export for convenient importing
 */
exports.default = sdk_2.Observability;
//# sourceMappingURL=index.js.map