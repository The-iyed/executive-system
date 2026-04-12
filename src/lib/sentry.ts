import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://6a9ff9897e2093f4ec59a334fb35db09@masar-sentry.massar-academy.com/2",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/.*\.momrahai\.com/,
    /^https:\/\/.*\.massar-academy\.com/,
  ],
  sendDefaultPii: true,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
