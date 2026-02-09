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
Module 3: Structured Logs   → "What happened during the request?"
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

## Module 3: Structured Logs (Wide Events)

**Branch:** `git checkout module-3-start`

### Learning Objectives
- Enable `enableLogs: true` in Sentry config
- Use `Sentry.logger` for structured logs
- Wide events pattern: one rich log vs many thin logs

### The Bug

No visibility into what's happening inside operations. When things fail, you don't know the state of the system.

### Steps

1. Try various actions (login, signup, add to schedule)
2. Check Sentry Logs - do you see any logs?

### Your Task

1. Enable logs in Sentry configuration
2. Add wide event logs to server actions

**Files to modify:**
- `sentry.server.config.ts` - add `enableLogs: true`
- `sentry.client.config.ts` - add `enableLogs: true`
- `sentry.edge.config.ts` - add `enableLogs: true`
- `lib/actions/auth.ts` - add `Sentry.logger` calls
- `lib/actions/schedule.ts` - add `Sentry.logger` calls

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

      // ... existing logic ...

      // Wide event: all context in one log
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
```

### Success Criteria
- Logs appear in Sentry Logs view
- Logs have structured attributes you can filter/search

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

## Module 5: AI Agent Monitoring

**Branch:** `git checkout module-5-start`

### Learning Objectives
- Use `vercelAIIntegration()` for automatic LLM tracing
- Add manual `gen_ai.execute_tool` spans for tool calls
- Find AI traces in Sentry's AI Insights

### The Bug

The AI chat has no observability. When it fails or gives bad responses, you can't see what happened.

### Steps

1. Go to AI Builder (requires login)
2. Ask: "What AI talks are available?"
3. Check Sentry - can you see what the AI did?

### Your Task

Add AI monitoring to trace LLM calls and tool executions.

**Files to modify:**
- `sentry.server.config.ts` - add `vercelAIIntegration()`
- `lib/ai/tools.ts` - wrap tool execute with `Sentry.startSpan`
- `app/api/ai/chat/route.ts` - add wide event logging

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
// lib/ai/tools.ts - wrap tool execution
import * as Sentry from "@sentry/nextjs";

export const searchTalks = tool({
  description: "Search for conference talks...",
  inputSchema: z.object({ /* ... */ }),
  execute: async (params) => {
    return Sentry.startSpan(
      { op: "gen_ai.execute_tool", name: "execute_tool searchTalks" },
      async (span) => {
        span.setAttribute("gen_ai.tool.name", "searchTalks");
        span.setAttribute("gen_ai.tool.input", JSON.stringify(params));

        const result = await /* ... actual tool logic ... */;

        span.setAttribute("gen_ai.tool.output_count", result.length);
        return result;
      }
    );
  },
});
```

```typescript
// app/api/ai/chat/route.ts - wide event logging
export async function POST(req: Request) {
  const startTime = Date.now();
  // ... existing code ...

  Sentry.logger.info("AI chat request processed", {
    user_id: userId,
    message_count: messages.length,
    pipeline: "conference-scheduler",
    duration_ms: Date.now() - startTime,
  });

  return response;
}
```

### Success Criteria
- LLM calls appear in Sentry traces
- Tool executions have their own spans
- AI metrics visible in AI Insights view

---

## Verification Checklist

After completing all modules, your app should have:

- [ ] **Module 1:** Theme toggle works, no hydration errors
- [ ] **Module 2:** Server actions show as named spans in traces
- [ ] **Module 3:** Structured logs appear with queryable attributes
- [ ] **Module 4:** Database queries visible in trace waterfalls
- [ ] **Module 5:** AI calls and tool executions tracked

## Resources

- [Sentry Next.js SDK Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Server Actions Tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/#server-actions)
- [AI Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/ai-agent-monitoring/)
- [Structured Logs](https://docs.sentry.io/platforms/javascript/guides/nextjs/logs/)
- [Turso Integration](https://docs.turso.tech/sdk/ts/integrations/sentry)
- [next-themes](https://github.com/pacocoursey/next-themes)
