# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # Run Biome linter + formatter check
pnpm format       # Auto-format with Biome
pnpm db:init      # Create Turso DB & write credentials to .env.local
pnpm db:push      # Apply Drizzle schema to database
pnpm db:seed      # Seed conference data
pnpm db:studio    # Open Drizzle Studio
```

## Architecture

This is a Next.js 16 demo app for a Sentry workshop, showcasing multiple data fetching patterns.

### Data Flow Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| RSC + tRPC server caller | Page data loading | `app/page.tsx`, `app/talks/[id]/page.tsx` |
| tRPC client hooks | Interactive UI | `components/schedule-filters.tsx` |
| Server Actions | Mutations | `lib/actions/auth.ts`, `lib/actions/schedule.ts` |
| API Routes | AI streaming | `app/api/ai/chat/route.ts` |

### Key Layers

- **`lib/trpc/`** - tRPC setup with routers for talks, speakers, schedule
  - `server.ts` exports `trpc()` for RSC usage: `const api = await trpc(); const talks = await api.talks.list();`
  - `client.tsx` exports `trpc` hooks for client components
- **`lib/auth/`** - JWT session in cookies, DAL pattern with `requireAuth()` for protected routes
- **`lib/db/`** - Drizzle ORM with Turso, lazy initialization via Proxy to avoid build-time errors
- **`lib/ai/tools.ts`** - AI SDK tools using `inputSchema` (not `parameters`) for v4+ compatibility
- **`proxy.ts`** - Next.js 16 proxy (replaces middleware) for optimistic auth redirects

### Auth Pattern

Protected pages call `requireAuth()` from `lib/auth/dal.ts` which redirects if no session. The proxy layer (`proxy.ts`) provides optimistic redirects but actual security is in the DAL.

### Database

Turso (hosted SQLite) with Drizzle. Schema in `lib/db/schema.ts`. The `db` export uses a Proxy for lazy initialization to prevent build-time errors when env vars aren't available.
