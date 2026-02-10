# Module 5: AI Agent Monitoring (Auto-Instrumented)

## The Problem

The AI chat has no observability. When the AI agent fails, gives bad responses, or is slow, you can't see what happened — no LLM call spans, no tool execution spans, no token usage.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Log in and go to AI Builder
3. Ask: "What AI talks are available?"
4. Check Sentry — no AI-related spans or insights

## Files to Modify

- `sentry.server.config.ts` — add `vercelAIIntegration()`
- `lib/ai/agents.ts` — ensure `experimental_telemetry: { isEnabled: true }` on all AI SDK calls

## The Fix

**1. `sentry.server.config.ts`** — import and add `vercelAIIntegration()`:

```typescript
import { vercelAIIntegration } from "@sentry/nextjs";

Sentry.init({
  // ... existing config
  integrations: [
    libsqlIntegration(getClient()),
    vercelAIIntegration(),  // Add this
  ],
});
```

**2. `lib/ai/agents.ts`** — add `experimental_telemetry` to every AI SDK call:

```typescript
// In routeRequest():
const { text } = await generateText({
  model: AGENTS.router.model,
  system: routerSystemPrompt,
  prompt: userMessage,
  experimental_telemetry: { isEnabled: true },
});

// In executeSearchAgent():
const result = streamText({
  model: AGENTS.search.model,
  system: searchAgentSystemPrompt,
  messages,
  tools: getSearchTools(userId),
  experimental_telemetry: { isEnabled: true },
});

// In executeInfoAgent():
const result = streamText({
  model: AGENTS.info.model,
  system: infoAgentSystemPrompt,
  messages,
  tools: getInfoTools(userId),
  experimental_telemetry: { isEnabled: true },
});
```

When both `vercelAIIntegration()` and `experimental_telemetry` are enabled, Sentry automatically captures:
- LLM call spans (model, tokens, duration)
- Tool execution spans (tool name, inputs, outputs)
- Streaming metrics

No manual `Sentry.startSpan` wrappers needed in tool definitions.

## Verify

1. Ask the AI another question
2. Check Sentry Performance → open the trace
3. You should see LLM call spans with model and token details
4. Tool executions appear as child spans automatically
5. Check AI Insights view for aggregate metrics
