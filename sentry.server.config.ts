// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { vercelAIIntegration } from "@sentry/nextjs";
import { libsqlIntegration } from "sentry-integration-libsql-client";
import { libsqlClient } from "./lib/db";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Add integrations for database and AI tracing
  integrations: [
    libsqlIntegration(libsqlClient, Sentry),
    vercelAIIntegration(),
  ],
});
