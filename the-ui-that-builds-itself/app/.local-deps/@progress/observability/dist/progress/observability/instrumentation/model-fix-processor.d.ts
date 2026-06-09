/**
 * Fixes missing or incorrect gen_ai attributes in AI model spans.
 *
 * Automatically corrects:
 * - gen_ai.provider.name (Azure, OpenAI, OpenRouter, AWS, Anthropic, etc.)
 * - gen_ai.request.model and gen_ai.response.model
 * - gen_ai.system (for backwards compatibility)
 *
 * Provider detection uses span names, endpoints, and model prefixes.
 * Preserves full model identifiers including versions for accurate pricing.
 */
import { SpanProcessor, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { Context } from '@opentelemetry/api';
import { createLogger } from './helpers';
/** Span processor that fixes missing or incorrect gen_ai attributes. */
export declare class ModelFixProcessor implements SpanProcessor {
    private activeSpans;
    static _logger: ReturnType<typeof createLogger>;
    static _debugEnabled: boolean;
    onStart(span: ReadableSpan, _parentContext: Context): void;
    onEnd(readableSpan: ReadableSpan): void;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Build context object with all span information needed for processing.
     *
     * @param readableSpan - The span to build context for
     * @param providerKey - Optional pre-detected provider key
     * @returns SpanContext object with all necessary data
     */
    private buildSpanContext;
    /** Logs span state before processing (debug only). */
    private logBeforeProcessing;
    /** Applies provider and model attribute fixes to the span. */
    private applyAllFixes;
    /** Logs span state after processing (debug only). */
    private logAfterProcessing;
    /** Extracts the correct model name from span attributes, preserving full identifiers. */
    private getCorrectModelName;
    /** Maps provider key to provider name (e.g., 'azure' → 'Azure'). */
    private getCorrectProviderFromKey;
    /** Returns mutable attributes object for modification. */
    private getWritableAttributes;
    /** Sets gen_ai.provider.name and gen_ai.system (if present) to correct provider. */
    private fixProviderAttribute;
    private fixModelAttributes;
}
//# sourceMappingURL=model-fix-processor.d.ts.map