# Module 2: Tracing Server Actions

## The Problem

Server actions appear as anonymous operations in Sentry Performance. When you add a talk to your schedule or log in, you can't see what's happening — the actions have no names, no timing, and no connection to the browser-side trace.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Sign up for an account and log in
3. Add a talk to your schedule
4. Check Sentry Performance — the server action is either invisible or anonymous

## Files to Modify

- `lib/actions/schedule.ts` — wrap with `Sentry.withServerActionInstrumentation()`
- `lib/actions/auth.ts` — wrap with `Sentry.withServerActionInstrumentation()`

## The Fix

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

1. Add a talk to your schedule
2. Check Sentry Performance — you should see named spans like `schedule.addToSchedule`
3. Open a trace — the waterfall shows: browser → server action → database
