/**
 * Tags support for Progress Observability Instrumentation
 *
 * Provides tag validation, context propagation via propagateAttributes(),
 * and a SpanProcessor that injects tags into every span.
 *
 * Tags are lightweight, user-defined strings (max 200 characters each) that
 * can be attached to any observation for categorization, filtering, and grouping.
 *
 * Use cases include environment labeling (production, staging), feature flagging
 * (experiment-v2), customer segmentation (tenant:acme), release tracking
 * (release:2.4.1), and A/B test bucketing (cohort-a, cohort-b).
 */
import { Context } from '@opentelemetry/api';
import { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
/**
 * Validate and sanitize a list of tags.
 *
 * Rules:
 * - Must be an array of strings
 * - Each tag max {@link TAG_MAX_LENGTH} characters
 * - Non-string values are dropped with a warning
 * - Tags exceeding max length are dropped with a warning
 * - Empty/whitespace-only tags are dropped with a warning
 *
 * @param tags - Tags to validate (array of strings expected)
 * @param warnOnDrop - If true, emit console warnings when tags are dropped (default true)
 * @returns Array of valid tag strings
 */
export declare function validateTags(tags: unknown, warnOnDrop?: boolean): string[];
/**
 * Get tags from the specified OpenTelemetry context.
 *
 * @param ctx - Context to read from. If undefined, uses the active context.
 * @returns Array of tag strings from the context
 */
export declare function getContextTags(ctx?: Context): string[];
/**
 * Run a callback with tags propagated to all child observations.
 *
 * Tags specified here are automatically inherited by all observations
 * (spans, generations, events) created within the callback, in addition
 * to any tags from parent contexts. Requires `Observability.instrument()`
 * to be called first for full functionality with auto-instrumented spans.
 *
 * Unlike the Python `contextmanager`, TypeScript does not have native
 * context-manager syntax. This helper uses the OpenTelemetry Context API
 * to propagate tags for the duration of the callback.
 *
 * @param tags - List of string tags to propagate (max 200 chars each)
 * @param fn - Callback to execute within the propagated context
 * @returns The return value of `fn`
 *
 * @example
 * ```ts
 * propagateAttributes(['production', 'experiment-v2'], () => {
 *   // All spans created here inherit these tags
 *   myAgentFunction();
 * });
 *
 * // Can be nested – tags accumulate
 * propagateAttributes(['tenant:acme'], () => {
 *   propagateAttributes(['cohort-a'], () => {
 *     // Spans here have both 'tenant:acme' and 'cohort-a'
 *     runExperiment();
 *   });
 * });
 * ```
 */
export declare function propagateAttributes<T>(tags: string[] | null | undefined, fn: () => T): T;
/**
 * SpanProcessor that injects tags into every span on start.
 *
 * Merges tags from three sources (in priority order):
 * 1. Global tags (from `Observability.instrument({ additionalTags: [...] })`)
 * 2. Context-propagated tags (from `propagateAttributes()`)
 * 3. Pre-existing tags on the span (from decorator `tags` parameter)
 *
 * All tags are deduplicated and stored as a string array attribute
 * under the key defined by {@link TAGS_ATTRIBUTE_KEY}.
 */
export declare class TagsSpanProcessor implements SpanProcessor {
    private _globalTags;
    constructor(globalTags?: string[] | null);
    onStart(span: Span, _parentContext: Context): void;
    onEnd(): void;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
//# sourceMappingURL=tags.d.ts.map