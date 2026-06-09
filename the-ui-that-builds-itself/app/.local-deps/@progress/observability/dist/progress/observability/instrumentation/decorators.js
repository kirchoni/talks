"use strict";
/**
 * Observability Decorators - telemetry decorators for AI agents
 *
 * Provides decorators for instrumenting agent functions, workflows,
 * tasks, and tools with Observability telemetry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tool = exports.agent = exports.workflow = exports.task = void 0;
exports.wrapFunctionWithSpan = wrapFunctionWithSpan;
const api_1 = require("@opentelemetry/api");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const constants_1 = require("./constants");
const tags_1 = require("./tags");
const logger = (0, helpers_1.createLogger)(constants_1.DEFAULTS.DEBUG);
const tracer = api_1.trace.getTracer('@progress/observability');
/**
 * Generic function wrapper that creates spans for instrumented functions
 */
function createSpanWrapper(__target, propertyKey, descriptor, options) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
        throw new Error(`Cannot instrument undefined method: ${propertyKey}`);
    }
    const targetName = __target?.constructor?.name ?? 'Function';
    const spanName = options.name || `${targetName}.${propertyKey}`;
    const spanKind = options.spanKind || types_1.ObservabilitySpanKind.TASK;
    // Validate and include decorator-level tags as span attributes
    const validatedTags = options.tags ? (0, tags_1.validateTags)(options.tags, true) : [];
    const baseAttributes = {
        'code.function': propertyKey,
        'code.namespace': targetName,
        'service.version': options.version?.toString(),
        'observability.span.kind': spanKind,
        ...options.attributes,
    };
    if (validatedTags.length > 0) {
        baseAttributes[constants_1.TAGS_ATTRIBUTE_KEY] = validatedTags;
    }
    descriptor.value = function (...args) {
        return tracer.startActiveSpan(spanName, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: baseAttributes,
        }, (span) => {
            try {
                logger.debug(`Starting span: ${spanName}`);
                // Call the original method
                const result = originalMethod.apply(this, args);
                // Handle async results
                if ((0, helpers_1.isPromiseLike)(result)) {
                    return result
                        .then((value) => {
                        logger.debug(`Span ${spanName} completed successfully`);
                        span.setStatus({ code: api_1.SpanStatusCode.OK });
                        span.end();
                        return value;
                    })
                        .catch((error) => {
                        logger.debug(`Span ${spanName} failed with error:`, error);
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        const exception = error instanceof Error ? error : new Error(String(error));
                        span.setStatus({
                            code: api_1.SpanStatusCode.ERROR,
                            message,
                        });
                        span.recordException(exception);
                        span.end();
                        throw error;
                    });
                }
                // Handle sync results
                logger.debug(`Span ${spanName} completed successfully`);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.end();
                return result;
            }
            catch (error) {
                logger.debug(`Span ${spanName} failed with error:`, error);
                const message = error instanceof Error ? error.message : 'Unknown error';
                const exception = error instanceof Error ? error : new Error(String(error));
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message,
                });
                span.recordException(exception);
                span.end();
                throw error;
            }
        });
    };
    return descriptor;
}
/**
 * Factory that creates a telemetry decorator for a given span kind.
 *
 * Each generated decorator accepts {@link DecoratorOptions} and wraps the
 * target method with an OpenTelemetry span whose `observability.span.kind`
 * is set to the provided *spanKind*.
 */
function makeDecorator(spanKind) {
    return function (options = {}) {
        return function (__target, propertyKey, descriptor) {
            return createSpanWrapper(__target, propertyKey, descriptor, {
                spanKind,
                ...options,
            });
        };
    };
}
/**
 * Decorator for instrumenting task functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class MyAgent {
 *   @task()
 *   async processData() { }
 *
 *   @task({ name: "custom_task", version: 1 })
 *   syncTask() { }
 * }
 * ```
 */
exports.task = makeDecorator(types_1.ObservabilitySpanKind.TASK);
/**
 * Decorator for instrumenting workflow functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class MyAgent {
 *   @workflow()
 *   async executeWorkflow() { }
 *
 *   @workflow({ name: "data_processing", version: 2 })
 *   processData() { }
 * }
 * ```
 */
exports.workflow = makeDecorator(types_1.ObservabilitySpanKind.WORKFLOW);
/**
 * Decorator for instrumenting agent functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class ChatAgent {
 *   @agent()
 *   async chat(message: string) { }
 *
 *   @agent({ name: "chat_agent", version: 1 })
 *   processMessage() { }
 * }
 * ```
 */
exports.agent = makeDecorator(types_1.ObservabilitySpanKind.AGENT);
/**
 * Decorator for instrumenting tool functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class SearchTool {
 *   @tool()
 *   async search(query: string) { }
 *
 *   @tool({ name: "web_search", version: 1 })
 *   webSearch() { }
 * }
 * ```
 */
exports.tool = makeDecorator(types_1.ObservabilitySpanKind.TOOL);
/**
 * Function wrapper utility for manual span creation around functions
 *
 * @param fn - Function to wrap
 * @param spanName - Name for the span
 * @param options - Additional options
 * @returns Wrapped function
 *
 * @example
 * ```typescript
 * const instrumentedFunction = wrapFunctionWithSpan(
 *   myFunction,
 *   'my-operation',
 *   { spanKind: ObservabilitySpanKind.TOOL }
 * );
 * ```
 */
function wrapFunctionWithSpan(fn, spanName, options = {}) {
    const spanKind = options.spanKind || types_1.ObservabilitySpanKind.TASK;
    // Validate and include decorator-level tags as span attributes
    const validatedTags = options.tags ? (0, tags_1.validateTags)(options.tags, true) : [];
    const baseAttributes = {
        'code.function': fn.name || 'anonymous',
        'service.version': options.version?.toString(),
        'observability.span.kind': spanKind,
        ...options.attributes,
    };
    if (validatedTags.length > 0) {
        baseAttributes[constants_1.TAGS_ATTRIBUTE_KEY] = validatedTags;
    }
    return ((..._args) => {
        return tracer.startActiveSpan(spanName, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: baseAttributes,
        }, (span) => {
            try {
                logger.debug(`Starting span: ${spanName}`);
                const result = fn.apply(null, _args);
                // Handle async results
                if ((0, helpers_1.isPromiseLike)(result)) {
                    return result
                        .then((value) => {
                        logger.debug(`Span ${spanName} completed successfully`);
                        span.setStatus({ code: api_1.SpanStatusCode.OK });
                        span.end();
                        return value;
                    })
                        .catch((error) => {
                        logger.debug(`Span ${spanName} failed with error:`, error);
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        const exception = error instanceof Error ? error : new Error(String(error));
                        span.setStatus({
                            code: api_1.SpanStatusCode.ERROR,
                            message,
                        });
                        span.recordException(exception);
                        span.end();
                        throw error;
                    });
                }
                // Handle sync results
                logger.debug(`Span ${spanName} completed successfully`);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.end();
                return result;
            }
            catch (error) {
                logger.debug(`Span ${spanName} failed with error:`, error);
                const message = error instanceof Error ? error.message : 'Unknown error';
                const exception = error instanceof Error ? error : new Error(String(error));
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message,
                });
                span.recordException(exception);
                span.end();
                throw error;
            }
        });
    });
}
//# sourceMappingURL=decorators.js.map