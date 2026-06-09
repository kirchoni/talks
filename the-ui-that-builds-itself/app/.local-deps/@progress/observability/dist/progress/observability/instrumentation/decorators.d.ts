/**
 * Observability Decorators - telemetry decorators for AI agents
 *
 * Provides decorators for instrumenting agent functions, workflows,
 * tasks, and tools with Observability telemetry.
 */
import { DecoratorOptions } from './types';
/**
 * Decorator for instrumenting task functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class MyAgent {
 *   @task()
 *   async processData() { }
 *
 *   @task({ name: "custom_task", version: 1 })
 *   syncTask() { }
 * }
 * ```
 */
export declare const task: (options?: DecoratorOptions) => (__target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for instrumenting workflow functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class MyAgent {
 *   @workflow()
 *   async executeWorkflow() { }
 *
 *   @workflow({ name: "data_processing", version: 2 })
 *   processData() { }
 * }
 * ```
 */
export declare const workflow: (options?: DecoratorOptions) => (__target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for instrumenting agent functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class ChatAgent {
 *   @agent()
 *   async chat(message: string) { }
 *
 *   @agent({ name: "chat_agent", version: 1 })
 *   processMessage() { }
 * }
 * ```
 */
export declare const agent: (options?: DecoratorOptions) => (__target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Decorator for instrumenting tool functions with Observability telemetry.
 *
 * @example
 * ```typescript
 * class SearchTool {
 *   @tool()
 *   async search(query: string) { }
 *
 *   @tool({ name: "web_search", version: 1 })
 *   webSearch() { }
 * }
 * ```
 */
export declare const tool: (options?: DecoratorOptions) => (__target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Function wrapper utility for manual span creation around functions
 *
 * @param fn - Function to wrap
 * @param spanName - Name for the span
 * @param options - Additional options
 * @returns Wrapped function
 *
 * @example
 * ```typescript
 * const instrumentedFunction = wrapFunctionWithSpan(
 *   myFunction,
 *   'my-operation',
 *   { spanKind: ObservabilitySpanKind.TOOL }
 * );
 * ```
 */
export declare function wrapFunctionWithSpan(fn: Function, spanName: string, options?: Omit<DecoratorOptions, 'name'>): Function;
//# sourceMappingURL=decorators.d.ts.map