# Module 3: Structured Logs and Metrics

## The Problem

No visibility into what's happening inside operations. When things fail, you don't know the state of the system — no logs, no metrics. You have errors and traces, but no context about what happened during a request.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Try various actions (login, signup, add to schedule)
3. Check Sentry Logs — no logs appear
4. Check Sentry Metrics — no custom metrics

## Files to Modify

- `sentry.server.config.ts` — add `enableLogs: true`
- `instrumentation-client.ts` — add `enableLogs: true`
- `sentry.edge.config.ts` — add `enableLogs: true`
- `lib/actions/auth.ts` — add `Sentry.logger` and `Sentry.metrics` calls
- `lib/actions/schedule.ts` — add `Sentry.logger` and `Sentry.metrics` calls

## The Fix

**1. Enable logs in all Sentry configs:**

```typescript
// sentry.server.config.ts, instrumentation-client.ts, sentry.edge.config.ts
Sentry.init({
  // ... existing config
  enableLogs: true,
});
```

**2. Add wide event logs + metrics to server actions:**

```typescript
// lib/actions/schedule.ts
export async function addToSchedule(talkId: string) {
  const startTime = Date.now();

  return Sentry.withServerActionInstrumentation(
    "schedule.addToSchedule",
    { headers: await headers() },
    async () => {
      const { userId } = await requireAuth();

      // ... existing logic ...

      if (existing.length > 0) {
        Sentry.metrics.increment("schedule_add_duplicate");
        Sentry.logger.info("Schedule add attempted - already exists", {
          talk_id: talkId, user_id: userId,
        });
        return { error: "Talk already in your schedule" };
      }

      // ... insert logic ...

      // Metrics: countable events + duration
      Sentry.metrics.increment("schedule_add_success");
      Sentry.metrics.distribution("schedule_operation_duration", Date.now() - startTime, {
        unit: "millisecond",
        attributes: { action: "add" },
      });

      // Log: wide event with full context
      Sentry.logger.info("Schedule item added", {
        talk_id: talkId, user_id: userId,
        duration_ms: Date.now() - startTime,
        action: "add_to_schedule",
      });

      return { success: true };
    }
  );
}
```

**3. Same pattern for auth actions** (`login`, `signup`, `logout`).

## Verify

1. Perform some actions (login, add to schedule)
2. Check Sentry Logs — structured logs appear with attributes you can filter
3. Check Sentry Metrics — counters and duration distributions appear
4. Click through from a log to its trace
