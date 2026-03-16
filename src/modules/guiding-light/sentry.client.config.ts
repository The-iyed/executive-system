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
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
      Sentry.replayIntegration()
    ],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}
