"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsSpanProcessor = void 0;
exports.validateTags = validateTags;
exports.getContextTags = getContextTags;
exports.propagateAttributes = propagateAttributes;
const api_1 = require("@opentelemetry/api");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
const constants_2 = require("./constants");
const logger = (0, helpers_1.createLogger)(constants_2.DEFAULTS.DEBUG);
// ---- Internal context key ------------------------------------------------
/**
 * Unique symbol used to store propagated tags in the OpenTelemetry Context.
 * Using a local symbol (not Symbol.for) ensures this key is unique to this module
 * and cannot collide with other code, even if they use the same string description.
 */
const PROPAGATED_TAGS_KEY = Symbol('observability_propagated_tags');
// ---- Validation ----------------------------------------------------------
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
function validateTags(tags, warnOnDrop = true) {
    if (tags === null || tags === undefined) {
        return [];
    }
    // Accept a single string as a convenience
    if (typeof tags === 'string') {
        return validateTags([tags], warnOnDrop);
    }
    if (!Array.isArray(tags)) {
        if (warnOnDrop) {
            logger.warn(`Tags must be an array of strings, got ${typeof tags}. Tags dropped.`);
        }
        return [];
    }
    const valid = [];
    for (const tag of tags) {
        if (typeof tag !== 'string') {
            if (warnOnDrop) {
                logger.warn(`Tag must be a string, got ${typeof tag}: ${String(tag)}. Tag dropped.`);
            }
            continue;
        }
        if (!tag.trim()) {
            if (warnOnDrop) {
                logger.warn('Empty or whitespace-only tag dropped.');
            }
            continue;
        }
        if (tag.length > constants_1.TAG_MAX_LENGTH) {
            if (warnOnDrop) {
                logger.warn(`Tag exceeds ${constants_1.TAG_MAX_LENGTH} characters (${tag.length} chars): ` +
                    `'${tag.slice(0, 50)}...'. Tag dropped.`);
            }
            continue;
        }
        valid.push(tag);
    }
    return valid;
}
// ---- Private helpers -----------------------------------------------------
/**
 * Merge multiple tag arrays, deduplicating while preserving order.
 *
 * @internal
 */
function _mergeTags(...tagLists) {
    const seen = new Set();
    const result = [];
    for (const tags of tagLists) {
        for (const tag of tags) {
            if (!seen.has(tag)) {
                seen.add(tag);
                result.push(tag);
            }
        }
    }
    return result;
}
// ---- Context propagation -------------------------------------------------
/**
 * Get tags from the specified OpenTelemetry context.
 *
 * @param ctx - Context to read from. If undefined, uses the active context.
 * @returns Array of tag strings from the context
 */
function getContextTags(ctx) {
    const targetCtx = ctx ?? api_1.context.active();
    const tags = targetCtx.getValue(PROPAGATED_TAGS_KEY);
    if (tags === undefined || tags === null) {
        return [];
    }
    return tags;
}
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
function propagateAttributes(tags, fn) {
    const validated = validateTags(tags);
    if (validated.length === 0) {
        return fn();
    }
    // Merge with any existing propagated tags from parent context
    const existing = getContextTags();
    const merged = _mergeTags(existing, validated);
    const ctx = api_1.context.active().setValue(PROPAGATED_TAGS_KEY, merged);
    return api_1.context.with(ctx, fn);
}
// ---- SpanProcessor -------------------------------------------------------
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
class TagsSpanProcessor {
    _globalTags;
    constructor(globalTags) {
        this._globalTags = globalTags ? validateTags(globalTags) : [];
    }
    onStart(span, _parentContext) {
        if (!span.isRecording()) {
            return;
        }
        // Read context tags from _parentContext (not active context) to avoid
        // concurrency issues where the SDK may process spans off the hot path
        const contextTags = getContextTags(_parentContext);
        // Read any existing tags on the span (e.g., set by decorator)
        let existingTags = [];
        // Access the internal attributes – Span (writable) exposes .attributes
        const attrs = span.attributes;
        if (attrs) {
            const existing = attrs[constants_1.TAGS_ATTRIBUTE_KEY];
            if (existing !== undefined && existing !== null) {
                if (Array.isArray(existing)) {
                    existingTags = existing.map(String);
                }
                else if (typeof existing === 'string') {
                    existingTags = [existing];
                }
            }
        }
        // Skip merge allocation when no tags exist anywhere
        if (this._globalTags.length === 0 && contextTags.length === 0 && existingTags.length === 0) {
            return;
        }
        // Merge all: global + context + existing (decorator)
        const merged = _mergeTags(this._globalTags, contextTags, existingTags);
        if (merged.length > 0) {
            span.setAttribute(constants_1.TAGS_ATTRIBUTE_KEY, merged);
        }
    }
    onEnd() {
        // No-op: tags are applied on start
    }
    shutdown() {
        return Promise.resolve();
    }
    forceFlush() {
        return Promise.resolve();
    }
}
exports.TagsSpanProcessor = TagsSpanProcessor;
//# sourceMappingURL=tags.js.map