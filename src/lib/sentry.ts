import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://6a9ff9897e2093f4ec59a334fb35db09@masar-sentry.massar-academy.com/2",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracePropagationTargets: ["localhost", /^https:\/\/masar-sentry\.massar-academy\.com/],
  sendDefaultPii: true,
  tracesSampleRate: 0.2,
  debug: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
