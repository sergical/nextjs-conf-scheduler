# Debugging Next.js Workshop

A progressive workshop for debugging Next.js with Sentry. The SDK is already configured — each module teaches one Sentry capability by adding it back to a branch where it's been removed.

## Prerequisites

- Node.js 18+
- pnpm
- A Sentry account (free tier works)
- Basic familiarity with Next.js

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd nextjs-conf-scheduler

# Install dependencies
pnpm install

# Set up the database
pnpm db:init    # Creates Turso DB, writes credentials to .env.local
pnpm db:push    # Applies schema
pnpm db:seed    # Seeds conference data

# Start dev server
pnpm dev
```

## Sentry Setup Walkthrough

Sentry is already configured in this app. Before diving into the modules, take a look at what's in place:

- **`next.config.ts`** — `withSentryConfig()` wraps the Next.js config, enabling source map uploads and a tunnel route (`/monitoring`) that bypasses ad-blockers
- **`instrumentation.ts`** — Next.js instrumentation hook that loads `sentry.server.config.ts` (Node) or `sentry.edge.config.ts` (Edge) at startup, plus `onRequestError` for automatic server error capture
- **`sentry.server.config.ts`** — `Sentry.init()` with DSN, 100% trace sampling, structured logs, and integrations for database and AI tracing

This was set up with the Sentry wizard (`npx @sentry/wizard@latest -i nextjs`), which scaffolds all the config files automatically. The `main` branch has the fully wired-up version — each module branch strips out one capability so you can learn it hands-on.

## Workshop Structure

Each module has a starting branch (`module-X-start`) that's missing one Sentry feature. Your job is to add it.

```
Module 1: Error Capture     → "Something's wrong, what is it?"
Module 2: Tracing           → "Where did the request go?"
Module 3: Logs & Metrics    → "What happened during the request?"
Module 4: Database Tracing  → "Why is this slow?"
Module 5: AI Monitoring     → "What did the AI do?"
```

---

## Module 1: Error Capture (Hydration Errors)

**Branch:** `git checkout module-1-start`

### Learning Objectives
- Understand how Sentry automatically captures React errors
- Identify and fix hydration errors using Sentry's error details

### The Bug

The theme switcher is broken. When you toggle between light/dark mode, you'll see a hydration error. The current implementation reads `localStorage` during server-side rendering, causing a mismatch.

### Steps

1. Start the dev server: `pnpm dev`
2. Open the app and click the theme toggle
3. Open Sentry and find the hydration error
4. Look at the error details - what's causing the mismatch?

### Your Task

Fix the theme provider to handle SSR correctly.

**Hint:** The `next-themes` library handles this properly. Look at:
- `components/theme-provider.tsx`
- `app/layout.tsx`

### The Fix

```tsx
// components/theme-provider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

```tsx
// app/layout.tsx - wrap children with ThemeProvider
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### Success Criteria
- No hydration errors in Sentry
- Theme toggle works without page refresh

---

## Module 2: Tracing Server Actions

**Branch:** `git checkout module-2-start`

### Learning Objectives
- Use `Sentry.withServerActionInstrumentation()` for named spans
- Pass `headers` for distributed tracing
- Find action traces in Sentry's Performance tab

### The Bug

Server actions appear as anonymous operations with no timing or context. When you add a talk to your schedule, you can't see what's happening in Sentry.

### Steps

1. Sign up for an account and log in
2. Add a talk to your schedule
3. Check Sentry Performance - do you see the action?

### Your Task

Wrap server actions with `withServerActionInstrumentation` to give them names and enable distributed tracing.

**Files to modify:**
- `lib/actions/auth.ts`
- `lib/actions/schedule.ts`

### The Fix

```typescript
// lib/actions/schedule.ts
"use server";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

export async function addToSchedule(talkId: string) {
  return Sentry.withServerActionInstrumentation(
    "schedule.addToSchedule",
    { headers: await headers() },
    async () => {
      // existing logic here
    }
  );
}
```

### Success Criteria
- Server actions appear with names in Sentry Performance
- Traces show the full path: browser → server action → database

---

## Module 3: Structured Logs and Metrics

**Branch:** `git checkout module-3-start`

### Learning Objectives
- Enable `enableLogs: true` in Sentry config
- Use `Sentry.logger` for structured logs
- Use `Sentry.metrics` for counters and distributions
- Wide events pattern: one rich log vs many thin logs
- Know when to use logs vs metrics vs exceptions

### When to Use What

| Signal | Use When | Example |
|--------|----------|---------|
| **Exception** | Something is broken and needs fixing | Unhandled error, failed DB query |
| **Log** | You need context about what happened (who, what, why) | "User X signed up", "Schedule add attempted — duplicate" |
| **Metric** | You need to count or measure something over time | Login failure rate, operation p95 duration |

**Rule of thumb:** If you'd alert on a *count* or *percentile*, use a metric. If you'd search for a *specific request*, use a log.

### The Bug

No visibility into what's happening inside operations. When things fail, you don't know the state of the system — no logs, no metrics.

### Steps

1. Try various actions (login, signup, add to schedule)
2. Check Sentry Logs — do you see any logs?
3. Check Sentry Metrics — do you see any custom metrics?

### Your Task

1. Enable logs in Sentry configuration
2. Add wide event logs to server actions
3. Add metrics (counters + distributions) alongside logs

**Files to modify:**
- `sentry.server.config.ts` - add `enableLogs: true`
- `instrumentation-client.ts` - add `enableLogs: true`
- `sentry.edge.config.ts` - add `enableLogs: true`
- `lib/actions/auth.ts` - add `Sentry.logger` and `Sentry.metrics` calls
- `lib/actions/schedule.ts` - add `Sentry.logger` and `Sentry.metrics` calls

### The Fix

```typescript
// sentry.*.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableLogs: true,  // Enable structured logging
});

// lib/actions/schedule.ts
export async function addToSchedule(talkId: string) {
  const startTime = Date.now();

  return Sentry.withServerActionInstrumentation(
    "schedule.addToSchedule",
    { headers: await headers() },
    async () => {
      const { userId } = await requireAuth();

      // Check for duplicate...
      if (existing.length > 0) {
        Sentry.metrics.count("schedule_add_duplicate");
        Sentry.logger.info("Schedule add attempted - already exists", { ... });
        return { error: "Talk already in your schedule" };
      }

      // ... insert logic ...

      // Metric: countable event + duration distribution
      Sentry.metrics.count("schedule_add_success");
      Sentry.metrics.distribution("schedule_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "add" },
      });

      // Log: wide event with full context
      Sentry.logger.info("Schedule item added", {
        talk_id: talkId,
        user_id: userId,
        duration_ms: Date.now() - startTime,
        action: "add_to_schedule",
      });

      return { success: true };
    }
  );
}

// lib/actions/auth.ts — same pattern for login/signup/logout:
Sentry.metrics.count("auth_login_success");
Sentry.metrics.distribution("auth_operation_duration", Date.now() - startTime, {
  unit: "millisecond",
  attributes: { action: "login", result: "success" },
});
```

### Success Criteria
- Logs appear in Sentry Logs view with structured attributes you can filter/search
- Metrics appear in Sentry Metrics view (counters for auth/schedule events, distributions for duration)

---

## Module 4: Database Tracing with Turso

**Branch:** `git checkout module-4-start`

### Learning Objectives
- Use `sentry-integration-libsql-client` for automatic DB tracing
- View full distributed traces: HTTP → tRPC → DB
- Identify slow queries in Sentry Performance

### The Bug

Database queries are invisible in traces. You can't see query timing or identify slow queries.

### Steps

1. Navigate around the app (view talks, speakers)
2. Check Sentry Performance for a trace
3. Notice there's no database span

### Your Task

Add the libsql integration to trace all database queries.

**Files to modify:**
- `lib/db/index.ts` - export the raw client
- `sentry.server.config.ts` - add `libsqlIntegration`

### The Fix

```typescript
// lib/db/index.ts
import { createClient, Client } from "@libsql/client";

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

// Export for Sentry integration
export const libsqlClient = new Proxy({} as Client, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
```

```typescript
// sentry.server.config.ts
import { libsqlIntegration } from "sentry-integration-libsql-client";
import { libsqlClient } from "./lib/db";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableLogs: true,
  integrations: [
    libsqlIntegration(libsqlClient, Sentry),
  ],
});
```

### Success Criteria
- Database queries appear as spans in traces
- You can see query timing and identify slow queries

---

## Module 5: AI Agent Monitoring (Auto-Instrumented)

**Branch:** `git checkout module-5-start`

### Learning Objectives
- Use `vercelAIIntegration()` for automatic LLM and tool tracing
- Enable `experimental_telemetry` on AI SDK calls
- Understand what auto-instrumentation gives you for free
- Find AI traces in Sentry's AI Insights

### The Bug

The AI chat has no observability. When it fails or gives bad responses, you can't see what happened.

### Steps

1. Go to AI Builder (requires login)
2. Ask: "What AI talks are available?"
3. Check Sentry — can you see what the AI did?

### Your Task

Add AI monitoring using Sentry's auto-instrumentation — **no manual spans needed**.

**Files to modify:**
- `sentry.server.config.ts` - add `vercelAIIntegration()`
- `lib/ai/agents.ts` - add `experimental_telemetry: { isEnabled: true }` to AI SDK calls

**Note:** `app/api/ai/chat/route.ts` already has pipeline-level `Sentry.startSpan` and `Sentry.logger.info` for custom context — those stay as-is.

### The Fix

```typescript
// sentry.server.config.ts
import { vercelAIIntegration } from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableLogs: true,
  integrations: [
    vercelAIIntegration(),
    // ... other integrations
  ],
});
```

```typescript
// lib/ai/agents.ts — enable telemetry on every AI SDK call
const { text } = await generateText({
  model: AGENTS.router.model,
  system: routerSystemPrompt,
  prompt: userMessage,
  experimental_telemetry: { isEnabled: true },
});

const result = streamText({
  model: AGENTS.search.model,
  system: searchAgentSystemPrompt,
  messages,
  tools: getSearchTools(userId),
  experimental_telemetry: { isEnabled: true },
});
```

When `vercelAIIntegration()` + `experimental_telemetry` are both enabled, Sentry automatically captures:
- LLM call spans (model, tokens, duration)
- Tool execution spans (tool name, inputs, outputs)
- Streaming metrics

No manual `Sentry.startSpan` wrappers needed in tool definitions.

### Success Criteria
- LLM calls appear in Sentry traces with model and token details
- Tool executions appear as child spans automatically
- AI metrics visible in AI Insights view

---

## Verification Checklist

After completing all modules, your app should have:

- [ ] **Module 1:** Theme toggle works, no hydration errors
- [ ] **Module 2:** Server actions show as named spans in traces
- [ ] **Module 3:** Structured logs appear with queryable attributes; metrics (counters + distributions) appear in Metrics view
- [ ] **Module 4:** Database queries visible in trace waterfalls
- [ ] **Module 5:** AI calls and tool executions auto-instrumented via `experimental_telemetry`

## Resources

- [Sentry Next.js SDK Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Server Actions Tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/#server-actions)
- [AI Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/ai-agent-monitoring/)
- [Structured Logs](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs/)
- [Turso Integration](https://docs.turso.tech/sdk/ts/integrations/sentry)
- [next-themes](https://github.com/pacocoursey/next-themes)
