import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Localhost events are dropped by Sentry's default Inbound Filter.
// To see them: open your project on sentry.io →
//   Project Settings (gear) → Inbound Filters →
//   turn OFF "Events coming from localhost".
// To verify sends: DevTools → Network, filter by "sentry" or "ingest", trigger error; 200 = accepted.
if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.momrahai\.com/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
