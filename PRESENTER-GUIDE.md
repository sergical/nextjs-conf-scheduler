# Presenter Guide — Debugging Next.js Workshop

A complete run-of-show for delivering the 1-hour Sentry workshop. Pair this with `WORKSHOP.md` for learner-facing content.

---

## Pre-Workshop Checklist

Run through this **30 minutes before** go-live:

- [ ] `pnpm install` — deps are up to date
- [ ] `.env.local` contains `NEXT_PUBLIC_SENTRY_DSN`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `OPENAI_API_KEY`
- [ ] `pnpm db:push && pnpm db:seed` — DB has fresh data
- [ ] `pnpm build` — no build errors on `main`
- [ ] All module branches exist locally: `git branch | grep module`
  - `module-1-start` through `module-5-start`
- [ ] Sentry dashboard is open — **clear any stale issues** so new ones are obvious
- [ ] Browser tabs ready:
  1. App at `localhost:3000`
  2. Sentry Issues view
  3. Sentry Performance view
  4. Sentry Logs view (for Module 3+)
  5. Sentry AI Insights view (for Module 5)
- [ ] Editor open with file tree visible
- [ ] Screen share set to **editor + browser** layout
- [ ] Font size bumped to 18-20px in editor and terminal

---

## Timing Table (60 min)

| Time | Duration | Section | Branch | Key Action |
|------|----------|---------|--------|------------|
| 0:00 | 5 min | Intro + App Tour | `main` | Show the running app, explain the stack |
| 0:05 | 10 min | Module 1: Error Capture | `module-1-start` | Trigger hydration error, fix theme provider |
| 0:15 | 10 min | Module 2: Tracing | `module-2-start` | Wrap server actions, show named traces |
| 0:25 | 10 min | Module 3: Structured Logs | `module-3-start` | Enable logs, add wide events |
| 0:35 | 10 min | Module 4: DB Tracing | `module-4-start` | Add libsql integration, show query spans |
| 0:45 | 12 min | Module 5: AI Monitoring | `module-5-start` | Add vercelAI integration, trace tool calls |
| 0:57 | 3 min | Wrap-up | — | Recap, resources, Q&A |

**Buffer rule:** If a module runs long, steal from Module 5 (it's the most skippable). If you're ahead, add more Sentry dashboard exploration.

---

## Per-Module Script

### Intro + App Tour (0:00 — 0:05)

**Branch:** `main`

**Demo flow:**
1. Show the running app — browse talks, view a speaker page
2. Click "Sign Up" → create an account → log in
3. Add a talk to your schedule
4. Open the AI Builder chat and ask a question
5. "This app works great… but we have zero visibility. Let's fix that."

**Talking points:**
- Next.js 16 app with tRPC, Drizzle, Turso, Vercel AI SDK
- Sentry SDK is installed but not fully wired up — each module adds one capability
- Each module has a starting branch with a specific gap

---

### Module 1: Error Capture — Hydration Errors (0:05 — 0:15)

**Branch:**
```bash
git checkout module-1-start
pnpm dev
```

**Demo flow:**
1. Open app → click the theme toggle (light/dark)
2. **Show the hydration error** in the browser console
3. Switch to Sentry → find the hydration error in Issues
4. Walk through the error details — "Sentry caught this automatically"
5. Open `components/theme-provider.tsx` — show the broken code reading `localStorage` during SSR
6. **Write the fix:** Replace with `next-themes` ThemeProvider
7. Open `app/layout.tsx` — wrap children with `<ThemeProvider>`
8. Refresh → toggle theme → no error
9. Switch to Sentry → "The issue is resolved"

**Talking points:**
- Sentry captures React errors automatically — no manual try/catch needed
- Hydration errors are one of the most common Next.js bugs
- The error detail in Sentry shows exactly what mismatched

**Files touched:**
- `components/theme-provider.tsx`
- `app/layout.tsx`

---

### Module 2: Tracing Server Actions (0:15 — 0:25)

**Branch:**
```bash
git checkout module-2-start
pnpm dev
```

**Demo flow:**
1. Log in → add a talk to your schedule
2. Open Sentry Performance → "Where's the trace? It's anonymous."
3. Open `lib/actions/schedule.ts`
4. **Write the fix:** Wrap with `Sentry.withServerActionInstrumentation()`
   - Name: `"schedule.addToSchedule"`
   - Pass `headers: await headers()` for distributed tracing
5. Do the same for `lib/actions/auth.ts` (login/signup)
6. Add a talk again → check Sentry Performance
7. **Show the trace waterfall:** browser → server action → database

**Talking points:**
- Server actions are invisible by default — you must instrument them
- `headers()` connects the browser span to the server span (distributed tracing)
- Named actions make it easy to filter and alert on specific operations

**Files touched:**
- `lib/actions/schedule.ts`
- `lib/actions/auth.ts`

---

### Module 3: Structured Logs — Wide Events (0:25 — 0:35)

**Branch:**
```bash
git checkout module-3-start
pnpm dev
```

**Demo flow:**
1. "We have errors and traces — but what about the context inside an operation?"
2. Open `sentry.server.config.ts` → add `enableLogs: true`
3. Do the same for `instrumentation-client.ts` and `sentry.edge.config.ts`
4. Open `lib/actions/schedule.ts` → add a `Sentry.logger.info()` call with structured attributes:
   - `talk_id`, `user_id`, `duration_ms`, `action`
5. Do the same for auth actions
6. Perform some actions → switch to Sentry Logs view
7. **Show filtering:** filter by `action: "add_to_schedule"`, filter by `user_id`
8. "This is the wide events pattern — one rich log beats twenty thin ones"

**Talking points:**
- Wide events: pack all context into one log entry so you can query any dimension
- `Sentry.logger` gives you structured attributes, not just strings
- Logs are correlated with traces — click through from log to trace

**Files touched:**
- `sentry.server.config.ts`
- `instrumentation-client.ts`
- `sentry.edge.config.ts`
- `lib/actions/schedule.ts`
- `lib/actions/auth.ts`

---

### Module 4: Database Tracing with Turso (0:35 — 0:45)

**Branch:**
```bash
git checkout module-4-start
pnpm dev
```

**Demo flow:**
1. Navigate around — view talks, view a speaker page
2. Open Sentry Performance → open a trace → "No DB spans"
3. Open `lib/db/index.ts` → export the raw libsql client via Proxy
4. Open `sentry.server.config.ts` → add `libsqlIntegration(libsqlClient, Sentry)`
5. Import `libsqlIntegration` from `sentry-integration-libsql-client`
6. Navigate around again → open a trace
7. **Show the DB spans** in the waterfall — query text, duration
8. "Now you can spot the slow query without adding any logging to your Drizzle code"

**Talking points:**
- The integration auto-instruments every query — zero changes to your ORM code
- You can see the actual SQL and timing in the span
- The Proxy pattern avoids build-time errors (env vars not available during `next build`)

**Files touched:**
- `lib/db/index.ts`
- `sentry.server.config.ts`

---

### Module 5: AI Agent Monitoring (0:45 — 0:57)

**Branch:**
```bash
git checkout module-5-start
pnpm dev
```

**Demo flow:**
1. Log in → open AI Builder
2. Ask: "What AI talks are available?"
3. Check Sentry → "No AI visibility"
4. Open `sentry.server.config.ts` → add `vercelAIIntegration()`
5. Open `lib/ai/tools.ts` → wrap tool execute functions with `Sentry.startSpan`:
   - `op: "gen_ai.execute_tool"`
   - `name: "execute_tool searchTalks"`
   - Set attributes: `gen_ai.tool.name`, `gen_ai.tool.input`, `gen_ai.tool.output_count`
6. Open `app/api/ai/chat/route.ts` → add wide event log for the chat request
7. Ask the AI another question → check Sentry
8. **Show AI Insights** — LLM call spans, tool execution spans, token usage
9. **Show the trace** — full path from HTTP request → LLM → tool → DB

**Talking points:**
- `vercelAIIntegration()` auto-captures LLM calls — model, tokens, duration
- Manual `gen_ai.execute_tool` spans give you visibility into what tools the AI used
- AI Insights dashboard gives you aggregate metrics across all AI usage

**Files touched:**
- `sentry.server.config.ts`
- `lib/ai/tools.ts`
- `app/api/ai/chat/route.ts`

---

### Wrap-up (0:57 — 1:00)

**Demo flow:**
1. Switch back to Sentry — show the full picture:
   - Issues: errors caught automatically
   - Performance: traces with named server actions + DB spans
   - Logs: structured wide events
   - AI Insights: LLM and tool monitoring
2. "In 50 minutes we went from zero observability to full-stack visibility"
3. Share resources (link to `WORKSHOP.md` and Sentry docs)

---

## Risk Mitigation

| Risk | Symptom | Fallback |
|------|---------|----------|
| Sentry event delay | Events don't appear in dashboard after action | Say "Sentry events can take 5-10 seconds." Move on, come back to show it later. Have a pre-captured screenshot ready. |
| Branch has conflicts | `git checkout module-X-start` fails | Run `git stash` first. If still broken, have the repo re-cloned in a backup directory. |
| Missing env vars | Build or runtime error about undefined vars | Keep a `.env.local.backup` file. Copy it in: `cp .env.local.backup .env.local` |
| OpenAI key missing/expired | Module 5 AI chat fails | Show the code changes and Sentry config without live AI. Use a pre-recorded clip of the AI trace. |
| DB not seeded | Empty talk list | Run `pnpm db:push && pnpm db:seed` live — it takes <10 seconds. |
| Running over time | Module 4 starts after 0:40 | Skip Module 4 live demo, show a pre-captured trace screenshot. Jump to Module 5 or wrap up early. |
| Dev server crashes | White screen or terminal error | Kill and restart: `pnpm dev`. If persistent, switch to backup directory. |
| Sentry rate limit | 429 errors in console | Lower `tracesSampleRate` to `0.5`. Events will still flow, just sampled. |

---

## Dry Run Practice Order

Practice the workshop in three passes:

### Pass 1: Silent Walkthrough (30 min)
- Go through every module branch checkout, code edit, and Sentry verification
- Focus on **muscle memory**: which files to open, what to type, where to look in Sentry
- Time each module — identify which ones run long
- Fix any issues (missing deps, broken branches, stale DB)

### Pass 2: Narrated Run (50 min)
- Do the full workshop talking out loud as if presenting
- Practice transitions between modules ("Now that we can see errors, let's trace where requests go")
- Practice the Sentry dashboard navigation — know exactly which tab, which filter
- Record your per-module times and adjust pacing

### Pass 3: Recorded Dress Rehearsal (60 min)
- Screen record the full session with OBS or QuickTime
- Watch it back — look for:
  - Dead air while waiting for Sentry events
  - Fumbling with file navigation
  - Unclear explanations
  - Pacing issues (too fast on easy parts, too slow on hard parts)
- Create backup screenshots from this recording for risk mitigation

**Between passes:** Reset the environment:
```bash
git checkout main
pnpm db:push && pnpm db:seed
# Clear Sentry issues if needed
```
