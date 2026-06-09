"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSharedState = resetSharedState;
exports.createTracingHandlerClass = createTracingHandlerClass;
exports.createTracingHandler = createTracingHandler;
exports.patchCallbackManagerWithHierarchy = patchCallbackManagerWithHierarchy;
const api_1 = require("@opentelemetry/api");
// ─── Resolve @traceloop/instrumentation-langchain version at startup ────────
// Reads the actual installed version so the instrumentationScope in exported
// spans always matches the real package, even after dependency bumps.
// Falls back to the last known version if the package.json cannot be read.
function _resolveTraceloopLangChainVersion() {
    try {
        const pkg = require('@traceloop/instrumentation-langchain/package.json');
        if (typeof pkg?.version === 'string' && pkg.version)
            return pkg.version;
    }
    catch {
        // Package not installed or exports block package.json — use fallback
    }
    return '0.25.0';
}
const TRACELOOP_LANGCHAIN_VERSION = _resolveTraceloopLangChainVersion();
// ─── Semantic convention attribute keys ────────────────────────────────────
const ATTR = {
    TRACELOOP_SPAN_KIND: 'traceloop.span.kind',
    TRACELOOP_WORKFLOW_NAME: 'traceloop.workflow.name',
    TRACELOOP_ENTITY_NAME: 'traceloop.entity.name',
    TRACELOOP_ENTITY_INPUT: 'traceloop.entity.input',
    TRACELOOP_ENTITY_OUTPUT: 'traceloop.entity.output',
    GENAI_PROVIDER: 'gen_ai.provider.name',
    GENAI_REQUEST_MODEL: 'gen_ai.request.model',
    GENAI_RESPONSE_MODEL: 'gen_ai.response.model',
    GENAI_INPUT_MESSAGES: 'gen_ai.input.messages',
    GENAI_OUTPUT_MESSAGES: 'gen_ai.output.messages',
    GENAI_USAGE_PROMPT: 'gen_ai.usage.input_tokens',
    GENAI_USAGE_COMPLETION: 'gen_ai.usage.output_tokens',
    LLM_REQUEST_TYPE: 'llm.request.type',
    LLM_USAGE_TOTAL: 'llm.usage.total_tokens',
    TOOL_NAME: 'gen_ai.tool.name',
};
const PATCH_MARKER = Symbol.for('@progress/observability:langchain_hierarchy_patched');
const RUN_TYPE_HINTS = new Set([
    'chain',
    'llm',
    'chat_model',
    'tool',
    'retriever',
    'agent',
    'prompt',
    'parser',
    'embedding',
    'agent_executor',
]);
// ─── UUID regex for handleChainStart 0.3.x/1.x detection ──────────────────
const _UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// ─── Helper: extract last element of LangChain serialised id array ─────────
function _getClassName(obj) {
    const o = obj;
    const idArr = o?.['id'];
    return idArr?.[idArr.length - 1] ?? 'unknown';
}
// ─── Provider detection from serialised LLM object ─────────────────────────
// Values follow OTel GenAI semantic conventions (lowercase).
function _detectVendor(llm) {
    const cls = _getClassName(llm).toLowerCase();
    if (cls.includes('azure'))
        return 'azure';
    if (cls.includes('openai') || cls === 'chatopenai' || cls === 'openai')
        return 'openai';
    if (cls.includes('bedrock') || cls.includes('aws'))
        return 'aws';
    if (cls.includes('anthropic'))
        return 'anthropic';
    if (cls.includes('google') || cls.includes('gemini') || cls.includes('vertex') || cls.includes('palm'))
        return 'google';
    if (cls.includes('cohere'))
        return 'cohere';
    if (cls.includes('mistral'))
        return 'mistral';
    if (cls.includes('huggingface'))
        return 'huggingface';
    if (cls.includes('ollama'))
        return 'ollama';
    if (cls.includes('together'))
        return 'together';
    if (cls.includes('replicate'))
        return 'replicate';
    return 'unknown';
}
// ─── Model name extraction from serialised LLM kwargs ──────────────────────
function _extractModelFromSerialized(llm) {
    const obj = llm;
    const kwargs = obj?.['kwargs'];
    if (!kwargs)
        return undefined;
    if (typeof kwargs['model'] === 'string')
        return kwargs['model'];
    if (typeof kwargs['model_name'] === 'string')
        return kwargs['model_name'];
    if (typeof kwargs['modelName'] === 'string')
        return kwargs['modelName'];
    return undefined;
}
// ─── Model name extraction from LLM output ─────────────────────────────────
function _extractModelFromOutput(output) {
    const out = output;
    if (!out)
        return undefined;
    // Path 1: llmOutput.model_name / model / model_id
    const llmOut = out['llmOutput'];
    if (llmOut) {
        const name = llmOut['model_name'] ?? llmOut['model'] ?? llmOut['model_id'];
        if (typeof name === 'string')
            return name;
    }
    // Path 2: generations[0][0].message.response_metadata.model_name / model
    const generations = out['generations'];
    const firstGen = generations?.[0]?.[0];
    const msg = firstGen?.['message'];
    const meta = msg?.['response_metadata'];
    if (meta) {
        const modelFromMeta = meta['model_name'] ?? meta['model'] ?? meta['model_id'];
        if (typeof modelFromMeta === 'string')
            return modelFromMeta;
    }
    return undefined;
}
function _extractTokenUsage(output) {
    const out = output;
    if (!out)
        return undefined;
    // Path 1: llmOutput.tokenUsage (camelCase) or llmOutput.usage (snake_case)
    const llmOut = out['llmOutput'];
    if (llmOut) {
        const usage = (llmOut['tokenUsage'] ?? llmOut['usage']);
        if (usage) {
            return {
                prompt: usage['promptTokens'] ?? usage['input_tokens'],
                completion: usage['completionTokens'] ?? usage['output_tokens'],
                total: usage['totalTokens'] ?? usage['total_tokens'],
            };
        }
    }
    // Path 2: generations[0][0].message.usage_metadata (LangChain 1.x)
    const generations = out['generations'];
    const firstGen = generations?.[0]?.[0];
    const msg = firstGen?.['message'];
    const usageMeta = msg?.['usage_metadata'];
    if (usageMeta) {
        return {
            prompt: usageMeta['input_tokens'],
            completion: usageMeta['output_tokens'],
            total: usageMeta['total_tokens'],
        };
    }
    return undefined;
}
// ─── Message role mapping ──────────────────────────────────────────────────
function _mapMessageRole(messageType) {
    switch (messageType) {
        case 'human': return 'user';
        case 'ai': return 'assistant';
        case 'system': return 'system';
        case 'function': return 'tool';
        default: return messageType;
    }
}
// ─── Format input messages in structured GenAI format ──────────────────────
// Converts LangChain message objects to gen_ai.input.messages JSON.
// Handles text, tool_call (AI messages), and tool_call_response (ToolMessage) parts.
function _formatInputMessages(messages) {
    const structured = messages.map((msg) => {
        const msgObj = msg;
        const getType = msgObj['_getType'];
        let role = 'unknown';
        if (typeof getType === 'function') {
            try {
                // Preserve method receiver; some LangChain message implementations rely on `this`.
                const messageType = getType.call(msgObj);
                role = _mapMessageRole(messageType);
            }
            catch {
                // Fall back to role-like fields when _getType is not callable in this runtime.
                const fallbackRole = msgObj['role'];
                if (typeof fallbackRole === 'string') {
                    role = _mapMessageRole(fallbackRole);
                }
            }
        }
        else if (typeof msgObj['role'] === 'string') {
            role = _mapMessageRole(msgObj['role']);
        }
        const parts = [];
        // Extract tool calls (AI/assistant messages)
        const toolCalls = (msgObj['tool_calls'] ?? msgObj['additional_kwargs']?.['tool_calls']);
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            for (const tc of toolCalls) {
                const tcObj = tc;
                const tcFn = tcObj['function'];
                const part = { type: 'tool_call' };
                part.id = tcObj['id'] ?? tcObj['tool_call_id'];
                part.name = tcFn?.['name'] ?? tcObj['name'];
                const rawArgs = tcFn?.['arguments'] ?? tcObj['args'];
                if (typeof rawArgs === 'string') {
                    try {
                        part.arguments = JSON.parse(rawArgs);
                    }
                    catch {
                        part.arguments = rawArgs;
                    }
                }
                else if (rawArgs !== null && rawArgs !== undefined) {
                    part.arguments = rawArgs;
                }
                parts.push(part);
            }
        }
        // Tool response messages (ToolMessage with tool_call_id)
        if (msgObj['tool_call_id']) {
            const rawMsgContent = msgObj['content'];
            const content = typeof rawMsgContent === 'string' ? rawMsgContent : JSON.stringify(rawMsgContent);
            parts.push({ type: 'tool_call_response', id: msgObj['tool_call_id'], response: content });
        }
        else {
            // Regular text content (also includes text alongside tool_calls if present)
            const rawContent = msgObj['content'];
            let content = '';
            if (typeof rawContent === 'string') {
                content = rawContent;
            }
            else if (Array.isArray(rawContent)) {
                // LangChain structured content: [{type: "text", text: "..."}, ...]
                // Extract text from structured parts to avoid double-serialization
                content = rawContent
                    .filter((part) => typeof part === 'string' || (part?.['type'] === 'text'))
                    .map((part) => typeof part === 'string' ? part : (part?.['text'] ?? ''))
                    .join('');
            }
            else if (rawContent !== null && rawContent !== undefined) {
                content = JSON.stringify(rawContent);
            }
            if (content) {
                parts.push({ type: 'text', content });
            }
        }
        return { role, parts };
    }).filter((m) => m.parts.length > 0);
    return JSON.stringify(structured);
}
// ─── Format output messages in structured GenAI format ─────────────────────
// Converts LangChain LLMResult to gen_ai.output.messages JSON.
// Handles text content, tool_call parts, and finish_reason extraction.
function _formatOutputMessages(output) {
    const generations = output?.generations;
    if (!generations)
        return '[]';
    const structured = generations.map((gen) => {
        const first = gen?.[0];
        if (!first)
            return null;
        const firstObj = first;
        const parts = [];
        const msg = firstObj['message'];
        // Extract tool calls from generation message
        const toolCalls = (msg?.['tool_calls'] ?? msg?.['additional_kwargs']?.['tool_calls']);
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            for (const tc of toolCalls) {
                const tcObj = tc;
                const tcFn = tcObj['function'];
                const part = { type: 'tool_call' };
                part.id = tcObj['id'] ?? tcObj['tool_call_id'];
                part.name = tcFn?.['name'] ?? tcObj['name'];
                const rawArgs = tcFn?.['arguments'] ?? tcObj['args'];
                if (typeof rawArgs === 'string') {
                    try {
                        part.arguments = JSON.parse(rawArgs);
                    }
                    catch {
                        part.arguments = rawArgs;
                    }
                }
                else if (rawArgs !== null && rawArgs !== undefined) {
                    part.arguments = rawArgs;
                }
                parts.push(part);
            }
        }
        // Text content
        const text = firstObj['text'] ?? (typeof msg?.['content'] === 'string' ? msg['content'] : '');
        if (text) {
            parts.push({ type: 'text', content: text });
        }
        if (parts.length === 0)
            return null;
        // Determine finish_reason
        const meta = msg?.['response_metadata'];
        const generationInfo = firstObj['generationInfo'];
        const rawFinishReason = (meta?.['finish_reason'] ?? generationInfo?.['finish_reason'] ?? 'stop');
        const hasToolCalls = parts.some(p => p.type === 'tool_call');
        return {
            role: 'assistant',
            parts,
            finish_reason: hasToolCalls ? 'tool_call' : rawFinishReason,
        };
    }).filter(Boolean);
    return JSON.stringify(structured);
}
// ─── handleChainStart parameter order detection ────────────────────────────
//
// @langchain/core 0.3.x: (chain, inputs, runId, parentRunId?, tags?, metadata?, runType?, runName?)
// @langchain/core 1.x:   (chain, inputs, runId, runType?,    tags?, metadata?, runName?, parentRunId?, extra?)
//
// parentRunId moved from rest[0] (0.3.x) to rest[4] (1.x). Detection strategy:
//   • rest[0] is a UUID string  → 0.3.x convention, that value is parentRunId.
//   • rest[4] is a UUID string  → 1.x convention, that value is parentRunId.
//   • rest[0] is an object      → future named-args convention.
//   • rest[0] looks like a run-type keyword → 1.x with no parent.
//   • none of the above         → root span (no parent).
function _resolveChainStartArgs(rest) {
    const a0 = rest[0]; // parentRunId (0.3.x) or runType (1.x)
    const a3 = rest[3]; // runType (0.3.x) or runName (1.x)
    const a4 = rest[4]; // runName (0.3.x) or parentRunId (1.x)
    // Future-compatible path: object options shape (if LangChain adopts named args)
    if (a0 && typeof a0 === 'object' && !Array.isArray(a0)) {
        const opts = a0;
        const parent = opts['parentRunId'];
        const runName = opts['runName'];
        return {
            parentRunId: typeof parent === 'string' ? parent : undefined,
            runName: typeof runName === 'string' ? runName : undefined,
        };
    }
    if (typeof a0 === 'string' && _UUID_RE.test(a0)) {
        // 0.3.x: a0 is parentRunId (UUID)
        return { parentRunId: a0, runName: typeof a4 === 'string' ? a4 : undefined };
    }
    if (typeof a4 === 'string' && _UUID_RE.test(a4)) {
        // 1.x: a4 is parentRunId (UUID)
        return { parentRunId: a4, runName: typeof a3 === 'string' ? a3 : undefined };
    }
    // Neither position holds a UUID — root span (no parent)
    if (typeof a0 === 'string') {
        const maybeRunType = a0.toLowerCase();
        const a0LooksLikeRunType = RUN_TYPE_HINTS.has(maybeRunType) || maybeRunType.includes('chain') || maybeRunType.includes('agent');
        if (a0LooksLikeRunType) {
            // 1.x convention but with non-UUID run IDs in newer versions
            return { parentRunId: typeof a4 === 'string' ? a4 : undefined, runName: typeof a3 === 'string' ? a3 : undefined };
        }
        // 0.3.x style non-UUID run IDs
        return { parentRunId: a0, runName: typeof a4 === 'string' ? a4 : undefined };
    }
    // a0 is undefined/array → 0.3.x convention with no parent
    return { parentRunId: undefined, runName: typeof a4 === 'string' ? a4 : undefined };
}
// ─── Shared state for auto-injected handlers ──────────────────────────────
//
// LangGraph can create new CallbackManager instances at graph-node transitions
// without inheriting previous handlers. Each new instance produces a fresh
// handler. To keep all spans on the same trace, auto-injected handlers (_shared
// mode) share this span map and root context at module scope.
//
// Manually created handlers are fully instance-scoped and never touch these.
//
// KNOWN LIMITATION: _sharedRootCtx is captured by the first auto-injected
// handler in a given invocation. Truly concurrent agent.invoke() calls on the
// same module may cross-contaminate root contexts. For concurrent workloads,
// pass a manual per-request handler instead of relying on auto-injection.
let _sharedRootCtx = null;
const _sharedSpanMap = new Map();
/**
 * Reset module-level shared state. Must be called during SDK shutdown
 * so that a subsequent Observability.instrument() cycle starts clean.
 */
function resetSharedState() {
    // End any orphaned spans to avoid leaks
    for (const entry of _sharedSpanMap.values()) {
        try {
            entry.span.end();
        }
        catch { /* best effort */ }
    }
    _sharedSpanMap.clear();
    _sharedRootCtx = null;
}
// ─── Handler class factory ─────────────────────────────────────────────────
/**
 * Dynamically create a LangChain tracing callback handler class.
 *
 * Uses a factory because BaseCallbackHandler is an optional peer dependency
 * that cannot be imported statically.
 *
 * @param BaseCallbackHandler - The BaseCallbackHandler class from @langchain/core
 * @returns A class extending BaseCallbackHandler with OpenTelemetry tracing
 */
function createTracingHandlerClass(BaseCallbackHandler) {
    // Use the same tracer scope as Traceloop so spans appear under the same
    // instrumentationScope in observability backends.
    const handlerTracer = api_1.trace.getTracer('@traceloop/instrumentation-langchain', TRACELOOP_LANGCHAIN_VERSION);
    const BaseCtor = BaseCallbackHandler;
    return class LangChainTracingCallbackHandler extends BaseCtor {
        name = 'progress_tracing_callback_handler';
        // ── Instance state ─────────────────────────────────────────────
        _spanMap;
        _rootCtx;
        _traceContent;
        _debug;
        _isShared;
        constructor(options = {}) {
            super();
            this._traceContent = options.traceContent ?? true;
            this._debug = options.debug ?? (process.env.OBSERVABILITY_LANGCHAIN_DEBUG === 'true');
            this._isShared = options._shared ?? false;
            if (this._isShared) {
                // Auto-injected mode: share span map and root context across handlers
                this._spanMap = _sharedSpanMap;
                if (_sharedSpanMap.size === 0) {
                    // First handler in a new invocation — capture fresh root context
                    _sharedRootCtx = api_1.context.active();
                }
                this._rootCtx = _sharedRootCtx ?? api_1.context.active();
            }
            else {
                // Manual mode: fully instance-scoped, no module globals
                this._spanMap = new Map();
                this._rootCtx = api_1.context.active();
            }
        }
        /**
         * Resolve the parent OTel context for a new span.
         *
         * 1. parentRunId present and found in span map → use that entry's context.
         * 2. Otherwise → fall back to the root context captured at construction.
         *
         * We never fall back to context.active() because LangGraph may have reset
         * AsyncLocalStorage between graph-node transitions, making it unreliable.
         */
        _resolveParentCtx(parentRunId) {
            if (parentRunId) {
                const parentData = this._spanMap.get(parentRunId);
                if (parentData) {
                    if (this._debug) {
                        console.log(`[TracingHandler] ✓ Parent found in map: ${parentRunId.substring(0, 8)}...`);
                    }
                    return parentData.ctx;
                }
                if (this._debug) {
                    console.log(`[TracingHandler] ✗ Parent ${parentRunId.substring(0, 8)}... not in map (${this._spanMap.size} entries), using root ctx`);
                }
            }
            return this._rootCtx;
        }
        _storeSpan(runId, span, parentCtx) {
            const existing = this._spanMap.get(runId);
            if (existing) {
                try {
                    existing.span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: 'Duplicate runId observed; replacing previous span' });
                    existing.span.end();
                }
                catch {
                    // Best effort cleanup of prior span entry
                }
            }
            const ctx = api_1.trace.setSpan(parentCtx, span);
            this._spanMap.set(runId, { span, ctx });
            if (this._debug) {
                console.log(`[TracingHandler] Stored span for ${runId.substring(0, 8)}... (map size: ${this._spanMap.size})`);
            }
        }
        _endSpan(runId, status, error) {
            const data = this._spanMap.get(runId);
            if (!data)
                return;
            try {
                if (status === 'error' && error) {
                    data.span.recordException(error);
                    data.span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.message });
                }
                else {
                    data.span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                data.span.end();
            }
            finally {
                // Always remove the entry, even if span.end() throws.
                this._spanMap.delete(runId);
            }
        }
        // ── Chain / Workflow callbacks ──────────────────────────────────
        async handleChainStart(
        // Compatible with both 0.3.x and 1.x parameter orders.
        // 0.3.x: (chain, inputs, runId, parentRunId?, tags?, metadata?, runType?, runName?)
        // 1.x:   (chain, inputs, runId, runType?, tags?, metadata?, runName?, parentRunId?, extra?)
        chain, inputs, runId, ...rest) {
            try {
                const { parentRunId, runName } = _resolveChainStartArgs(rest);
                const chainName = _getClassName(chain);
                const spanName = `${chainName}.workflow`;
                if (this._debug) {
                    console.log(`[TracingHandler] handleChainStart: ${spanName} run=${runId.substring(0, 8)} parent=${parentRunId?.substring(0, 8) ?? 'none'}`);
                }
                const parentCtx = this._resolveParentCtx(parentRunId);
                const span = handlerTracer.startSpan(spanName, { kind: api_1.SpanKind.CLIENT }, parentCtx);
                span.setAttributes({
                    [ATTR.TRACELOOP_SPAN_KIND]: 'workflow',
                    [ATTR.TRACELOOP_WORKFLOW_NAME]: runName ?? chainName,
                });
                if (this._traceContent) {
                    try {
                        span.setAttribute(ATTR.TRACELOOP_ENTITY_INPUT, JSON.stringify(inputs));
                    }
                    catch { /* non-serializable */ }
                }
                this._storeSpan(runId, span, parentCtx);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleChainStart error:', e);
                }
            }
        }
        async handleChainEnd(outputs, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                if (this._traceContent) {
                    try {
                        data.span.setAttribute(ATTR.TRACELOOP_ENTITY_OUTPUT, JSON.stringify(outputs));
                    }
                    catch { /* skip */ }
                }
                this._endSpan(runId, 'ok');
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleChainEnd error:', e);
                }
            }
        }
        async handleChainError(err, runId) {
            try {
                this._endSpan(runId, 'error', err);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleChainError error:', e);
                }
            }
        }
        // ── Chat Model callbacks ───────────────────────────────────────
        async handleChatModelStart(llm, messages, runId, parentRunId) {
            try {
                const className = _getClassName(llm);
                const vendor = _detectVendor(llm);
                const modelName = _extractModelFromSerialized(llm);
                if (this._debug) {
                    console.log(`[TracingHandler] handleChatModelStart: ${className} vendor=${vendor} model=${modelName ?? 'unknown'} run=${runId.substring(0, 8)} parent=${parentRunId?.substring(0, 8) ?? 'none'}`);
                }
                const parentCtx = this._resolveParentCtx(parentRunId);
                const span = handlerTracer.startSpan(className, { kind: api_1.SpanKind.CLIENT }, parentCtx);
                const attrs = {
                    [ATTR.GENAI_PROVIDER]: vendor,
                    [ATTR.LLM_REQUEST_TYPE]: 'chat',
                    [ATTR.GENAI_REQUEST_MODEL]: modelName ?? 'unknown',
                };
                span.setAttributes(attrs);
                if (this._traceContent) {
                    try {
                        const flattened = [].concat(...messages);
                        span.setAttribute(ATTR.GENAI_INPUT_MESSAGES, _formatInputMessages(flattened));
                    }
                    catch { /* non-serializable message content */ }
                }
                this._storeSpan(runId, span, parentCtx);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleChatModelStart error:', e);
                }
            }
        }
        // ── LLM (completion) callbacks ─────────────────────────────────
        async handleLLMStart(llm, prompts, runId, parentRunId) {
            try {
                const className = _getClassName(llm);
                const modelName = _extractModelFromSerialized(llm);
                const parentCtx = this._resolveParentCtx(parentRunId);
                const span = handlerTracer.startSpan(className, { kind: api_1.SpanKind.CLIENT }, parentCtx);
                const attrs = {
                    [ATTR.GENAI_PROVIDER]: _detectVendor(llm),
                    [ATTR.LLM_REQUEST_TYPE]: 'completion',
                    [ATTR.GENAI_REQUEST_MODEL]: modelName ?? 'unknown',
                };
                span.setAttributes(attrs);
                if (this._traceContent) {
                    try {
                        const inputMessages = prompts.map((prompt) => ({
                            role: 'user',
                            parts: [{ type: 'text', content: prompt }],
                        }));
                        span.setAttribute(ATTR.GENAI_INPUT_MESSAGES, JSON.stringify(inputMessages));
                    }
                    catch { /* non-serializable prompt content */ }
                }
                this._storeSpan(runId, span, parentCtx);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleLLMStart error:', e);
                }
            }
        }
        async handleLLMEnd(output, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                const { span } = data;
                const modelName = _extractModelFromOutput(output);
                span.setAttributes({
                    [ATTR.GENAI_REQUEST_MODEL]: modelName ?? 'unknown',
                    [ATTR.GENAI_RESPONSE_MODEL]: modelName ?? 'unknown',
                });
                // Token usage
                const usage = _extractTokenUsage(output);
                if (usage) {
                    if (usage.prompt != null)
                        span.setAttribute(ATTR.GENAI_USAGE_PROMPT, usage.prompt);
                    if (usage.completion != null)
                        span.setAttribute(ATTR.GENAI_USAGE_COMPLETION, usage.completion);
                    if (usage.total != null)
                        span.setAttribute(ATTR.LLM_USAGE_TOTAL, usage.total);
                }
                // Completion content
                if (this._traceContent && output?.generations) {
                    try {
                        span.setAttribute(ATTR.GENAI_OUTPUT_MESSAGES, _formatOutputMessages(output));
                    }
                    catch { /* non-serializable generation content */ }
                }
                this._endSpan(runId, 'ok');
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleLLMEnd error:', e);
                }
            }
        }
        async handleChatModelEnd(output, runId) {
            return this.handleLLMEnd(output, runId);
        }
        async handleLLMError(err, runId) {
            try {
                this._endSpan(runId, 'error', err);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleLLMError error:', e);
                }
            }
        }
        // ── Tool callbacks ─────────────────────────────────────────────
        async handleToolStart(tool, input, runId, parentRunId) {
            try {
                const toolName = _getClassName(tool);
                const spanName = `${toolName}.tool`;
                if (this._debug) {
                    console.log(`[TracingHandler] handleToolStart: ${spanName} run=${runId.substring(0, 8)} parent=${parentRunId?.substring(0, 8) ?? 'none'}`);
                }
                const parentCtx = this._resolveParentCtx(parentRunId);
                const span = handlerTracer.startSpan(spanName, { kind: api_1.SpanKind.CLIENT }, parentCtx);
                span.setAttributes({
                    [ATTR.TRACELOOP_SPAN_KIND]: 'tool',
                    [ATTR.TRACELOOP_ENTITY_NAME]: toolName,
                    [ATTR.TOOL_NAME]: toolName,
                });
                if (this._traceContent) {
                    try {
                        span.setAttribute(ATTR.TRACELOOP_ENTITY_INPUT, JSON.stringify({ args: [input] }));
                    }
                    catch { /* skip */ }
                }
                this._storeSpan(runId, span, parentCtx);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleToolStart error:', e);
                }
            }
        }
        async handleToolEnd(output, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                if (this._traceContent) {
                    try {
                        data.span.setAttribute(ATTR.TRACELOOP_ENTITY_OUTPUT, typeof output === 'string' ? output : JSON.stringify(output));
                    }
                    catch { /* skip */ }
                }
                this._endSpan(runId, 'ok');
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleToolEnd error:', e);
                }
            }
        }
        async handleToolError(err, runId) {
            try {
                this._endSpan(runId, 'error', err);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleToolError error:', e);
                }
            }
        }
        // ── Retriever callbacks ────────────────────────────────────────
        async handleRetrieverStart(retriever, query, runId, parentRunId) {
            try {
                const retrieverName = _getClassName(retriever);
                const spanName = `${retrieverName}.task`;
                if (this._debug) {
                    console.log(`[TracingHandler] handleRetrieverStart: ${spanName} run=${runId.substring(0, 8)} parent=${parentRunId?.substring(0, 8) ?? 'none'}`);
                }
                const parentCtx = this._resolveParentCtx(parentRunId);
                const span = handlerTracer.startSpan(spanName, { kind: api_1.SpanKind.CLIENT }, parentCtx);
                span.setAttributes({
                    [ATTR.TRACELOOP_SPAN_KIND]: 'task',
                    [ATTR.TRACELOOP_ENTITY_NAME]: retrieverName,
                });
                if (this._traceContent) {
                    try {
                        span.setAttribute(ATTR.TRACELOOP_ENTITY_INPUT, JSON.stringify({ query }));
                    }
                    catch { /* skip */ }
                }
                this._storeSpan(runId, span, parentCtx);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleRetrieverStart error:', e);
                }
            }
        }
        async handleRetrieverEnd(documents, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                if (this._traceContent) {
                    try {
                        const docs = documents.map((d) => {
                            const doc = d;
                            const content = doc?.['pageContent'];
                            return {
                                pageContent: typeof content === 'string' ? content.substring(0, 500) : undefined,
                                metadata: doc?.['metadata'],
                            };
                        });
                        data.span.setAttribute(ATTR.TRACELOOP_ENTITY_OUTPUT, JSON.stringify(docs));
                    }
                    catch { /* skip */ }
                }
                this._endSpan(runId, 'ok');
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleRetrieverEnd error:', e);
                }
            }
        }
        async handleRetrieverError(err, runId) {
            try {
                this._endSpan(runId, 'error', err);
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleRetrieverError error:', e);
                }
            }
        }
        // ── Agent action/finish callbacks ──────────────────────────────
        async handleAgentAction(action, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                const actionObj = action;
                data.span.setAttribute('agent.action.tool', actionObj?.['tool'] ?? 'unknown');
                if (this._traceContent && actionObj?.['toolInput']) {
                    try {
                        data.span.setAttribute('agent.action.input', JSON.stringify(actionObj['toolInput']));
                    }
                    catch { /* skip */ }
                }
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleAgentAction error:', e);
                }
            }
        }
        async handleAgentEnd(action, runId) {
            try {
                const data = this._spanMap.get(runId);
                if (!data)
                    return;
                if (this._traceContent) {
                    const actionObj = action;
                    try {
                        data.span.setAttribute('agent.return_values', JSON.stringify(actionObj?.['returnValues']));
                    }
                    catch { /* skip */ }
                }
            }
            catch (e) {
                if (this._debug) {
                    console.error('[TracingHandler] handleAgentEnd error:', e);
                }
            }
        }
    };
}
// ─── Convenience factory: create a handler INSTANCE ────────────────────────
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
function createTracingHandler(BaseCallbackHandler, options = {}) {
    const HandlerClass = createTracingHandlerClass(BaseCallbackHandler);
    return new HandlerClass(options);
}
// ─── Auto-injection: patch CallbackManager ─────────────────────────────────
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
function patchCallbackManagerWithHierarchy(CallbackManager, BaseCallbackHandler, traceContent, debug = false) {
    if (!CallbackManager) {
        if (debug) {
            console.warn('[TracingHandler] CallbackManager is missing; cannot apply hierarchy patch');
        }
        return false;
    }
    if (CallbackManager[PATCH_MARKER] === true || CallbackManager._hierarchyPatched === true) {
        return true;
    }
    const HandlerClass = createTracingHandlerClass(BaseCallbackHandler);
    const handlerOptions = { traceContent, debug, _shared: true };
    const originalConfigureSync = CallbackManager._configureSync;
    const originalConfigure = CallbackManager.configure;
    const patchSync = typeof originalConfigureSync === 'function';
    const patchPublic = !patchSync && typeof originalConfigure === 'function';
    if (!patchSync && !patchPublic) {
        if (debug) {
            console.warn('[TracingHandler] CallbackManager has no patchable configure function');
        }
        return false;
    }
    const buildPatchedArgs = (inheritableHandlers, localHandlers) => {
        let savedParentRunId;
        let inheritable;
        if (inheritableHandlers && !Array.isArray(inheritableHandlers)) {
            const maybeManager = inheritableHandlers;
            // Preserve both known variants to survive internal renames.
            savedParentRunId = maybeManager['_parentRunId'] ?? maybeManager['parentRunId'];
            const existingHandlers = maybeManager['handlers'];
            inheritable = Array.isArray(existingHandlers) ? [...existingHandlers] : [];
        }
        else {
            inheritable = Array.isArray(inheritableHandlers) ? [...inheritableHandlers] : [];
        }
        const local = Array.isArray(localHandlers) ? localHandlers : [];
        // Remove traceloop handlers — we replace them entirely to prevent
        // duplicate/conflicting spans from both traceloop and our handler.
        inheritable = inheritable.filter((h) => {
            const handler = h;
            const handlerName = (handler?.name ?? handler?.constructor?.name ?? '').toLowerCase();
            return !(handlerName.includes('traceloop') || handlerName.includes('langchaintracer'));
        });
        // Don't inject if our handler is already present (inherited from parent runnable
        // or manually passed by the consumer in localHandlers).
        const alreadyPresent = inheritable.some((h) => h?.name === 'progress_tracing_callback_handler' || h instanceof HandlerClass) ||
            local.some((h) => h?.name === 'progress_tracing_callback_handler' || h instanceof HandlerClass);
        if (!alreadyPresent) {
            inheritable.push(new HandlerClass(handlerOptions));
        }
        return { inheritable, local, savedParentRunId };
    };
    const restoreParentRunId = (result, savedParentRunId) => {
        if (!result || savedParentRunId === undefined || savedParentRunId === null)
            return;
        try {
            const resultObj = result;
            if ('_parentRunId' in resultObj || !('parentRunId' in resultObj)) {
                resultObj['_parentRunId'] = savedParentRunId;
            }
            if ('parentRunId' in resultObj) {
                resultObj['parentRunId'] = savedParentRunId;
            }
        }
        catch {
            // Best-effort compatibility only.
        }
    };
    if (patchSync) {
        CallbackManager._configureSync = function (inheritableHandlers, localHandlers, ...rest) {
            try {
                const { inheritable, local, savedParentRunId } = buildPatchedArgs(inheritableHandlers, localHandlers);
                const result = originalConfigureSync.call(this, inheritable, local, ...rest);
                restoreParentRunId(result, savedParentRunId);
                return result;
            }
            catch (e) {
                if (debug) {
                    console.error('[TracingHandler] _configureSync patch failed, falling back to original behavior:', e);
                }
                return originalConfigureSync.call(this, inheritableHandlers, localHandlers, ...rest);
            }
        };
    }
    else {
        // Future-compatible fallback if _configureSync is removed.
        const safeOriginalConfigure = originalConfigure;
        CallbackManager.configure = function (inheritableHandlers, localHandlers, ...rest) {
            try {
                const { inheritable, local, savedParentRunId } = buildPatchedArgs(inheritableHandlers, localHandlers);
                const result = safeOriginalConfigure.call(this, inheritable, local, ...rest);
                restoreParentRunId(result, savedParentRunId);
                return result;
            }
            catch (e) {
                if (debug) {
                    console.error('[TracingHandler] configure patch failed, falling back to original behavior:', e);
                }
                return safeOriginalConfigure.call(this, inheritableHandlers, localHandlers, ...rest);
            }
        };
    }
    CallbackManager[PATCH_MARKER] = true;
    CallbackManager._hierarchyPatched = true;
    // Prevent traceloop's own LangChain instrumentation from wrapping our patch.
    // traceloop's patchCallbackManager() can wrap our function,
    // converting the incoming CallbackManager instance (which carries
    // _parentRunId) into a plain array of handlers before calling us — causing
    // _parentRunId to be lost and all spans to appear on the root level.
    CallbackManager._traceloopPatched = true;
    return true;
}
//# sourceMappingURL=langchain-callback-handler.js.map