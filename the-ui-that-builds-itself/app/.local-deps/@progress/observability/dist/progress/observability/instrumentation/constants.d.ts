export declare const SDK_ENV_VARS: readonly ["OTEL_TRACES_EXPORTER", "OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_HEADERS", "OTEL_EXPORTER_OTLP_TIMEOUT", "OTEL_RESOURCE_ATTRIBUTES", "OTEL_SERVICE_NAME", "OTEL_SERVICE_VERSION"];
export declare const OBSERVABILITY_ENV_VARS: readonly ["OBSERVABILITY_API_KEY", "OBSERVABILITY_ENDPOINT", "OBSERVABILITY_APP_NAME", "OBSERVABILITY_TRACE_CONTENT"];
export declare const DEFAULTS: {
    readonly APP_NAME: string;
    readonly ENDPOINT: "https://collector.observability.progress.com:443";
    readonly DISABLE_BATCH: true;
    readonly TRACE_CONTENT: true;
    readonly DEBUG: false;
    readonly TIMEOUT_MS: 30000;
};
export declare const AUTH_HEADERS: {
    readonly AUTHORIZATION: "Authorization";
    readonly API_KEY: "X-Api-Key";
};
export declare const TAGS_ATTRIBUTE_KEY = "observability.tags";
export declare const TAG_MAX_LENGTH = 200;
//# sourceMappingURL=constants.d.ts.map