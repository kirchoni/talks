/**
 * LangChain Tracing Callback Handler
 *
 * Provides OpenTelemetry tracing for LangChain workflows by explicitly capturing
 * runId and parentRunId relationships at callback time. Ensures correct span hierarchies
 * even when LangGraph breaks Node.js AsyncLocalStorage and context propagation.
 *
 * Approach:
 * - Captures runId/parentRunId at callback time for every LangChain event.
 * - Maintains a Map<runId, { span, ctx }> to track explicit parent context for each span.
 * - Manual usage: handler is fully instance-scoped (no shared state).
 * - Auto-injected usage: shares span map and root context at module level so all CallbackManager
 *   instances in a LangGraph run stay on the same trace (see KNOWN LIMITATION near _sharedSpanMap).
 *
 * @example Auto-injection (zero-code-change)
 * ```ts
 * // Handled internally by Observability.instrument() — patches CallbackManager
 * // so every LangChain invocation automatically gets a tracing handler.
 * ```
 */
type UnknownRecord = Record<string, unknown>;
/** Options for creating a tracing callback handler. */
export interface TracingHandlerOptions {
    /** Whether to record prompt/completion content in spans (default: true) */
    traceContent?: boolean;
    /** Enable debug logging to console (default: false) */
    debug?: boolean;
}
/**
 * Reset module-level shared state. Must be called during SDK shutdown
 * so that a subsequent Observability.instrument() cycle starts clean.
 */
export declare function resetSharedState(): void;
/**
 * Dynamically create a LangChain tracing callback handler class.
 *
 * Uses a factory because BaseCallbackHandler is an optional peer dependency
 * that cannot be imported statically.
 *
 * @param BaseCallbackHandler - The BaseCallbackHandler class from @langchain/core
 * @returns A class extending BaseCallbackHandler with OpenTelemetry tracing
 */
export declare function createTracingHandlerClass(BaseCallbackHandler: unknown): unknown;
/**
 * Create a tracing callback handler instance for manual per-request usage.
 *
 * This is the RECOMMENDED approach. Each handler instance is fully self-contained
 * with no module-level global state.
 *
 * @param BaseCallbackHandler - BaseCallbackHandler class from @langchain/core
 * @param options - Tracing options
 * @returns A new callback handler instance to pass to agent.invoke()
 *
 * @example
 * ```ts
 * import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
 * import { createTracingHandler } from '@progress/observability';
 *
 * const handler = createTracingHandler(BaseCallbackHandler, { traceContent: true });
 * const result = await agent.invoke(
 *   { messages: [{ role: 'user', content: 'Hello' }] },
 *   { callbacks: [handler] },
 * );
 * ```
 */
export declare function createTracingHandler(BaseCallbackHandler: unknown, options?: TracingHandlerOptions): object;
/**
 * Patch a LangChain CallbackManager so every invocation automatically receives
 * a tracing callback handler — zero consumer code changes required.
 *
 * Replaces Traceloop's built-in LangChain handler with a single implementation
 * that:
 * 1. Captures runId/parentRunId at callback time.
 * 2. Creates spans with explicit parent contexts looked up from the span map.
 * 3. Uses a stable root context instead of context.active() (which LangGraph
 *    may have reset between graph-node transitions).
 *
 * Strategy: patches _configureSync when present (current LangChain), falls back
 * to patching configure when _configureSync is removed in future versions.
 *
 * Must be called with the consumer's own @langchain/core module instances.
 *
 * @param CallbackManager     - CallbackManager class from @langchain/core
 * @param BaseCallbackHandler - BaseCallbackHandler class from @langchain/core
 * @param traceContent        - Whether to record prompt/completion content
 * @param debug               - Whether to enable debug logging
 * @returns true if the patch was applied (or was already applied), false if the
 *          CallbackManager API is not patchable
 */
export declare function patchCallbackManagerWithHierarchy(CallbackManager: UnknownRecord, BaseCallbackHandler: unknown, traceContent: boolean, debug?: boolean): boolean;
export {};
//# sourceMappingURL=langchain-callback-handler.d.ts.map