import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://4f0a61b1a1f0136170e431ebbad09046@masar-sentry.massar-academy.com/1",
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
