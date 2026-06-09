"use strict";
/**
 * Helper functions for Progress Observability instrumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLoggingEnabled = setLoggingEnabled;
exports.isLoggingEnabled = isLoggingEnabled;
exports.clearSdkEnvVars = clearSdkEnvVars;
exports.isHttpEndpoint = isHttpEndpoint;
exports.validateEndpoint = validateEndpoint;
exports.initEnvironment = initEnvironment;
exports.validateApiKey = validateApiKey;
exports.setupApiKeyHeaders = setupApiKeyHeaders;
exports.validateAndNormalizeConfig = validateAndNormalizeConfig;
exports.createLogger = createLogger;
exports.isPromiseLike = isPromiseLike;
exports.wrapFunction = wrapFunction;
const constants_1 = require("./constants");
/**
 * Global flag to control logging output
 */
let _loggingEnabled = true;
/**
 * Set the global logging state
 */
function setLoggingEnabled(enabled) {
    _loggingEnabled = enabled;
}
/**
 * Get the current logging state
 */
function isLoggingEnabled() {
    return _loggingEnabled;
}
/**
 * Clear all SDK environment variables to prevent conflicts
 */
function clearSdkEnvVars() {
    for (const envVar of constants_1.SDK_ENV_VARS) {
        delete process.env[envVar];
    }
}
/**
 * Check if endpoint is HTTP/HTTPS (vs gRPC) with improved validation
 */
function isHttpEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') {
        return false;
    }
    try {
        const url = new URL(endpoint);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return Boolean(endpoint.startsWith('http://') || endpoint.startsWith('https://'));
    }
}
/**
 * Validate endpoint format with detailed error messages
 */
function validateEndpoint(endpoint) {
    if (!endpoint.trim()) {
        throw new Error('Endpoint cannot be empty');
    }
    if (!isHttpEndpoint(endpoint) && !endpoint.includes(':')) {
        throw new Error(`Invalid endpoint format: ${endpoint}. Expected HTTP/HTTPS URL or host:port format`);
    }
    if (isHttpEndpoint(endpoint)) {
        try {
            new URL(endpoint);
        }
        catch {
            throw new Error(`Invalid HTTP endpoint URL: ${endpoint}`);
        }
    }
}
/**
 * Initialize environment variables with Observability overrides
 */
function initEnvironment(appName, endpoint, apiKey, traceContent) {
    const resolvedEndpoint = process.env.OBSERVABILITY_ENDPOINT || endpoint;
    const resolvedApiKey = validateApiKey(apiKey);
    const resolvedAppName = process.env.OBSERVABILITY_APP_NAME || appName || constants_1.DEFAULTS.APP_NAME;
    // Handle traceContent from environment variable or parameter
    const envTraceContent = process.env.OBSERVABILITY_TRACE_CONTENT;
    let traceContentValue;
    if (envTraceContent) {
        traceContentValue = envTraceContent.toLowerCase() === 'true' || envTraceContent === '1' || envTraceContent.toLowerCase() === 'yes';
    }
    else if (traceContent !== undefined) {
        traceContentValue = traceContent;
    }
    else {
        traceContentValue = constants_1.DEFAULTS.TRACE_CONTENT;
    }
    // Set TRACELOOP_TRACE_CONTENT for the underlying SDK only if false (default is true)
    if (!traceContentValue) {
        process.env.TRACELOOP_TRACE_CONTENT = 'false';
    }
    // Validate endpoint format if provided
    if (resolvedEndpoint && !isHttpEndpoint(resolvedEndpoint) && !resolvedEndpoint.includes(':')) {
        throw new Error(`Invalid endpoint format: ${resolvedEndpoint}`);
    }
    return {
        appName: resolvedAppName,
        endpoint: resolvedEndpoint,
        apiKey: resolvedApiKey,
        traceContent: traceContentValue,
    };
}
/**
 * Validate API key is provided via parameter or environment variable
 */
function validateApiKey(apiKey) {
    // Resolve API key from environment variable or parameter
    const resolvedApiKey = process.env.OBSERVABILITY_API_KEY || apiKey;
    if (!resolvedApiKey) {
        throw new Error('API key must be provided via parameter or OBSERVABILITY_API_KEY environment variable');
    }
    // Validate API key format
    if (typeof resolvedApiKey !== 'string' || !resolvedApiKey.trim()) {
        throw new Error('API key must be a non-empty string');
    }
    return resolvedApiKey;
}
/**
 * Setup API key validation and authentication headers
 */
function setupApiKeyHeaders(apiKey, endpoint, config = {}) {
    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        throw new Error('API key must be a non-empty string');
    }
    const headers = { ...config.headers };
    // Only add headers for HTTP endpoints
    if (isHttpEndpoint(endpoint)) {
        headers[constants_1.AUTH_HEADERS.AUTHORIZATION] = `Bearer ${apiKey}`;
        headers[constants_1.AUTH_HEADERS.API_KEY] = apiKey;
    }
    return headers;
}
/**
 * Validate configuration and apply defaults
 */
function validateAndNormalizeConfig(config) {
    const env = initEnvironment(config.appName, config.endpoint, config.apiKey, config.traceContent);
    const normalized = {
        // Environment variables take precedence, then user config, then defaults
        appName: env.appName,
        endpoint: env.endpoint || constants_1.DEFAULTS.ENDPOINT,
        apiKey: env.apiKey || '',
        instruments: config.instruments || new Set(),
        blockInstruments: config.blockInstruments || new Set(),
        disableBatch: config.disableBatch ?? constants_1.DEFAULTS.DISABLE_BATCH,
        traceContent: env.traceContent ?? config.traceContent ?? constants_1.DEFAULTS.TRACE_CONTENT,
        resourceAttributes: config.resourceAttributes || {},
        headers: config.headers || {},
        debug: config.debug ?? constants_1.DEFAULTS.DEBUG,
        additionalTags: config.additionalTags ?? [],
    };
    // Setup headers if API key is provided
    if (normalized.apiKey) {
        normalized.headers = setupApiKeyHeaders(normalized.apiKey, normalized.endpoint, config);
    }
    return normalized;
}
/**
 * Create a logger function that respects debug setting and global logging flag
 */
function createLogger(debug) {
    return {
        debug: (...args) => {
            if (_loggingEnabled && debug) {
                console.debug('[Observability]', ...args);
            }
        },
        info: (...args) => {
            if (_loggingEnabled) {
                console.info('[Observability]', ...args);
            }
        },
        warn: (...args) => {
            if (_loggingEnabled) {
                console.warn('[Observability]', ...args);
            }
        },
        error: (...args) => {
            if (_loggingEnabled) {
                console.error('[Observability]', ...args);
            }
        },
    };
}
/**
 * Check if a value is a promise-like object
 */
function isPromiseLike(value) {
    return typeof value?.then === 'function';
}
/**
 * Wrap a function to handle both sync and async execution
 */
function wrapFunction(_fn, _wrapper) {
    return (..._args) => Reflect.apply(_wrapper, null, [_fn, ..._args]);
}
//# sourceMappingURL=helpers.js.map