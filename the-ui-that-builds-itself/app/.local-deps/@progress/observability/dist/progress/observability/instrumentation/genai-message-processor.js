"use strict";
/**
 * GenAI Message Normalization Processor
 *
 * OpenTelemetry span processor that normalizes legacy flat gen_ai message attributes
 * to the new structured message format following the GenAI semantic conventions.
 *
 * General case:
 * - Old format: gen_ai.prompt.0.content, gen_ai.prompt.0.role, etc.
 * - New format: gen_ai.input.messages, gen_ai.output.messages
 *
 * Edge cases:
 * - Handles Google GenAI format where prompts and completions
 *   may have content that is either plain text or pre-structured JSON parts arrays.
 * - Handling of complex content types (tool calls, media, thoughts, etc.) is planned for
 *   future implementation following the Python implementation pattern.
 *
 * All prompts (including system role messages) become gen_ai.input.messages with structured parts array.
 * Completions become gen_ai.output.messages with the same structure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenAIMessageProcessor = void 0;
const crypto_1 = require("crypto");
/**
 * Processor that normalizes legacy gen_ai message attributes to structured format.
 */
class GenAIMessageProcessor {
    // Regex to match gen_ai.prompt.{index}.{field} or gen_ai.completion.{index}.{field}
    static LEGACY_ATTR_PATTERN = /^gen_ai\.(prompt|completion)\.(\d+)\.(.+)$/;
    // Regex to match nested tool_calls: gen_ai.prompt.{index}.tool_calls.{tool_index}.{field}
    static TOOL_CALLS_PATTERN = /^tool_calls\.(\d+)\.(.+)$/;
    static _debugEnabled = false;
    static _logger;
    constructor(debug = false) {
        GenAIMessageProcessor._debugEnabled = debug;
    }
    /**
     * Called when span starts - no action needed.
     */
    onStart() {
        // No action needed on start
    }
    /**
     * Transform legacy message attributes to new structured format.
     */
    onEnd(span) {
        const attributes = span.attributes || {};
        // Check if span has legacy message attributes and needs processing
        if (!this._shouldProcessSpan(attributes)) {
            return;
        }
        // Get writable attributes
        const writableAttrs = this._getWritableAttributes(span);
        if (!writableAttrs) {
            return;
        }
        if (GenAIMessageProcessor._debugEnabled) {
            GenAIMessageProcessor._logger?.debug(`[GenAIMessageProcessor] Processing span: ${span.name}`);
        }
        // Collect legacy attributes
        const { prompts, completions } = this._collectLegacyAttributes(writableAttrs);
        if (GenAIMessageProcessor._debugEnabled) {
            GenAIMessageProcessor._logger?.debug(`Collected ${Object.keys(prompts).length} prompts and ${Object.keys(completions).length} completions`);
        }
        // Create shared registry for tool call IDs across prompts and completions
        const toolCallRegistry = {};
        const hasPrompts = Object.keys(prompts).length > 0;
        const hasCompletions = Object.keys(completions).length > 0;
        // Transform and set new attributes
        if (hasPrompts) {
            this._transformPrompts(writableAttrs, prompts, toolCallRegistry);
        }
        if (hasCompletions) {
            this._transformCompletions(writableAttrs, completions, toolCallRegistry);
        }
        // Clean up legacy attributes only if all attempted transformations succeeded
        // This prevents data loss if one format fails to serialize
        const inputSucceeded = !hasPrompts || ('gen_ai.input.messages' in writableAttrs);
        const outputSucceeded = !hasCompletions || ('gen_ai.output.messages' in writableAttrs);
        const allTransformationsSucceeded = inputSucceeded && outputSucceeded;
        if (allTransformationsSucceeded) {
            this._removeLegacyAttributes(writableAttrs);
        }
        else if (GenAIMessageProcessor._debugEnabled) {
            GenAIMessageProcessor._logger?.debug('Skipping legacy attribute removal: not all transformations succeeded');
        }
        if (GenAIMessageProcessor._debugEnabled) {
            GenAIMessageProcessor._logger?.debug('[GenAIMessageProcessor] Transformation complete');
        }
    }
    /**
     * Gracefully shutdown the processor.
     */
    async shutdown() {
        // No cleanup needed
    }
    /**
     * Force flush - no buffering in this processor.
     */
    async forceFlush() {
        // No buffering to flush
    }
    /**
     * Check if span needs message normalization.
     */
    _shouldProcessSpan(attributes) {
        // Check if new format already exists - skip if it does
        const hasNewFormat = 'gen_ai.input.messages' in attributes ||
            'gen_ai.output.messages' in attributes;
        if (hasNewFormat) {
            if (GenAIMessageProcessor._debugEnabled) {
                GenAIMessageProcessor._logger?.debug('New format already exists, skipping');
            }
            return false;
        }
        // Check if old format exists
        const hasOldFormat = Object.keys(attributes).some(key => GenAIMessageProcessor.LEGACY_ATTR_PATTERN.test(key));
        if (!hasOldFormat) {
            if (GenAIMessageProcessor._debugEnabled) {
                GenAIMessageProcessor._logger?.debug('No legacy format found, skipping');
            }
            return false;
        }
        return true;
    }
    /**
     * Get writable attributes from span.
     */
    _getWritableAttributes(span) {
        // Try to access internal _attributes property for writability
        const spanWithInternal = span;
        if (spanWithInternal._attributes) {
            spanWithInternal._attributes = spanWithInternal._attributes || {};
            if (GenAIMessageProcessor._debugEnabled) {
                GenAIMessageProcessor._logger?.debug(`Got writable attributes via _attributes, type=${typeof spanWithInternal._attributes}`);
            }
            return spanWithInternal._attributes;
        }
        else if (span.attributes && typeof span.attributes === 'object') {
            GenAIMessageProcessor._logger?.warn('Using attributes property directly (may not persist changes)');
            return span.attributes;
        }
        GenAIMessageProcessor._logger?.error(`Could not find writable attributes on span '${span.name}'!`);
        return null;
    }
    /**
     * Collect and group legacy prompt and completion attributes by index.
     */
    _collectLegacyAttributes(attributes) {
        const prompts = {};
        const completions = {};
        for (const [key, value] of Object.entries(attributes)) {
            const match = GenAIMessageProcessor.LEGACY_ATTR_PATTERN.exec(key);
            if (!match) {
                continue;
            }
            const [, messageType, indexStr, fieldName] = match;
            const index = parseInt(indexStr, 10);
            // Check if this is a nested tool_calls field
            const toolCallsMatch = GenAIMessageProcessor.TOOL_CALLS_PATTERN.exec(fieldName);
            if (toolCallsMatch) {
                const [, toolIndexStr, toolField] = toolCallsMatch;
                const toolIndex = parseInt(toolIndexStr, 10);
                // Group by message type and index
                const target = messageType === 'prompt' ? prompts : completions;
                if (!target[index]) {
                    target[index] = {};
                }
                const entry = target[index];
                if (!entry.tool_calls) {
                    entry.tool_calls = {};
                }
                if (!entry.tool_calls[toolIndex]) {
                    entry.tool_calls[toolIndex] = {};
                }
                entry.tool_calls[toolIndex][toolField] = value;
            }
            else {
                // Regular field (not nested tool_calls)
                if (messageType === 'prompt') {
                    if (!prompts[index]) {
                        prompts[index] = {};
                    }
                    prompts[index][fieldName] = value;
                }
                else if (messageType === 'completion') {
                    if (!completions[index]) {
                        completions[index] = {};
                    }
                    completions[index][fieldName] = value;
                }
            }
        }
        return { prompts, completions };
    }
    /**
     * Map role to canonical form based on content and original role.
     *
     * @param role - Original role from attributes
     * @param hasToolCall - Whether content contains a tool call
     * @param hasToolResponse - Whether content contains a tool response
     * @returns Canonicalized role string
     */
    _mapRole(role, hasToolCall, hasToolResponse) {
        // Tool calls come from assistant
        if (hasToolCall) {
            return 'assistant';
        }
        // Tool responses have role 'tool'
        if (hasToolResponse) {
            return 'tool';
        }
        // Map 'model' to 'assistant' (Google convention)
        if (role === 'model') {
            return 'assistant';
        }
        // Default 'unknown' to 'user'
        if (role === 'unknown') {
            return 'user';
        }
        return role;
    }
    /**
     * Transform prompts into input.messages.
     *
     * @param attributes - Span attributes to modify
     * @param prompts - Dictionary mapping index to prompt fields
     *
     * Note: Special handling for tool-related fields:
     * - tool_call_id: Should be mapped to 'id' property in tool_call_response parts
     * - tool_calls array: Nested tool call structures need to be parsed and normalized
     * - Property normalization may be needed (e.g., 'result' -> 'response' per OpenTelemetry spec)
     */
    _transformPrompts(attributes, prompts, toolCallRegistry) {
        const inputMessages = [];
        // Sort by index to maintain order
        const sortedIndices = Object.keys(prompts).map(Number).sort((a, b) => a - b);
        for (const index of sortedIndices) {
            const promptData = prompts[index];
            // Get original role
            let role = promptData.role || 'user';
            const content = promptData.content || '';
            // Extract tool_call_id if present (for tool role messages)
            const toolCallId = typeof promptData.tool_call_id === 'string' ? promptData.tool_call_id : undefined;
            // Check if there's a tool_calls array in legacy format
            const toolCallsDict = promptData.tool_calls;
            // Parse content - could be pre-structured or plain text
            const parsed = this._parseContentAsParts(content, 'text', toolCallRegistry, toolCallId);
            let { parts, hasToolCall } = parsed;
            const { hasToolResponse } = parsed;
            // If there's a tool_calls array, convert it to parts and prepend
            if (toolCallsDict) {
                const toolCallParts = this._convertToolCallsArrayToParts(toolCallsDict, toolCallRegistry);
                if (toolCallParts.length > 0) {
                    parts = [...toolCallParts, ...parts];
                    hasToolCall = true;
                }
            }
            // Apply smart role mapping based on content and original role
            role = this._mapRole(role, hasToolCall, hasToolResponse);
            // Only add message if it has parts
            if (parts.length > 0) {
                inputMessages.push({
                    role,
                    parts,
                });
            }
        }
        // Set new attribute
        if (inputMessages.length > 0) {
            try {
                attributes['gen_ai.input.messages'] = JSON.stringify(inputMessages);
                if (GenAIMessageProcessor._debugEnabled) {
                    GenAIMessageProcessor._logger?.debug(`Set gen_ai.input.messages with ${inputMessages.length} message(s)`);
                }
            }
            catch (e) {
                GenAIMessageProcessor._logger?.error(`Failed to serialize input messages to JSON: ${e}`);
            }
        }
    }
    /**
     * Transform completions into output.messages.
     *
     * @param attributes - Span attributes to modify
     * @param completions - Dictionary mapping index to completion fields
     */
    _transformCompletions(attributes, completions, toolCallRegistry) {
        const outputMessages = [];
        // Sort by index to maintain order
        const sortedIndices = Object.keys(completions).map(Number).sort((a, b) => a - b);
        for (const index of sortedIndices) {
            const completionData = completions[index];
            // Get original role
            let role = completionData.role || 'assistant';
            const content = completionData.content || '';
            // Extract tool_call_id if present (for tool role messages)
            const toolCallId = typeof completionData.tool_call_id === 'string' ? completionData.tool_call_id : undefined;
            // Check if there's a tool_calls array in legacy format
            const toolCallsDict = completionData.tool_calls;
            // Parse content - could be pre-structured or plain text
            const parsed = this._parseContentAsParts(content, 'text', toolCallRegistry, toolCallId);
            let { parts, hasToolCall } = parsed;
            const { hasToolResponse } = parsed;
            // If there's a tool_calls array, convert it to parts and prepend
            if (toolCallsDict) {
                const toolCallParts = this._convertToolCallsArrayToParts(toolCallsDict, toolCallRegistry);
                if (toolCallParts.length > 0) {
                    parts = [...toolCallParts, ...parts];
                    hasToolCall = true;
                }
            }
            // Apply smart role mapping based on content and original role
            role = this._mapRole(role, hasToolCall, hasToolResponse);
            // Only add message if it has parts
            if (parts.length > 0) {
                // Build message
                const message = {
                    role,
                    parts,
                    finish_reason: '',
                };
                // finish_reason is required in the output message schema
                let finishReason = typeof completionData.finish_reason === 'string' ? completionData.finish_reason : undefined;
                if (!finishReason) {
                    finishReason = 'stop';
                    if (GenAIMessageProcessor._debugEnabled) {
                        GenAIMessageProcessor._logger?.debug(`finish_reason not present in completion data at index ${index}, defaulting to 'stop'`);
                    }
                }
                message.finish_reason = finishReason;
                outputMessages.push(message);
            }
        }
        // Set new attribute
        if (outputMessages.length > 0) {
            try {
                attributes['gen_ai.output.messages'] = JSON.stringify(outputMessages);
                if (GenAIMessageProcessor._debugEnabled) {
                    GenAIMessageProcessor._logger?.debug(`Set gen_ai.output.messages with ${outputMessages.length} message(s)`);
                }
            }
            catch (e) {
                GenAIMessageProcessor._logger?.error(`Failed to serialize output messages to JSON: ${e}`);
            }
        }
    }
    /**
     * Remove legacy gen_ai.prompt.* and gen_ai.completion.* attributes.
     */
    _removeLegacyAttributes(attributes) {
        // Build list of keys to remove by scanning all matching legacy attributes.
        // This catches nested tool_calls.* fields that may not be in the collected data.
        const keysToRemove = [];
        for (const key of Object.keys(attributes)) {
            if (GenAIMessageProcessor.LEGACY_ATTR_PATTERN.test(key)) {
                keysToRemove.push(key);
            }
        }
        // Remove the keys
        for (const key of keysToRemove) {
            delete attributes[key];
        }
        if (GenAIMessageProcessor._debugEnabled && keysToRemove.length > 0) {
            GenAIMessageProcessor._logger?.debug(`Removed ${keysToRemove.length} legacy attributes`);
        }
    }
    /**
     * Parse content field - either use pre-structured JSON or wrap as single part.
     *
     * @param content - Content string to parse
     * @param defaultType - Default part type if creating a simple wrapper
     * @param toolCallRegistry - Registry mapping tool call names to IDs for cross-message correlation
     * @param toolCallId - Optional tool_call_id from legacy attributes to set as id for tool_call_response parts
     * @returns Object with parts array, hasToolCall flag, and hasToolResponse flag
     */
    _parseContentAsParts(content, defaultType = 'text', toolCallRegistry = {}, toolCallId) {
        // Try to parse as JSON array
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                // It's a parts array - validate and return
                const validParts = [];
                let hasToolCall = false;
                let hasToolResponse = false;
                let hasInvalidParts = false;
                for (const part of parsed) {
                    if (typeof part === 'object' && part !== null && 'type' in part) {
                        const partType = part.type;
                        const normalizedPart = { type: partType };
                        // Track tool call types and preserve specific properties
                        if (partType === 'tool_call') {
                            hasToolCall = true;
                            // Preserve tool call specific properties
                            if ('id' in part) {
                                normalizedPart.id = part.id;
                            }
                            else if ('tool_call_id' in part) {
                                normalizedPart.id = part.tool_call_id;
                            }
                            else if (toolCallId) {
                                normalizedPart.id = toolCallId;
                            }
                            else {
                                // Generate a unique ID if none found
                                normalizedPart.id = `call_${(0, crypto_1.randomBytes)(8).toString('hex')}`;
                            }
                            if ('name' in part) {
                                normalizedPart.name = part.name;
                                // Store in registry for matching with responses
                                if (normalizedPart.id) {
                                    toolCallRegistry[part.name] = normalizedPart.id;
                                }
                            }
                            if ('arguments' in part) {
                                // Parse arguments if they are a JSON string
                                if (typeof part.arguments === 'string') {
                                    try {
                                        normalizedPart.arguments = JSON.parse(part.arguments);
                                    }
                                    catch {
                                        normalizedPart.arguments = part.arguments;
                                    }
                                }
                                else {
                                    normalizedPart.arguments = part.arguments;
                                }
                            }
                        }
                        else if (partType === 'tool_call_response') {
                            hasToolResponse = true;
                            // Preserve tool response specific properties
                            // Use id from part, fallback to tool_call_id, then legacy attributes, then registry, then generate
                            if ('id' in part) {
                                normalizedPart.id = part.id;
                            }
                            else if ('tool_call_id' in part) {
                                normalizedPart.id = part.tool_call_id;
                            }
                            else if (toolCallId) {
                                normalizedPart.id = toolCallId;
                            }
                            else if ('name' in part && toolCallRegistry[part.name]) {
                                // Try to match with a previous tool call by function name
                                normalizedPart.id = toolCallRegistry[part.name];
                            }
                            else {
                                // Generate a unique ID if no match found
                                normalizedPart.id = `call_${(0, crypto_1.randomBytes)(8).toString('hex')}`;
                            }
                            if ('response' in part) {
                                normalizedPart.response = part.response;
                            }
                            else if ('result' in part) {
                                // Handle legacy 'result' field name for backward compatibility
                                normalizedPart.response = part.result;
                            }
                        }
                        else {
                            // For other types, preserve content or text fields
                            if ('content' in part) {
                                normalizedPart.content = part.content;
                            }
                            else if ('text' in part) {
                                normalizedPart.content = part.text;
                            }
                            else {
                                // Preserve all other properties
                                Object.assign(normalizedPart, part);
                            }
                        }
                        validParts.push(normalizedPart);
                    }
                    else {
                        // Invalid part structure - skip this part
                        hasInvalidParts = true;
                        if (GenAIMessageProcessor._debugEnabled) {
                            GenAIMessageProcessor._logger?.debug('Invalid part structure in JSON array element, skipping part');
                        }
                    }
                }
                if (validParts.length === 0) {
                    // All parts were invalid - fallback to wrapping entire content
                    if (GenAIMessageProcessor._debugEnabled) {
                        GenAIMessageProcessor._logger?.debug('No valid parts found in JSON array, falling back to text wrapper');
                    }
                    return { parts: [{ type: defaultType, content: content }], hasToolCall: false, hasToolResponse: false };
                }
                if (hasInvalidParts && GenAIMessageProcessor._debugEnabled) {
                    GenAIMessageProcessor._logger?.debug('One or more invalid parts were skipped in JSON array');
                }
                return { parts: validParts, hasToolCall, hasToolResponse };
            }
            else if (typeof parsed === 'object' && parsed !== null) {
                // Single object that might be a complex content structure
                // NOTE: Complex content parsing (function_call, function_response, etc.) 
                // is not yet implemented in the JS SDK. This would be added in the future
                // following the Python implementation pattern.
                // 
                // Future enhancement: Parse complex content types like:
                // - function_call: Tool/function calls from the model
                // - function_response: Responses from tool/function execution  
                // - media_resolution: Media/image resolution information
                // - code_execution_result: Results from code execution
                // - executable_code: Code that can be executed
                // - file_data: File attachments or data
                // - inline_data: Inline binary/data content
                // - video_metadata: Video file metadata
                // - thought: Model reasoning/thinking content
                // - thought_signature: Signature/validation of thought process
                // For now, treat as text
                if (GenAIMessageProcessor._debugEnabled) {
                    GenAIMessageProcessor._logger?.debug('Complex content object detected but not yet parsed, wrapping as text');
                }
                return { parts: [{ type: defaultType, content: content }], hasToolCall: false, hasToolResponse: false };
            }
            // Parsed but not an array or object - fallback to text
            return { parts: [{ type: defaultType, content: content }], hasToolCall: false, hasToolResponse: false };
        }
        catch {
            // Not valid JSON - treat as plain text
            if (GenAIMessageProcessor._debugEnabled) {
                GenAIMessageProcessor._logger?.debug('Content is not valid JSON, wrapping as text part');
            }
            return { parts: [{ type: defaultType, content: content }], hasToolCall: false, hasToolResponse: false };
        }
    }
    /**
     * Convert legacy tool_calls array structure to normalized parts.
     *
     * Handles flat attributes like gen_ai.prompt.0.tool_calls.0.name that were
     * collected into a nested dictionary structure by _collectLegacyAttributes.
     *
     * @param toolCallsDict - Dictionary mapping tool call index to tool call fields
     * @param toolCallRegistry - Registry to track tool call IDs for matching with responses
     * @returns Array of tool_call MessagePart objects
     */
    _convertToolCallsArrayToParts(toolCallsDict, toolCallRegistry) {
        const parts = [];
        // Sort by tool call index to maintain order
        const sortedToolIndices = Object.keys(toolCallsDict).map(Number).sort((a, b) => a - b);
        for (const toolIdx of sortedToolIndices) {
            const toolCallData = toolCallsDict[toolIdx];
            // Extract tool call fields
            const callId = typeof toolCallData.id === 'string' ? toolCallData.id : undefined;
            const name = typeof toolCallData.name === 'string' ? toolCallData.name : undefined;
            const args = toolCallData.arguments;
            if (name) { // name is required for tool_call
                // Store in registry for matching with responses
                if (callId) {
                    toolCallRegistry[name] = callId;
                }
                const part = {
                    type: 'tool_call',
                    name,
                };
                if (callId) {
                    part.id = callId;
                }
                if (args !== undefined) {
                    // Try to parse as JSON if it's a string
                    if (typeof args === 'string') {
                        try {
                            part.arguments = JSON.parse(args);
                        }
                        catch {
                            part.arguments = args;
                        }
                    }
                    else {
                        part.arguments = args;
                    }
                }
                parts.push(part);
                if (GenAIMessageProcessor._debugEnabled) {
                    GenAIMessageProcessor._logger?.debug(`Converted tool_calls array entry to tool_call part: ${name}`);
                }
            }
        }
        return parts;
    }
}
exports.GenAIMessageProcessor = GenAIMessageProcessor;
//# sourceMappingURL=genai-message-processor.js.map