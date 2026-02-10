# Module 2: Tracing Server Actions

## The Problems

1. **Login is broken** — `lib/actions/auth.ts` throws `"Database connection lost during authentication"` on every login attempt. In production, the client only sees a minified error — you need Sentry to see the real message.

2. **Server actions are anonymous** — Server actions appear as anonymous operations in Sentry Performance. When you add a talk to your schedule or log in, there are no names, no timing, and no connection to the browser-side trace.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Sign up for an account, then try to log in — it will fail with an unhelpful error
3. Add a talk to your schedule
4. Check Sentry Performance — the server action is either invisible or anonymous

## Files to Modify

- `lib/actions/auth.ts` — remove the thrown error, wrap with `Sentry.withServerActionInstrumentation()`
- `lib/actions/schedule.ts` — wrap with `Sentry.withServerActionInstrumentation()`

## The Fix

### Step 1: Fix the login bug

Remove the `throw new Error("Database connection lost during authentication")` in `login()`.

### Step 2: Wrap server actions with instrumentation

Wrap each server action with `Sentry.withServerActionInstrumentation()` to give it a name and connect it to the browser trace via `headers`.

**`lib/actions/schedule.ts`**:

```typescript
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

**`lib/actions/auth.ts`** — same pattern for `login`, `signup`, and `logout`:

```typescript
export async function login(formData: FormData) {
  return Sentry.withServerActionInstrumentation(
    "auth.login",
    { headers: await headers() },
    async () => {
      // existing logic here
    }
  );
}
```

## Verify

1. Log in successfully (no more error)
2. Add a talk to your schedule
3. Check Sentry Performance — you should see named spans like `schedule.addToSchedule`
4. Open a trace — the waterfall shows: browser → server action → database
