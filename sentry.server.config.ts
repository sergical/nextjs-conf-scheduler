// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { vercelAIIntegration } from "@sentry/nextjs";
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

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Propagate tracing headers to same-origin requests and Turso DB
  tracePropagationTargets: [/^\//, /\.turso\.io/],

  // Add integrations for database and AI tracing
  integrations: [libsqlIntegration(getClient()), vercelAIIntegration()],
});
