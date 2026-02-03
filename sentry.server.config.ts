// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { vercelAIIntegration } from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e5d5097165ecbeeef78b9f262e1a1b5c@o4505994951065600.ingest.us.sentry.io/4510689459372032",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Add integrations for AI tracing
  integrations: [vercelAIIntegration()],
});
