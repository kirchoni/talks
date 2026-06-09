"use strict";
// Progress Observability Instrumentation constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_MAX_LENGTH = exports.TAGS_ATTRIBUTE_KEY = exports.AUTH_HEADERS = exports.DEFAULTS = exports.OBSERVABILITY_ENV_VARS = exports.SDK_ENV_VARS = void 0;
// OpenTelemetry SDK environment variables to clear
exports.SDK_ENV_VARS = [
    'OTEL_TRACES_EXPORTER',
    // 'OTEL_METRICS_EXPORTER', // metrics/logs not implemented
    // 'OTEL_LOGS_EXPORTER',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'OTEL_EXPORTER_OTLP_HEADERS',
    'OTEL_EXPORTER_OTLP_TIMEOUT',
    'OTEL_RESOURCE_ATTRIBUTES',
    'OTEL_SERVICE_NAME',
    'OTEL_SERVICE_VERSION',
];
// Observability environment variables
exports.OBSERVABILITY_ENV_VARS = [
    'OBSERVABILITY_API_KEY',
    'OBSERVABILITY_ENDPOINT',
    'OBSERVABILITY_APP_NAME',
    'OBSERVABILITY_TRACE_CONTENT',
];
// Default config values
exports.DEFAULTS = {
    APP_NAME: process.argv[1] || 'app name',
    ENDPOINT: 'https://collector.observability.progress.com:443',
    DISABLE_BATCH: true,
    TRACE_CONTENT: true,
    DEBUG: false,
    TIMEOUT_MS: 30000,
};
// HTTP header names for API authentication
exports.AUTH_HEADERS = {
    AUTHORIZATION: 'Authorization',
    API_KEY: 'X-Api-Key',
};
// Tag constants
exports.TAGS_ATTRIBUTE_KEY = 'observability.tags';
exports.TAG_MAX_LENGTH = 200;
//# sourceMappingURL=constants.js.map