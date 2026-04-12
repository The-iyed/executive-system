

## Plan: Improve Sentry Test Button to Trigger Network Error

### Problem
The current bug button throws a plain JS `throw new Error(...)` which may not fully test Sentry's network/fetch error capturing. We want it to simulate a failed network request so we can verify Sentry captures HTTP errors properly.

### Changes

**`src/modules/shared/components/Layout/shared-layout.tsx`**

Replace the `throw new Error(...)` handler with a function that:
1. Makes a `fetch()` call to a non-existent endpoint (e.g. `https://api.momrahai.com/sentry-test-404`) — this will produce a real network failure
2. Wraps it in a try/catch that captures the error via `Sentry.captureException()` with extra context (e.g. `tags: { test: true }`)
3. Shows a small toast notification confirming the test error was sent to Sentry

This tests both network error capturing and manual `Sentry.captureException` in one click.

### File changed

| File | Change |
|---|---|
| `shared-layout.tsx` | Import `Sentry`, replace `throw new Error` with async fetch to bad URL + `Sentry.captureException` + toast feedback |

