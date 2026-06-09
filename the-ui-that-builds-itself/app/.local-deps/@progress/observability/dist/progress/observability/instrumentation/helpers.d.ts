/**
 * Helper functions for Progress Observability instrumentation
 */
import { ObservabilityConfig } from './types';
type LogArg = unknown;
/**
 * Set the global logging state
 */
export declare function setLoggingEnabled(enabled: boolean): void;
/**
 * Get the current logging state
 */
export declare function isLoggingEnabled(): boolean;
/**
 * Clear all SDK environment variables to prevent conflicts
 */
export declare function clearSdkEnvVars(): void;
/**
 * Check if endpoint is HTTP/HTTPS (vs gRPC) with improved validation
 */
export declare function isHttpEndpoint(endpoint?: string): boolean;
/**
 * Validate endpoint format with detailed error messages
 */
export declare function validateEndpoint(endpoint: string): void;
/**
 * Initialize environment variables with Observability overrides
 */
export declare function initEnvironment(appName?: string, endpoint?: string, apiKey?: string, traceContent?: boolean): {
    appName: string;
    endpoint?: string;
    apiKey?: string;
    traceContent: boolean;
};
/**
 * Validate API key is provided via parameter or environment variable
 */
export declare function validateApiKey(apiKey?: string): string;
/**
 * Setup API key validation and authentication headers
 */
export declare function setupApiKeyHeaders(apiKey: string, endpoint?: string, config?: ObservabilityConfig): Record<string, string>;
/**
 * Validate configuration and apply defaults
 */
export declare function validateAndNormalizeConfig(config: ObservabilityConfig): Required<ObservabilityConfig>;
/**
 * Create a logger function that respects debug setting and global logging flag
 */
export declare function createLogger(debug: boolean): {
    debug: (...args: LogArg[]) => void;
    info: (...args: LogArg[]) => void;
    warn: (...args: LogArg[]) => void;
    error: (...args: LogArg[]) => void;
};
/**
 * Check if a value is a promise-like object
 */
export declare function isPromiseLike(value: unknown): value is Promise<unknown>;
/**
 * Wrap a function to handle both sync and async execution
 */
export declare function wrapFunction(_fn: Function, _wrapper: Function): Function;
export {};
//# sourceMappingURL=helpers.d.ts.map