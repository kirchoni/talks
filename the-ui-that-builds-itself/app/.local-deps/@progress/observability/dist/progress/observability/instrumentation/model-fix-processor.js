"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelFixProcessor = void 0;
const helpers_1 = require("./helpers");
const constants_1 = require("./constants");
const PROVIDER_REGISTRY = {
    azure: {
        providerName: 'Azure',
        spanNamePatterns: ['azure'], // Matches: AzureOpenAI.workflow, AzureChatOpenAI.chat, etc.
        endpointKeywords: ['azure'],
        modelPrefixes: [],
        defaultPort: null,
    },
    openai: {
        providerName: 'OpenAI',
        spanNamePatterns: ['openai'], // Matches: openai.chat, openai.response, ChatOpenAI.chat, etc.
        endpointKeywords: [],
        modelPrefixes: [],
        defaultPort: null,
    },
    openrouter: {
        providerName: 'OpenRouter',
        spanNamePatterns: ['openrouter'], // Matches: OpenRouter.task, etc.
        endpointKeywords: ['openrouter'],
        modelPrefixes: [
            'google/', 'anthropic/', 'openai/', 'meta-llama/', 'meta/', 'microsoft/',
            'mistralai/', 'cohere/', 'ai21/', 'huggingfaceh4/', 'teknium/',
            'nousresearch/', 'openchat/', 'codellama/', 'phind/', 'wizardlm/',
            '01-ai/', 'alpindale/', 'cognitivecomputations/',
            'databricks/', 'deepseek/', 'gryphe/', 'intel/', 'jondurbin/',
            'migtissera/', 'neversleep/', 'undi95/', 'xwin-lm/'
        ],
        defaultPort: null,
    },
    // Ollama is not supported yet in the TS SDK
    // ollama: {
    //     providerName: 'Ollama',
    //     spanNamePatterns: ['ollama'], // Matches: ChatOllama.chat, Ollama.workflow, etc.
    //     endpointKeywords: ['ollama'],
    //     modelPrefixes: [],
    //     defaultPort: 11434,
    // },
    bedrock: {
        providerName: 'AWS',
        spanNamePatterns: ['bedrock'], // Matches: bedrock.converse, BedrockConverse.workflow, etc.
        endpointKeywords: ['bedrock'],
        modelPrefixes: [],
        defaultPort: null,
    },
    anthropic: {
        providerName: 'Anthropic',
        spanNamePatterns: ['anthropic', 'claude'], // Matches: anthropic.converse, Anthropic.workflow, etc.
        endpointKeywords: ['anthropic'],
        modelPrefixes: ['claude-'],
        defaultPort: null,
    },
    // SageMaker is not supported yet in the TS SDK
    // sagemaker: {
    //     providerName: 'SageMaker',
    //     spanNamePatterns: ['sagemaker'], // Matches: SageMaker.workflow, etc.
    //     endpointKeywords: ['sagemaker'],
    //     modelPrefixes: [],
    //     defaultPort: null,
    // },
    cohere: {
        providerName: 'Cohere',
        spanNamePatterns: ['cohere'], // Matches: cohere.chat, Cohere.workflow, etc.
        endpointKeywords: ['cohere'],
        modelPrefixes: ['command-'],
        defaultPort: null,
    },
    google: {
        providerName: 'Google',
        spanNamePatterns: ['gemini'], // Matches: gemini.chat, Gemini.workflow, etc.
        endpointKeywords: ['generativelanguage.googleapis.com'],
        modelPrefixes: ['gemini-'],
        defaultPort: null,
    },
    vertexai: {
        providerName: 'VertexAI',
        spanNamePatterns: ['vertexai', 'vertex'], // Matches: VertexAI.workflow, etc.
        endpointKeywords: ['aiplatform.googleapis.com'],
        modelPrefixes: [],
        defaultPort: null,
    },
    // Groq is not supported yet in the TS SDK
    // groq: {
    //     providerName: 'Groq',
    //     spanNamePatterns: ['groq'], // Matches: groq.chat, Groq.workflow, etc.
    //     endpointKeywords: ['groq'],
    //     modelPrefixes: [],
    //     defaultPort: null,
    // },
    // HuggingFace is not supported yet in the TS SDK
    // huggingface: {
    //     providerName: 'HuggingFace',
    //     spanNamePatterns: ['huggingface'], // Matches: HuggingFace.workflow, etc.
    //     endpointKeywords: ['huggingface'],
    //     modelPrefixes: [],
    //     defaultPort: null,
    // },
    // Mistral is not supported yet in the TS SDK
    // mistral: {
    //     providerName: 'Mistral',
    //     spanNamePatterns: ['mistral'], // Matches: mistral.chat, Mistral.workflow, etc.
    //     endpointKeywords: ['mistral'],
    //     modelPrefixes: ['mistral-'],
    //     defaultPort: null,
    // },
};
const INVALID_MODEL_VALUES = [null, undefined, '', 'unknown'];
function isInvalidModel(value) {
    return INVALID_MODEL_VALUES.includes(value);
}
/**
 * Extract model ID from Bedrock ARN format if present.
 * Example: arn:aws:bedrock:us-east-1:526094459302:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0
 * Extract: us.anthropic.claude-haiku-4-5-20251001-v1:0
 *
 * @param model - The model string that may contain a Bedrock ARN
 * @returns The extracted model ID or the original model string
 */
function extractModelFromBedrockArn(model) {
    if (!model) {
        return model;
    }
    if (model.includes('inference-profile/')) {
        const parts = model.split('inference-profile/');
        if (parts.length > 1) {
            return parts[1];
        }
    }
    return model;
}
/**
 * Check if two model names are compatible (same base model).
 * Examples:
 * - "gpt-4o-mini" and "gpt-4o-mini-2024-07-18" are compatible
 * - "gpt-4o" and "gpt-4" are NOT compatible
 *
 * @param model1 - First model name
 * @param model2 - Second model name
 * @returns True if models are compatible (one is a prefix of the other)
 */
function areModelsCompatible(model1, model2) {
    if (!model1 || !model2) {
        return false;
    }
    const m1 = String(model1).toLowerCase();
    const m2 = String(model2).toLowerCase();
    // If they're exactly the same, they're compatible
    if (m1 === m2) {
        return true;
    }
    // Check if one is a prefix of the other (handles version suffixes).
    // To avoid false positives like "gpt-4" vs "gpt-4o", require a boundary
    // by appending a '-' to each model before prefix-checking. This makes
    // "gpt-4-" match "gpt-4-2024-08-17" but prevents "gpt-4" matching "gpt-4o".
    const m1p = m1.endsWith('-') ? m1 : `${m1}-`;
    const m2p = m2.endsWith('-') ? m2 : `${m2}-`;
    return m1p.startsWith(m2p) || m2p.startsWith(m1p);
}
function spanNeedsFixing(attributes, providerKey) {
    // If traceloop.span.kind is workflow/agent/tool, do not fix
    // Exclude task because some tasks can be LLM calls 
    const spanKind = attributes['traceloop.span.kind'];
    if (spanKind === "workflow" || spanKind === "agent" || spanKind === "tool") {
        return false;
    }
    // In the current implementation gen_ai.agent.name appears only in agent spans, 
    // this can change with traceloop update and the attribute may appear in LLM calls as well.
    // If this happens we have to rethink the logic to distinguish agent 
    // from LLM spans
    const agentName = attributes['gen_ai.agent.name'];
    if (agentName) {
        return false; // This is an agent span, not a LLM span
    }
    const providerName = attributes['gen_ai.provider.name'];
    const systemName = attributes['gen_ai.system'];
    if (!providerName && !systemName) {
        return true;
    }
    // Check if the provider name matches the detected provider
    const detectedProvider = providerKey;
    if (detectedProvider) {
        const detectedProviderName = PROVIDER_REGISTRY[detectedProvider]?.providerName?.toLowerCase();
        const existingProviderName = String(providerName || systemName).toLowerCase();
        if (String(existingProviderName) !== String(detectedProviderName)) {
            return true; //provider name mismatch
        }
    }
    const requestModel = attributes['gen_ai.request.model'];
    const responseModel = attributes['gen_ai.response.model'];
    if (isInvalidModel(requestModel) || isInvalidModel(responseModel)) {
        return true; //missing or invalid model names
    }
    // Check if model contains inference profile ARN that needs extraction
    // Even if models match, if they contain ARN format, we need to process to extract clean model ID
    if (requestModel && String(requestModel).includes('inference-profile/')) {
        return true; // Has inference profile ARN, needs extraction
    }
    if (responseModel && String(responseModel).includes('inference-profile/')) {
        return true; // Has inference profile ARN, needs extraction
    }
    // Only flag as needing fixing if models are incompatible (completely different)
    // Compatible models like "gpt-4o-mini" and "gpt-4o-mini-2024-07-18" don't need fixing
    if (requestModel !== responseModel && !areModelsCompatible(requestModel, responseModel)) {
        return true; //incompatible model names
    }
    const hasInputTokens = attributes['gen_ai.usage.input_tokens'] !== undefined;
    const hasOutputTokens = attributes['gen_ai.usage.output_tokens'] !== undefined;
    const hasLegacyInputTokens = attributes['gen_ai.usage.prompt_tokens'] !== undefined;
    const hasLegacyOutputTokens = attributes['gen_ai.usage.completion_tokens'] !== undefined;
    if (!hasInputTokens && !hasOutputTokens && !hasLegacyInputTokens && !hasLegacyOutputTokens) {
        return true; //missing usage tokens
    }
    return false;
}
function detectProvider(attributes, spanName) {
    //model detection from prefixes (for openrouter via OpenAI case)
    for (const modelKey of ["gen_ai.request.model", "gen_ai.response.model", "traceloop.association.properties.ls_model_name"]) {
        const modelName = attributes[modelKey];
        if (modelName) {
            const modelNameLower = String(modelName).toLowerCase();
            for (const [providerKey, config] of Object.entries(PROVIDER_REGISTRY)) {
                const prefixes = config.modelPrefixes || [];
                for (const prefix of prefixes) {
                    if (modelNameLower.startsWith(prefix)) {
                        return providerKey;
                    }
                }
            }
        }
    }
    // endpoint detection
    const apiBase = attributes['gen_ai.openai.api_base'] || '';
    const endpoint = attributes['server.address'] ||
        attributes['http.url'] ||
        attributes['url.full'] ||
        attributes['http.host'] ||
        apiBase;
    const endpointStr = String(endpoint || '').toLowerCase();
    if (endpointStr) {
        for (const [providerKey, config] of Object.entries(PROVIDER_REGISTRY)) {
            const keywords = config.endpointKeywords || [];
            for (const keyword of keywords) {
                if (endpointStr.includes(keyword)) {
                    return providerKey;
                }
            }
            const defaultPort = config.defaultPort;
            if (defaultPort && endpointStr.includes(`:${defaultPort}`)) {
                return providerKey;
            }
        }
    }
    // span name detection
    if (spanName) {
        const spanNameLower = spanName.toLowerCase();
        for (const [providerKey, config] of Object.entries(PROVIDER_REGISTRY)) {
            const patterns = config.spanNamePatterns || [];
            for (const pattern of patterns) {
                if (spanNameLower.includes(pattern)) {
                    return providerKey;
                }
            }
        }
    }
    return undefined;
}
/** Span processor that fixes missing or incorrect gen_ai attributes. */
class ModelFixProcessor {
    activeSpans = new Set();
    static _logger = (0, helpers_1.createLogger)(constants_1.DEFAULTS.DEBUG); // Defaults to DEFAULTS.DEBUG, can be overridden by SDK
    static _debugEnabled = constants_1.DEFAULTS.DEBUG; // Defaults to DEFAULTS.DEBUG, can be overridden by SDK
    onStart(span, _parentContext) {
        try {
            // Add all AI spans to active set - we'll check if they need fixing on end
            const spanId = `${span.spanContext().traceId}-${span.spanContext().spanId}`;
            this.activeSpans.add(spanId);
        }
        catch {
            // Defensive - don't break instrumentation
        }
    }
    onEnd(readableSpan) {
        const spanId = `${readableSpan.spanContext().traceId}-${readableSpan.spanContext().spanId}`;
        if (!this.activeSpans.has(spanId)) {
            return;
        }
        // Remove from active set
        this.activeSpans.delete(spanId);
        // Now check if the span actually needs fixing (with complete data including response model)
        const providerKey = detectProvider(readableSpan.attributes || {}, readableSpan.name);
        const shouldFix = spanNeedsFixing(readableSpan.attributes, providerKey);
        if (!shouldFix) {
            return; // Span is already correct, no need to process
        }
        // Build context with all necessary information
        const context = this.buildSpanContext(readableSpan, providerKey);
        // Log before processing (debug only)
        this.logBeforeProcessing(context);
        // Apply all fixes
        this.applyAllFixes(context);
        // Log after processing (debug only)
        this.logAfterProcessing(context);
    }
    forceFlush() {
        return Promise.resolve();
    }
    shutdown() {
        this.activeSpans.clear();
        return Promise.resolve();
    }
    /**
     * Build context object with all span information needed for processing.
     *
     * @param readableSpan - The span to build context for
     * @param providerKey - Optional pre-detected provider key
     * @returns SpanContext object with all necessary data
     */
    buildSpanContext(readableSpan, providerKey) {
        const attributes = (readableSpan.attributes || {});
        const spanName = readableSpan.name;
        // Extract current attribute values
        const requestModel = attributes['gen_ai.request.model'];
        const responseModel = attributes['gen_ai.response.model'];
        const providerAttr = (attributes['gen_ai.provider.name'] || attributes['gen_ai.system']);
        const systemAttr = attributes['gen_ai.system'];
        // Detect provider if not already provided
        const detectedProviderKey = providerKey; // || detectProvider(attributes, spanName);
        // Compute derived values
        const correctModelName = this.getCorrectModelName(attributes, detectedProviderKey);
        const correctProvider = this.getCorrectProviderFromKey(detectedProviderKey);
        return {
            span: readableSpan,
            spanName,
            attributes,
            providerKey: detectedProviderKey,
            correctProvider,
            correctModelName,
            requestModel,
            responseModel,
            providerAttr,
            systemAttr
        };
    }
    /** Logs span state before processing (debug only). */
    logBeforeProcessing(context) {
        if (!ModelFixProcessor._debugEnabled) {
            return;
        }
        ModelFixProcessor._logger.debug(`\n${'='.repeat(80)}`);
        ModelFixProcessor._logger.debug(`[ModelFixProcessor] Processing span: ${context.spanName}`);
        ModelFixProcessor._logger.debug(`${'='.repeat(80)}\n`);
        ModelFixProcessor._logger.debug(`BEFORE: request=${context.requestModel}, response=${context.responseModel}, provider=${context.providerAttr || context.systemAttr}`);
    }
    /** Applies provider and model attribute fixes to the span. */
    applyAllFixes(context) {
        try {
            const targetAttrs = this.getWritableAttributes(context.span);
            if (!targetAttrs) {
                return;
            }
            // Fix provider attribute (and legacy system attribute for backwards compatibility)
            this.fixProviderAttribute(targetAttrs, context.providerAttr, context.correctProvider);
            // Fix model attributes
            this.fixModelAttributes(targetAttrs, context.providerKey, context.requestModel, context.responseModel, context.correctModelName);
        }
        catch {
            // Defensive - don't break instrumentation
        }
    }
    /** Logs span state after processing (debug only). */
    logAfterProcessing(context) {
        if (!ModelFixProcessor._debugEnabled) {
            return;
        }
        const finalAttrs = this.getWritableAttributes(context.span);
        if (finalAttrs) {
            const finalProvider = finalAttrs['gen_ai.provider.name'] || finalAttrs['gen_ai.system'];
            const finalRequest = finalAttrs['gen_ai.request.model'];
            const finalResponse = finalAttrs['gen_ai.response.model'];
            ModelFixProcessor._logger.debug(`AFTER: request=${finalRequest}, response=${finalResponse}, provider=${finalProvider}`);
        }
        ModelFixProcessor._logger.debug(`${'='.repeat(80)}\n`);
    }
    /** Extracts the correct model name from span attributes, preserving full identifiers. */
    getCorrectModelName(attributes, providerKey) {
        // For Bedrock spans, prioritize request model since response model is often missing
        if (providerKey === 'bedrock') {
            const requestModel = extractModelFromBedrockArn(attributes['gen_ai.request.model']);
            if (requestModel && !isInvalidModel(requestModel)) {
                return requestModel;
            }
        }
        // For other spans, try to get from standard response model if it's valid
        const responseModel = attributes['gen_ai.response.model'];
        if (responseModel && !isInvalidModel(responseModel)) {
            return responseModel;
        }
        // Ollama is not supported yet in the TS SDK
        // For Ollama spans, check the traceloop association properties
        // if (providerKey === 'ollama') {
        //   const lsModelName = attributes['traceloop.association.properties.ls_model_name'] as string | undefined;
        //   if (lsModelName) {
        //     return lsModelName;
        //   }
        // }
        return undefined;
    }
    /** Maps provider key to provider name (e.g., 'azure' → 'Azure'). */
    getCorrectProviderFromKey(providerKey) {
        if (providerKey) {
            return PROVIDER_REGISTRY[providerKey].providerName;
        }
        // Default to Unknown when we cannot reliably determine provider
        return 'Unknown';
    }
    /** Returns mutable attributes object for modification. */
    getWritableAttributes(readableSpan) {
        if (readableSpan.attributes && typeof readableSpan.attributes === 'object') {
            return readableSpan.attributes;
        }
        // Attributes are not mutable or not available; document as a known limitation.
        return undefined;
    }
    /** Sets gen_ai.provider.name and gen_ai.system (if present) to correct provider. */
    fixProviderAttribute(targetAttrs, providerAttr, correctProvider) {
        if (correctProvider && providerAttr !== correctProvider) {
            if (ModelFixProcessor._debugEnabled) {
                ModelFixProcessor._logger.debug(`Fixing provider: ${providerAttr} -> ${correctProvider}`);
            }
            targetAttrs['gen_ai.provider.name'] = correctProvider;
            // Only update gen_ai.system if it already exists (backwards compatibility)
            if ('gen_ai.system' in targetAttrs) {
                targetAttrs['gen_ai.system'] = correctProvider;
            }
            targetAttrs['traceloop.association.properties.ls_provider'] = correctProvider;
        }
    }
    fixModelAttributes(targetAttrs, providerKey, requestModelAttr, responseModelAttr, correctModelName) {
        // For Bedrock spans, use request model as the source of truth
        if (providerKey === 'bedrock') {
            if (isInvalidModel(correctModelName)) {
                // Invalid model value - cannot fix
                if (ModelFixProcessor._debugEnabled) {
                    ModelFixProcessor._logger.debug(`Cannot set Bedrock model: request_model=${requestModelAttr}`);
                }
                return;
            }
            // Fix request model if it differs from correct model
            if (requestModelAttr !== correctModelName) {
                if (ModelFixProcessor._debugEnabled) {
                    ModelFixProcessor._logger.debug(`Bedrock span: fixing request model to ${correctModelName}`);
                }
                targetAttrs['gen_ai.request.model'] = correctModelName;
            }
            // Always ensure response model matches the correct model (whether request was fixed or not)
            if (responseModelAttr !== correctModelName) {
                if (ModelFixProcessor._debugEnabled) {
                    ModelFixProcessor._logger.debug(`Bedrock span: fixing response model to ${correctModelName}`);
                }
                targetAttrs['gen_ai.response.model'] = correctModelName;
            }
            return;
        }
        // For non-Bedrock spans, determine the primary model value
        // Priority: response > request > correct_model_name
        const primaryModel = !isInvalidModel(responseModelAttr)
            ? responseModelAttr
            : !isInvalidModel(requestModelAttr)
                ? requestModelAttr
                : correctModelName;
        // Early return if no valid model found
        if (!primaryModel) {
            return;
        }
        // Apply fixes: set both request and response to the primary value
        if (primaryModel !== requestModelAttr) {
            if (ModelFixProcessor._debugEnabled) {
                ModelFixProcessor._logger.debug(`Fixing request model: ${requestModelAttr} -> ${primaryModel}`);
            }
            targetAttrs['gen_ai.request.model'] = primaryModel;
        }
        if (primaryModel !== responseModelAttr) {
            if (ModelFixProcessor._debugEnabled) {
                ModelFixProcessor._logger.debug(`Fixing response model: ${responseModelAttr} -> ${primaryModel}`);
            }
            targetAttrs['gen_ai.response.model'] = primaryModel;
        }
    }
}
exports.ModelFixProcessor = ModelFixProcessor;
//# sourceMappingURL=model-fix-processor.js.map