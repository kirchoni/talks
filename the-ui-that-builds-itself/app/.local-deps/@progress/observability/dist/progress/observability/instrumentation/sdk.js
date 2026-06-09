"use strict";
/**
 * Observability SDK Implementation
 *
 * This implementation provides instrumentation for AI agents
 * and LLM applications using OpenTelemetry-based observability.
 *
 * Built on mature instrumentation libraries to provide comprehensive
 * coverage for AI agents and LLM applications while maintaining a clean API.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observability = void 0;
const traceloop = __importStar(require("@traceloop/node-server-sdk"));
const api_1 = require("@opentelemetry/api");
const types_1 = require("./types");
const helpers_1 = require("./helpers");
const constants_1 = require("./constants");
const model_fix_processor_1 = require("./model-fix-processor");
const genai_message_processor_1 = require("./genai-message-processor");
const tags_1 = require("./tags");
const langchain_callback_handler_1 = require("./langchain-callback-handler");
// Track ESM hooks registration state
const ESM_HOOKS_REGISTERED_SYMBOL = Symbol.for('@progress/observability:esm_hooks_registered');
// ESM dynamic import helpers — defined as module-level constants so the module
// specifiers are compile-time literals embedded in function bodies, never derived
// from user input or runtime strings. new Function() is required here to prevent
// TypeScript from transpiling import() to require() in CommonJS output, which would
// load the CJS module instance instead of the live ESM one.
// SECURITY: Only these two specifiers are ever imported this way.
const _esmImportLangChainManager = new Function('return import("@langchain/core/callbacks/manager")');
const _esmImportLangChainBase = new Function('return import("@langchain/core/callbacks/base")');
const INSTRUMENTATION_PACKAGE_MAP = {
    [types_1.ObservabilityInstruments.OPENAI]: '@traceloop/instrumentation-openai',
    [types_1.ObservabilityInstruments.ANTHROPIC]: '@traceloop/instrumentation-anthropic',
    [types_1.ObservabilityInstruments.COHERE]: '@traceloop/instrumentation-cohere',
    [types_1.ObservabilityInstruments.BEDROCK]: '@traceloop/instrumentation-bedrock',
    [types_1.ObservabilityInstruments.AZURE_OPENAI]: '@traceloop/instrumentation-azure',
    [types_1.ObservabilityInstruments.LANGCHAIN]: '@traceloop/instrumentation-langchain',
    [types_1.ObservabilityInstruments.LLAMA_INDEX]: '@traceloop/instrumentation-llamaindex',
    [types_1.ObservabilityInstruments.PINECONE]: '@traceloop/instrumentation-pinecone',
    [types_1.ObservabilityInstruments.CHROMA]: '@traceloop/instrumentation-chromadb',
    [types_1.ObservabilityInstruments.QDRANT]: '@traceloop/instrumentation-qdrant',
    [types_1.ObservabilityInstruments.REDIS]: '@opentelemetry/instrumentation-redis',
    [types_1.ObservabilityInstruments.MYSQL]: '@opentelemetry/instrumentation-mysql2',
    // HTTP-equivalent mappings
    [types_1.ObservabilityInstruments.REQUESTS]: '@opentelemetry/instrumentation-http',
    [types_1.ObservabilityInstruments.URLLIB]: '@opentelemetry/instrumentation-http',
};
class Observability {
    static _initialized = false;
    static _logger = (0, helpers_1.createLogger)(constants_1.DEFAULTS.DEBUG);
    static _tagsProcessor = null;
    static _langchainHierarchyPatched = false;
    /**
     * Attempt to resolve the consumer's @langchain/core/callbacks/manager module.
     * Returns the module if found, or null if the consumer does not have @langchain/core installed.
     * This avoids using the pinned copy bundled inside @traceloop/instrumentation-langchain.
     *
     * NOTE: This uses require() which is only available in CJS. The SDK is compiled
     * to CommonJS (tsconfig module: "CommonJS"), so require() is always available.
    */
    static _resolveConsumerLangChainCallbackManager() {
        try {
            require.resolve('@langchain/core/callbacks/manager');
            return require('@langchain/core/callbacks/manager');
        }
        catch (err) {
            const code = err && typeof err === 'object' ? err.code : undefined;
            if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
                // Consumer does not have @langchain/core installed; disable LangChain instrumentation.
                return null;
            }
            // Any other error indicates a real runtime problem that should not be silently ignored.
            this._logger.error('Failed to load @langchain/core/callbacks/manager; LangChain instrumentation will be disabled.', err);
            throw err;
        }
    }
    /**
     * Initialize Progress Observability instrumentation engine.
     *
     * @param config - Configuration options for Progress Observability instrumentation
     */
    static async instrument(config = {}) {
        if (this._initialized) {
            this._logger.warn('Observability already initialized, ignoring subsequent calls');
            return;
        }
        try {
            // Clear any existing SDK environment variables like Python version does
            (0, helpers_1.clearSdkEnvVars)();
            const normalizedConfig = (0, helpers_1.validateAndNormalizeConfig)(config);
            this._logger = (0, helpers_1.createLogger)(normalizedConfig.debug);
            this._logger.debug('Initializing Progress Observability instrumentation');
            // Update processors to use the same logger and debug setting
            model_fix_processor_1.ModelFixProcessor._debugEnabled = normalizedConfig.debug;
            model_fix_processor_1.ModelFixProcessor._logger = this._logger;
            genai_message_processor_1.GenAIMessageProcessor._debugEnabled = normalizedConfig.debug;
            genai_message_processor_1.GenAIMessageProcessor._logger = this._logger;
            // Warn if ESM hooks were not registered (consumer forgot --import)
            this._warnIfEsmHooksMissing();
            const consumerCallbackManager = this._resolveConsumerLangChainCallbackManager();
            const langchainIsBlocked = normalizedConfig.blockInstruments.has(types_1.ObservabilityInstruments.LANGCHAIN)
                || (normalizedConfig.instruments.size > 0 && !normalizedConfig.instruments.has(types_1.ObservabilityInstruments.LANGCHAIN));
            if (consumerCallbackManager && !langchainIsBlocked) {
                this._logger.debug('Consumer @langchain/core detected — will use consumer copy for instrumentation');
                // Patch synchronously before telemetry starts to avoid missing early spans.
                const cjsPatched = this._patchConsumerLangChainSync(consumerCallbackManager, normalizedConfig.traceContent, normalizedConfig.debug);
                // ESM module instance is separate from CJS. Await patching so we can
                // make a deterministic disableInstrumentations decision.
                const esmPatched = await this._patchConsumerLangChainEsm(normalizedConfig.traceContent, normalizedConfig.debug);
                const esmHooksActive = globalThis[ESM_HOOKS_REGISTERED_SYMBOL] === true;
                this._langchainHierarchyPatched = esmHooksActive ? esmPatched : cjsPatched;
            }
            else if (!langchainIsBlocked) {
                this._logger.debug('Consumer @langchain/core not found — falling back to traceloop bundled copy');
                this._langchainHierarchyPatched = false;
            }
            // Initialize underlying instrumentation engine
            traceloop.initialize(this._convertToInternalConfig(normalizedConfig, this._langchainHierarchyPatched));
            // Add custom span processors: message normalization first, then model fixes
            // Do this synchronously right after traceloop initialization
            this._addCustomProcessors();
            // Register TagsSpanProcessor for global and context tag propagation
            this._registerTagsProcessor(normalizedConfig.additionalTags);
            this._initialized = true;
            this._logger.debug('Progress Observability instrumentation started successfully');
        }
        catch (error) {
            this._logger.error('Failed to initialize Observability:', error);
            throw error;
        }
    }
    /**
     * Shutdown Progress Observability instrumentation
     */
    static async shutdown(timeoutMs = constants_1.DEFAULTS.TIMEOUT_MS) {
        if (!this._initialized) {
            return true;
        }
        try {
            this._logger.debug('Shutting down Observability...');
            // Underlying SDK doesn't expose a direct shutdown method, but we can
            // flush any pending telemetry by waiting a bit
            await new Promise(resolve => setTimeout(resolve, Math.min(timeoutMs, 2000)));
            if (this._tagsProcessor) {
                // Detach the TagsSpanProcessor from the tracer provider's active span processors
                try {
                    let provider = api_1.trace.getTracerProvider();
                    // Unwrap ProxyTracerProvider to find the real SDK provider
                    const possibleProviderProps = [
                        '_delegate', '_target', 'provider', '_provider', '_tracerProvider', 'tracerProvider'
                    ];
                    for (const prop of possibleProviderProps) {
                        if (provider[prop]) {
                            const delegate = provider[prop];
                            if (delegate['_activeSpanProcessor']) {
                                provider = delegate;
                                break;
                            }
                        }
                    }
                    if (provider && provider['_activeSpanProcessor']) {
                        const activeSpanProcessor = provider['_activeSpanProcessor'];
                        if (Array.isArray(activeSpanProcessor['_spanProcessors'])) {
                            activeSpanProcessor['_spanProcessors'] = activeSpanProcessor['_spanProcessors'].filter((processor) => processor !== this._tagsProcessor);
                        }
                    }
                }
                catch (detachError) {
                    // Best-effort cleanup; if internals change, don't fail shutdown
                    this._logger.debug('Failed to detach TagsSpanProcessor during shutdown', detachError);
                }
                await this._tagsProcessor.shutdown();
                this._tagsProcessor = null;
            }
            (0, langchain_callback_handler_1.resetSharedState)();
            this._initialized = false;
            this._logger.info('Observability shutdown completed successfully');
            return true;
        }
        catch (error) {
            this._logger.error('Error during Observability shutdown:', error);
            (0, langchain_callback_handler_1.resetSharedState)();
            this._initialized = false;
            return false;
        }
    }
    /**
     * Check if Observability is currently initialized
     */
    static get isInitialized() {
        return this._initialized;
    }
    /**
     * Enable or disable all logger output
     *
     * @param enabled - Whether to enable logging (true) or disable it (false)
     */
    static setLogging(enabled) {
        (0, helpers_1.setLoggingEnabled)(enabled);
    }
    /**
     * Warn if the ESM loader hooks were not registered.
     *
     * This method relies solely on the presence of a global registration symbol
     * that is set by the hooks registration module
     * (`@progress/observability/register/hooks`).
     *
     * NOTE: From this CommonJS bundle we cannot reliably determine whether the
     * *host* application is running as ESM or CommonJS. As a result, this
     * warning may appear in non-ESM setups and can be safely ignored there.
     */
    static _warnIfEsmHooksMissing() {
        // The hooks.mjs file sets this symbol when it successfully registers.
        const esmHooksRegistered = globalThis[ESM_HOOKS_REGISTERED_SYMBOL] === true;
        if (esmHooksRegistered) {
            return; // All good — hooks were registered
        }
        this._logger.warn('@progress/observability/register/hooks was not loaded. '
            + 'If you are using ESM ("type": "module"), auto-instrumentation may not work. '
            + 'Initialize the hooks by importing "@progress/observability/register/hooks" in a bootstrap file '
            + 'that runs before your application code. '
            + '(See README for full ESM setup instructions)');
    }
    /**
     * Patch the consumer's CallbackManager with the TraceloopCallbackHandler
     * using the LangChainInstrumentation.manuallyInstrument() API.
     * This ensures the consumer's own @langchain/core module instance gets
     * the tracing callback, not just traceloop's bundled copy.
     */
    static _patchConsumerLangChainSync(callbackManagerModule, traceContent, debug = false) {
        try {
            // Version compatibility check: ensure the consumer's @langchain/core
            // has a compatible CallbackManager API before patching.
            if (typeof callbackManagerModule?.CallbackManager?.configure !== 'function') {
                this._logger.warn('Consumer @langchain/core CallbackManager is missing the expected .configure() method. '
                    + 'This may indicate an incompatible version. Skipping LangChain patching.');
                return false;
            }
            // Resolve BaseCallbackHandler from the consumer's @langchain/core.
            let baseCallbackHandlerClass;
            try {
                baseCallbackHandlerClass = require('@langchain/core/callbacks/base').BaseCallbackHandler;
            }
            catch {
                this._logger.warn('@langchain/core/callbacks/base could not be resolved — skipping LangChain hierarchy patching');
                return false;
            }
            const patched = (0, langchain_callback_handler_1.patchCallbackManagerWithHierarchy)(callbackManagerModule.CallbackManager, baseCallbackHandlerClass, traceContent, debug);
            if (!patched) {
                this._logger.warn('Could not patch consumer @langchain/core CallbackManager. '
                    + 'Traceloop LangChain instrumentation fallback will remain enabled.');
                return false;
            }
            this._logger.debug('Successfully patched consumer @langchain/core CallbackManager with TracingCallbackHandler (CJS)');
            return true;
        }
        catch (error) {
            this._logger.warn('Failed to patch consumer @langchain/core. LangChain tracing may not work:', error);
            return false;
        }
    }
    static async _patchConsumerLangChainEsm(traceContent, debug = false) {
        // Skip if hooks aren't active; ESM module likely not involved.
        if (!globalThis[ESM_HOOKS_REGISTERED_SYMBOL]) {
            return false;
        }
        try {
            const esmCallbackManagerModule = await _esmImportLangChainManager();
            if (typeof esmCallbackManagerModule?.CallbackManager?.configure !== 'function') {
                this._logger.warn('ESM @langchain/core CallbackManager is missing the expected .configure() method — skipping ESM patch');
                return false;
            }
            const esmBaseModule = await _esmImportLangChainBase();
            if (!esmBaseModule?.BaseCallbackHandler) {
                this._logger.warn('ESM @langchain/core/callbacks/base did not expose BaseCallbackHandler — skipping ESM patch');
                return false;
            }
            const patched = (0, langchain_callback_handler_1.patchCallbackManagerWithHierarchy)(esmCallbackManagerModule.CallbackManager, esmBaseModule.BaseCallbackHandler, traceContent, debug);
            if (!patched) {
                this._logger.warn('ESM @langchain/core CallbackManager could not be patched by Progress handler');
                return false;
            }
            this._logger.debug('Successfully patched consumer @langchain/core CallbackManager with TracingCallbackHandler (ESM)');
            return true;
        }
        catch (error) {
            this._logger.warn('Failed to patch ESM @langchain/core. LangChain tracing may not work in ESM context:', error);
            return false;
        }
    }
    /**
     * Add custom span processors for message normalization and model fixes.
     *
     * This method adds GenAIMessageProcessor and ModelFixProcessor to the current TracerProvider.
     * Message normalization runs first, followed by model/provider fixes.
     */
    static _addCustomProcessors() {
        try {
            let tracerProvider = api_1.trace.getTracerProvider();
            // Traceloop may wrap the provider - try to find the underlying SDK TracerProvider
            // by checking for common wrapper patterns
            if (tracerProvider) {
                const possibleProviderProps = [
                    '_delegate',
                    '_target',
                    'provider',
                    '_provider',
                    '_tracerProvider',
                    'tracerProvider'
                ];
                for (const prop of possibleProviderProps) {
                    if (tracerProvider[prop]) {
                        const delegate = tracerProvider[prop];
                        // Check if this looks like a BasicTracerProvider/NodeTracerProvider
                        if (delegate['_activeSpanProcessor']) {
                            tracerProvider = delegate;
                            break;
                        }
                    }
                }
            }
            // Now try to access _activeSpanProcessor and its _spanProcessors array
            if (tracerProvider && tracerProvider['_activeSpanProcessor']) {
                const multiProcessor = tracerProvider['_activeSpanProcessor'];
                // MultiSpanProcessor has a _spanProcessors array
                if (multiProcessor['_spanProcessors'] && Array.isArray(multiProcessor['_spanProcessors'])) {
                    // Create processors: message normalization first, then model fixes
                    const messageProcessor = new genai_message_processor_1.GenAIMessageProcessor();
                    const modelProcessor = new model_fix_processor_1.ModelFixProcessor();
                    // IMPORTANT: Insert at the BEGINNING of the array so our processors run BEFORE
                    // the SimpleSpanProcessor that exports spans. If we push() to the end, the span
                    // will already be exported before we can fix it.
                    // Insert in reverse order using unshift so that GenAIMessageProcessor ends up at index 0
                    // and ModelFixProcessor at index 1
                    multiProcessor['_spanProcessors'].unshift(modelProcessor);
                    multiProcessor['_spanProcessors'].unshift(messageProcessor);
                    const processorCount = multiProcessor['_spanProcessors'].length;
                    this._logger.debug(`Custom processors added: GenAIMessageProcessor at index 0, ModelFixProcessor at index 1 (${processorCount} total processors)`);
                    return; // Success!
                }
                this._logger.warn('_activeSpanProcessor found but _spanProcessors array not accessible');
            }
            else {
                this._logger.warn('Could not find _activeSpanProcessor on TracerProvider');
            }
        }
        catch (error) {
            // Don't fail initialization if we can't add the processor
            this._logger.warn('Failed to add custom processors:', error);
        }
    }
    /**
     * Register the TagsSpanProcessor with the current TracerProvider.
     *
     * The processor is always registered to handle context-propagated tags
     * from propagateAttributes(). When additionalTags is provided, those
     * global tags are also applied to every span.
     */
    static _registerTagsProcessor(additionalTags = []) {
        const processor = new tags_1.TagsSpanProcessor(additionalTags);
        this._tagsProcessor = processor;
        let provider = api_1.trace.getTracerProvider();
        // Unwrap ProxyTracerProvider to find the real SDK provider
        const possibleProviderProps = [
            '_delegate', '_target', 'provider', '_provider', '_tracerProvider', 'tracerProvider'
        ];
        for (const prop of possibleProviderProps) {
            if (provider[prop]) {
                const delegate = provider[prop];
                if (delegate['_activeSpanProcessor']) {
                    provider = delegate;
                    break;
                }
            }
        }
        // Directly add to the MultiSpanProcessor's internal array (works with SDK v1 and v2)
        if (provider['_activeSpanProcessor']) {
            const multiProcessor = provider['_activeSpanProcessor'];
            if (multiProcessor['_spanProcessors'] && Array.isArray(multiProcessor['_spanProcessors'])) {
                multiProcessor['_spanProcessors'].push(processor);
                this._logger.debug('TagsSpanProcessor registered via _activeSpanProcessor');
                return;
            }
        }
        // Fallback: try addSpanProcessor (SDK v1 only)
        if (typeof provider.addSpanProcessor === 'function') {
            provider.addSpanProcessor(processor);
            return;
        }
        this._logger.warn('Could not register TagsSpanProcessor: no suitable TracerProvider found');
    }
    /**
     * Convert Observability config to internal config format
     */
    static _convertToInternalConfig(config, langchainPatched) {
        const internalConfig = {
            // Disable batching to ensure immediate telemetry export - use Node.js parameter names
            disableBatch: config.disableBatch,
            // Set app name - use Node.js parameter names
            appName: config.appName,
            // Set trace content - whether to log prompts/completions
            traceContent: config.traceContent,
        };
        // Configure endpoint - use baseUrl for underlying SDK  
        if (config.endpoint) {
            let endpoint = (0, helpers_1.isHttpEndpoint)(config.endpoint)
                ? config.endpoint
                : `http://${config.endpoint}`;
            // SDK automatically appends /v1/traces, so we need to provide just the base
            if (endpoint.endsWith('/v1/traces')) {
                endpoint = endpoint.replace('/v1/traces', '');
            }
            internalConfig.baseUrl = endpoint;
        }
        // Configure API key directly - use Node.js parameter names
        if (config.apiKey) {
            internalConfig.apiKey = config.apiKey;
        }
        // Configure headers for OTLP HTTP endpoint - match Python implementation
        if (config.apiKey && config.endpoint) {
            const headers = {
                "Authorization": `Bearer ${config.apiKey}`,
                "X-Api-Key": config.apiKey,
            };
            // Merge with any additional headers
            Object.assign(headers, config.headers || {});
            internalConfig.headers = headers;
        }
        // Configure instrumentations using the single source-of-truth map.
        // Strategy:
        // 1. If an allow-list (config.instruments) is provided, disable every mapped instrumentation not in allow-list.
        // 2. Apply explicit block list on top (even if also in allow list).
        const disableSet = new Set();
        const allEntries = Object.entries(INSTRUMENTATION_PACKAGE_MAP);
        if (config.instruments.size > 0) {
            for (const [instrumentKey, pkg] of allEntries) {
                if (!config.instruments.has(instrumentKey)) {
                    disableSet.add(pkg);
                }
            }
        }
        // Block list iteration (includes support for special synonyms not in enum: http / https)
        for (const blocked of config.blockInstruments) {
            // If key is directly supported
            if (blocked in INSTRUMENTATION_PACKAGE_MAP) {
                disableSet.add(INSTRUMENTATION_PACKAGE_MAP[blocked]);
                continue;
            }
            // Synonyms / special cases
            const blockedStr = String(blocked);
            if (blockedStr === 'http' || blockedStr === 'https') {
                disableSet.add('@opentelemetry/instrumentation-http');
            }
        }
        // Disable Traceloop's built-in LangChain instrumentation only when our
        // custom hierarchy patch is confirmed active. This avoids all-or-nothing
        // failure where both implementations are unavailable.
        if (langchainPatched) {
            disableSet.add('@traceloop/instrumentation-langchain');
            // Suppress raw provider-level OpenAI spans when LangChain hierarchy patch
            // is active to avoid duplicate LLM spans for the same logical request.
            const openAiExplicitlyAllowed = config.instruments.has(types_1.ObservabilityInstruments.OPENAI)
                || config.instruments.has(types_1.ObservabilityInstruments.AZURE_OPENAI);
            if (!openAiExplicitlyAllowed) {
                disableSet.add('@traceloop/instrumentation-openai');
                disableSet.add('@traceloop/instrumentation-azure');
                // Traceloop Node SDK currently does not consume a disable list during
                // instrumentation bootstrap; it initializes OpenAI/LangChain by default.
                // Use manual module mode as an explicit runtime workaround to keep
                // LangChain instrumentation active while preventing OpenAI duplication.
                internalConfig.instrumentModules = { langchain: true };
            }
        }
        else if (!config.blockInstruments.has(types_1.ObservabilityInstruments.LANGCHAIN)) {
            this._logger.warn('Progress LangChain hierarchy patch is not active. '
                + 'Keeping @traceloop/instrumentation-langchain enabled as fallback.');
        }
        if (disableSet.size > 0) {
            internalConfig.disableInstrumentations = Array.from(disableSet);
        }
        // Add resource attributes
        if (Object.keys(config.resourceAttributes).length > 0) {
            internalConfig.resourceAttributes = config.resourceAttributes;
        }
        // Disable internal telemetry to match Python behavior
        internalConfig.telemetryEnabled = false;
        // Silence initialization message from underlying SDK
        internalConfig.silenceInitializationMessage = true;
        // Enable debug logging to see what's happening
        if (config.debug) {
            internalConfig.logLevel = 'debug';
        }
        return internalConfig;
    }
}
exports.Observability = Observability;
//# sourceMappingURL=sdk.js.map