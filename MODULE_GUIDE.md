# Module 4: Database Tracing with Turso

## The Problem

Database queries are invisible in Sentry traces. When you browse talks or speakers, you can see HTTP spans but no `db.query` spans — you can't tell which queries are slow or what SQL is being executed.

Two things are broken:

1. **No shared client instance:** `lib/db/index.ts` uses a module-level variable (`let _client`), but Next.js bundles this file separately for the instrumentation hook and page handlers — creating two different client instances. Even if you patch one, queries run on the other.
2. **No `serverExternalPackages`:** Without externalizing `@libsql/client`, the bundler duplicates the module, making any singleton sharing ineffective.

## Reproduce

1. Start the dev server: `pnpm dev`
2. Navigate around the app — view talks, speakers
3. Open Sentry Performance → open any trace
4. Notice: no `db.query` spans — only `http.client` POST spans to Turso

## Files to Modify

1. `lib/db/index.ts` — change to `globalThis` singleton
2. `next.config.ts` — add `serverExternalPackages: ["@libsql/client"]`
3. `sentry.server.config.ts` — add inline `libsqlIntegration` function + `getClient` import

## The Fix

### 1. `lib/db/index.ts` — globalThis singleton

Replace the module-level `let _client` / `let _db` variables with `globalThis` storage:

```typescript
import { type Client, createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Store singletons on globalThis so the instrumentation bundle (where Sentry
// patches client.execute) and page-handler bundles share the same instance.
const CLIENT_KEY = "__libsql_client" as const;
const DB_KEY = "__drizzle_db" as const;

declare global {
  var __libsql_client: Client | undefined;
  var __drizzle_db: LibSQLDatabase<typeof schema> | undefined;
}

export function getClient(): Client {
  if (!globalThis[CLIENT_KEY]) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL environment variable is not set");
    }
    globalThis[CLIENT_KEY] = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return globalThis[CLIENT_KEY];
}

export function getDb() {
  if (!globalThis[DB_KEY]) {
    globalThis[DB_KEY] = drizzle(getClient(), { schema });
  }
  return globalThis[DB_KEY];
}

// For backwards compatibility - creates db on first access
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
```

### 2. `next.config.ts` — add serverExternalPackages

Add `serverExternalPackages` to the Next.js config so `@libsql/client` isn't bundled separately:

```typescript
const nextConfig: NextConfig = {
  // Externalize @libsql/client so instrumentation and page handlers share the
  // same module instance — required for Sentry's libsql integration monkey-patching
  serverExternalPackages: ["@libsql/client"],
  images: {
    // ... existing config
  },
};
```

### 3. `sentry.server.config.ts` — add inline libsql integration

Add the `libsqlIntegration` function and import `getClient`:

```typescript
import type { Client } from "@libsql/client";
import { getClient } from "./lib/db";

function libsqlIntegration(client: Client) {
  return {
    name: "LibsqlIntegration",
    setupOnce() {
      const originalExecute = client.execute.bind(client);
      client.execute = function (stmt) {
        const sql = typeof stmt === "string" ? stmt : stmt.sql;
        return Sentry.startSpan(
          {
            op: "db.query",
            name: sql,
            attributes: {
              "db.system": "sqlite",
              "db.statement": sql,
            },
          },
          async (span) => {
            try {
              const result = await originalExecute(stmt);
              span.setAttribute("db.rows_affected", result.rowsAffected);
              span.setStatus({ code: 1 });
              return result;
            } catch (error) {
              span.setStatus({ code: 2 });
              throw error;
            }
          },
        );
      };
    },
  };
}
```

Then add it to the `integrations` array:

```typescript
integrations: [libsqlIntegration(getClient()), vercelAIIntegration()],
```

## Verify

1. Navigate around the app — view talks, speakers
2. Open Sentry Performance → open a trace
3. You should see `db.query` spans with SQL statements as the span name
4. Span attributes include `db.system: "sqlite"` and `db.statement`
5. You can identify slow queries from the trace waterfall
