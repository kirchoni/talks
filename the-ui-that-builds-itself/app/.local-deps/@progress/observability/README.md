# Progress Observability Instrumentation for TypeScript/JavaScript

AI agent telemetry for TypeScript/JavaScript applications.

## Installation

```bash
npm install @progress/observability
```

## Usage

### ESM / TypeScript with `"type": "module"`

#### Option 1: Bootstrap File

For modern ES modules, create a bootstrap file that initializes Observability **before** your app loads:

**Create `bootstrap.ts` in your project root:**

```typescript
// bootstrap.ts — ESM instrumentation bootstrap for @progress/observability
// Registers ESM loader hooks and initializes the SDK before your app runs

import '@progress/observability/register/hooks';
import dotenv from 'dotenv';
dotenv.config();

import { Observability } from '@progress/observability';

await Observability.instrument({
  appName: 'my-ai-agent',
  apiKey: process.env.OBSERVABILITY_API_KEY,
  // endpoint: 'https://collector.observability.progress.com:443', 
  // Optional: defaults to Progress collector
  //other options
  });

// Load your main app after instrumentation is ready
await import('./src/app.ts');
```

**Run with:**
```bash
tsx bootstrap.ts
```

#### Option 2: No Bootstrap File

If you prefer not to create a separate bootstrap file, initialize Observability with dynamic imports at the top of your main entry point.

**In your `src/app.ts` or main entry point:**

```typescript
import '@progress/observability/register/hooks';
const { Observability } = await import('@progress/observability');
import dotenv from 'dotenv';
dotenv.config();


await Observability.instrument({
  appName: 'my-ai-agent',
  apiKey: process.env.OBSERVABILITY_API_KEY,
  // endpoint: process.env.OBSERVABILITY_ENDPOINT,
  // other options
});

// Your application code here - all dependencies are automatically instrumented
```
NOTE: Use dynamic imports for **Langchain** after calling Observability.instrument(). Example:

```typescript
const AzureChatOpenAI = (await import('@langchain/openai')).AzureChatOpenAI;
``` 

**Run with:**
```bash
tsx src/app.ts
```

### CommonJS / Synchronous JavaScript

For traditional CommonJS or if you need synchronous initialization:

```typescript
import { Observability } from '@progress/observability';
import dotenv from 'dotenv';
dotenv.config();


Observability.instrument({
  appName: 'my-ai-agent',
  apiKey: process.env.OBSERVABILITY_API_KEY,
  endpoint: process.env.OBSERVABILITY_ENDPOINT,
  debug: true,
});

// Your application code here - all dependencies are automatically instrumented
```

## Build from Source

```bash
# Install dependencies
npm install

# Build the project
npm run build

```

## Configuration

Common options (for `Observability.instrument`):

- `appName` - Application name for telemetry
- `endpoint` - OpenTelemetry collector endpoint
- `apiKey` - Authentication key
- `debug` - Enable debug logging
- `instruments` / `blockInstruments` - Control what gets traced
- `traceContent` - when set to `false` will stop sending LLM prompt/responses as part of the telemetry data
- `additionalTags` - custom tags(see below)

Environment overrides (optional):

- `OBSERVABILITY_APP_NAME` sets the application name (e.g. "my-ai-agent")
- `OBSERVABILITY_ENDPOINT` sets a custom endpoint for collecting data (e.g. `https://collector.observability.progress.com:443`)
- `OBSERVABILITY_API_KEY` sets the authentication key to use when sending data
- `OBSERVABILITY_TRACE_CONTENT` when set to `false` will stop sending LLM prompt/responses as part of the telemetry data

## Custom Tags

Tags are user-defined strings (max 200 characters each) attached to observations for filtering and grouping.

**Global tags** — applied to every span:

```typescript
Observability.instrument({
  appName: 'my-ai-agent',
  apiKey: process.env.OBSERVABILITY_API_KEY,
  additionalTags: ['production', 'release:2.4.1'],
});
```

**Scoped tags** — applied to spans within a specific callback via `propagateAttributes`:

```typescript
import { propagateAttributes } from '@progress/observability';

propagateAttributes(['tenant:acme', 'experiment-v2'], () => {
  // All spans created here inherit these tags
  myAgentFunction();
});
```

Nesting is supported — tags accumulate from outer to inner scopes.

**Decorator tags** — applied to a single decorated function:

```typescript
import { task } from '@progress/observability';

@task({ tags: ['cohort-a'] })
async function myTask() {
  ...
}
```

## Using Older Versions of LangChain (like 0.3.x)

With older versions of LangChain, spans may be flat without a natural hierarchy tree. In these cases, use the `wrapFunctionWithSpan` decorator for better span visibility and structure.

**Example: Simple agent with OpenAI and tool calling**

```typescript
import '@progress/observability/register/hooks';
import { Observability, ObservabilitySpanKind, wrapFunctionWithSpan } from '@progress/observability';
import dotenv from 'dotenv';
dotenv.config();


await Observability.instrument({
    appName: 'my-service',
    apiKey: process.env.OBSERVABILITY_API_KEY,

});

import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import { DynamicTool } from '@langchain/core/tools';


// Create the weather tool
const getWeatherTool = new DynamicTool({
    name: "GetWeather",
    description: "Get the current weather for a given city. Input should be a city name.",
    func: async (cityName: string) => {
        return `The weather in ${cityName} is sunny with a temperature of 22 degrees celsius at the moment.`;
    },
});

async function runSimpleAgent(llm: ChatOpenAI): Promise<void> {
    const tools = [getWeatherTool];
    const llmWithTools = llm.bindTools(tools);

    const question: string = "What is the weather in Paris right now?";
    const messages: BaseMessage[] = [
        new SystemMessage("You are a helpful AI assistant. Provide clear, accurate, and concise answers to user questions."),
        new HumanMessage(question),
    ];

    try {
        console.log(`Q: ${question}`);

        let response = await llmWithTools.invoke(messages);
        messages.push(response);

        // Agentic tool-calling loop
        while (response.tool_calls && response.tool_calls.length > 0) {
            for (const toolCall of response.tool_calls) {
                const matchedTool = tools.find(t => t.name === toolCall.name);
                if (!matchedTool) {
                    throw new Error(`Unknown tool: ${toolCall.name}`);
                }
                const result = await matchedTool.invoke(toolCall.args);
                messages.push(new ToolMessage({
                    tool_call_id: toolCall.id!,
                    content: typeof result === 'string' ? result : JSON.stringify(result),
                }));
            }
            response = await llmWithTools.invoke(messages);
            messages.push(response);
        }

        console.log(`A: ${response.content}`);
    } catch (error) {
        console.error('Error calling OpenAI:', error instanceof Error ? error.message : String(error));
    }
}

// Main execution
async function main(): Promise<void> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const llm = new ChatOpenAI({
        apiKey: openaiApiKey,
        model,
    });

    // Wrap the agent function for tracing
    const tracedRunSimpleAgent = wrapFunctionWithSpan(runSimpleAgent, "SimpleAgent", { spanKind: ObservabilitySpanKind.AGENT });
    await tracedRunSimpleAgent(llm);
}

main().catch((err) => {
    console.error('Agent failed:', err);
    process.exit(1);
});
```

The `wrapFunctionWithSpan` decorator creates an explicit span around your agent function, providing clear trace boundaries even when LangChain doesn't generate rich internal span hierarchies.

## Shutdown

```typescript
await Observability.shutdown();
```

## Troubleshooting

### Spans not sending with OpenAI and LangChain

If you have both `openai` and `langchain` installed, but are only using OpenAI and you notice that spans are not being sent, a possible fix is to explicitly specify the instruments during initialization:

```typescript
await Observability.instrument({
    appName: "my-service",
    apiKey: observabilityStagingApikey,
    
    instruments: new Set([ObservabilityInstruments.OPENAI]),
});
```

Ensure you import `ObservabilityInstruments` from `@progress/observability`.

This is sometimes necessary because the presence of both packages can affect auto-detection. Specifying the instrument set ensures OpenAI spans are properly captured.
