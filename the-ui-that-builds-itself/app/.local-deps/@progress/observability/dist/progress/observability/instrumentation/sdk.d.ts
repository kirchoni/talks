/**
 * Observability SDK Implementation
 *
 * This implementation provides instrumentation for AI agents
 * and LLM applications using OpenTelemetry-based observability.
 *
 * Built on mature instrumentation libraries to provide comprehensive
 * coverage for AI agents and LLM applications while maintaining a clean API.
 */
import { ObservabilityConfig } from './types';
export declare class Observability {
    private static _initialized;
    private static _logger;
    private static _tagsProcessor;
    private static _langchainHierarchyPatched;
    /**
     * Attempt to resolve the consumer's @langchain/core/callbacks/manager module.
     * Returns the module if found, or null if the consumer does not have @langchain/core installed.
     * This avoids using the pinned copy bundled inside @traceloop/instrumentation-langchain.
     *
     * NOTE: This uses require() which is only available in CJS. The SDK is compiled
     * to CommonJS (tsconfig module: "CommonJS"), so require() is always available.
    */
    private static _resolveConsumerLangChainCallbackManager;
    /**
     * Initialize Progress Observability instrumentation engine.
     *
     * @param config - Configuration options for Progress Observability instrumentation
     */
    static instrument(config?: ObservabilityConfig): Promise<void>;
    /**
     * Shutdown Progress Observability instrumentation
     */
    static shutdown(timeoutMs?: number): Promise<boolean>;
    /**
     * Check if Observability is currently initialized
     */
    static get isInitialized(): boolean;
    /**
     * Enable or disable all logger output
     *
     * @param enabled - Whether to enable logging (true) or disable it (false)
     */
    static setLogging(enabled: boolean): void;
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
    private static _warnIfEsmHooksMissing;
    /**
     * Patch the consumer's CallbackManager with the TraceloopCallbackHandler
     * using the LangChainInstrumentation.manuallyInstrument() API.
     * This ensures the consumer's own @langchain/core module instance gets
     * the tracing callback, not just traceloop's bundled copy.
     */
    private static _patchConsumerLangChainSync;
    private static _patchConsumerLangChainEsm;
    /**
     * Add custom span processors for message normalization and model fixes.
     *
     * This method adds GenAIMessageProcessor and ModelFixProcessor to the current TracerProvider.
     * Message normalization runs first, followed by model/provider fixes.
     */
    private static _addCustomProcessors;
    /**
     * Register the TagsSpanProcessor with the current TracerProvider.
     *
     * The processor is always registered to handle context-propagated tags
     * from propagateAttributes(). When additionalTags is provided, those
     * global tags are also applied to every span.
     */
    private static _registerTagsProcessor;
    /**
     * Convert Observability config to internal config format
     */
    private static _convertToInternalConfig;
}
//# sourceMappingURL=sdk.d.ts.map