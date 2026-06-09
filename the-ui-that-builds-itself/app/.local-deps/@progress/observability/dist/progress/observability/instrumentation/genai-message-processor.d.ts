/**
 * GenAI Message Normalization Processor
 *
 * OpenTelemetry span processor that normalizes legacy flat gen_ai message attributes
 * to the new structured message format following the GenAI semantic conventions.
 *
 * General case:
 * - Old format: gen_ai.prompt.0.content, gen_ai.prompt.0.role, etc.
 * - New format: gen_ai.input.messages, gen_ai.output.messages
 *
 * Edge cases:
 * - Handles Google GenAI format where prompts and completions
 *   may have content that is either plain text or pre-structured JSON parts arrays.
 * - Handling of complex content types (tool calls, media, thoughts, etc.) is planned for
 *   future implementation following the Python implementation pattern.
 *
 * All prompts (including system role messages) become gen_ai.input.messages with structured parts array.
 * Completions become gen_ai.output.messages with the same structure.
 */
import { SpanProcessor, ReadableSpan } from '@opentelemetry/sdk-trace-base';
type Logger = {
    debug: typeof console.debug;
    warn: typeof console.warn;
    error: typeof console.error;
};
/**
 * Processor that normalizes legacy gen_ai message attributes to structured format.
 */
export declare class GenAIMessageProcessor implements SpanProcessor {
    private static readonly LEGACY_ATTR_PATTERN;
    private static readonly TOOL_CALLS_PATTERN;
    static _debugEnabled: boolean;
    static _logger: Logger;
    constructor(debug?: boolean);
    /**
     * Called when span starts - no action needed.
     */
    onStart(): void;
    /**
     * Transform legacy message attributes to new structured format.
     */
    onEnd(span: ReadableSpan): void;
    /**
     * Gracefully shutdown the processor.
     */
    shutdown(): Promise<void>;
    /**
     * Force flush - no buffering in this processor.
     */
    forceFlush(): Promise<void>;
    /**
     * Check if span needs message normalization.
     */
    private _shouldProcessSpan;
    /**
     * Get writable attributes from span.
     */
    private _getWritableAttributes;
    /**
     * Collect and group legacy prompt and completion attributes by index.
     */
    private _collectLegacyAttributes;
    /**
     * Map role to canonical form based on content and original role.
     *
     * @param role - Original role from attributes
     * @param hasToolCall - Whether content contains a tool call
     * @param hasToolResponse - Whether content contains a tool response
     * @returns Canonicalized role string
     */
    private _mapRole;
    /**
     * Transform prompts into input.messages.
     *
     * @param attributes - Span attributes to modify
     * @param prompts - Dictionary mapping index to prompt fields
     *
     * Note: Special handling for tool-related fields:
     * - tool_call_id: Should be mapped to 'id' property in tool_call_response parts
     * - tool_calls array: Nested tool call structures need to be parsed and normalized
     * - Property normalization may be needed (e.g., 'result' -> 'response' per OpenTelemetry spec)
     */
    private _transformPrompts;
    /**
     * Transform completions into output.messages.
     *
     * @param attributes - Span attributes to modify
     * @param completions - Dictionary mapping index to completion fields
     */
    private _transformCompletions;
    /**
     * Remove legacy gen_ai.prompt.* and gen_ai.completion.* attributes.
     */
    private _removeLegacyAttributes;
    /**
     * Parse content field - either use pre-structured JSON or wrap as single part.
     *
     * @param content - Content string to parse
     * @param defaultType - Default part type if creating a simple wrapper
     * @param toolCallRegistry - Registry mapping tool call names to IDs for cross-message correlation
     * @param toolCallId - Optional tool_call_id from legacy attributes to set as id for tool_call_response parts
     * @returns Object with parts array, hasToolCall flag, and hasToolResponse flag
     */
    private _parseContentAsParts;
    /**
     * Convert legacy tool_calls array structure to normalized parts.
     *
     * Handles flat attributes like gen_ai.prompt.0.tool_calls.0.name that were
     * collected into a nested dictionary structure by _collectLegacyAttributes.
     *
     * @param toolCallsDict - Dictionary mapping tool call index to tool call fields
     * @param toolCallRegistry - Registry to track tool call IDs for matching with responses
     * @returns Array of tool_call MessagePart objects
     */
    private _convertToolCallsArrayToParts;
}
export {};
//# sourceMappingURL=genai-message-processor.d.ts.map