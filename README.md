# Next.js Conf Schedule Builder

A demo app for the Sentry workshop: "Observing and Debugging Next.js apps with Sentry"

Built with Next.js 16, featuring real Next.js Conf 2025 session data.

## Features

- **Schedule Grid** - Browse all conference talks with filters (track, level, format)
- **Talk Details** - View full talk info, speaker bio, add to your schedule
- **Speaker Pages** - Browse speakers and their talks
- **My Schedule** - Manage your personalized conference schedule
- **AI Schedule Builder** - Get AI-powered talk recommendations based on your interests
- **Sentry Integration** - Error tracking, performance monitoring, AI agent observability

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: Turso (hosted SQLite) + Drizzle ORM
- **API**: tRPC (type-safe)
- **Auth**: JWT sessions (cookies)
- **AI**: Vercel AI SDK + OpenAI
- **UI**: shadcn/ui + Tailwind CSS
- **Monitoring**: Sentry

## Quick Start

### Prerequisites

- Node.js 18+
- [Turso CLI](https://docs.turso.tech/cli/installation) (`brew install tursodatabase/tap/turso`)
- OpenAI API key
- Sentry account (optional, for monitoring)

### Setup

```bash
# Install dependencies
pnpm install

# Set up Turso database (creates DB + writes .env.local)
pnpm db:init

# Apply database schema
pnpm db:push

# Seed conference data
pnpm db:seed

# Add remaining env vars to .env.local
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
# .env.local
TURSO_DATABASE_URL=libsql://...    # Set by db:init
TURSO_AUTH_TOKEN=...               # Set by db:init
JWT_SECRET=...                     # Any 32+ char string
OPENAI_API_KEY=sk-...              # For AI Builder
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm db:init` | Create Turso DB & configure env |
| `pnpm db:push` | Apply Drizzle schema |
| `pnpm db:seed` | Seed conference data |
| `pnpm db:studio` | Open Drizzle Studio |

## Project Structure

```
app/
├── (auth)/           # Login/signup pages
├── ai-builder/       # AI schedule assistant
├── api/              # API routes (tRPC, AI chat)
├── my-schedule/      # User's saved talks
├── speakers/         # Speaker list & details
├── talks/            # Talk details
└── page.tsx          # Schedule grid (home)

lib/
├── actions/          # Server Actions (auth, schedule)
├── ai/               # AI tools for schedule builder
├── auth/             # Session & DAL
├── db/               # Drizzle schema & client
└── trpc/             # tRPC routers & client
```

## Data Fetching Patterns

This app demonstrates multiple Next.js data fetching patterns for Sentry observability:

| Pattern | Location | Sentry Shows |
|---------|----------|--------------|
| RSC + tRPC server | `/`, `/talks/[id]` | DB queries as spans |
| tRPC client | Filters, My Schedule | Full HTTP trace |
| Server Actions | Add/remove talks, auth | Mutation spans |
| API Routes | `/api/ai/chat` | AI agent tool calls |

## License

MIT
