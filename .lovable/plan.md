

## Plan: Implement Sentry with full config using env variables

### Problem
Sentry is currently disabled (`if (false)`) in `main.tsx` and the DSN is not set in `.env`.

### Changes

**1. `.env` — Add Sentry DSN**
```
VITE_SENTRY_DSN=https://e8d708e34090cea1ab591f6e92e0bf7c@sentry.momrahai.com/1
```

**2. `.env.example` — Update Sentry DSN example**
```
VITE_SENTRY_DSN=https://e8d708e34090cea1ab591f6e92e0bf7c@sentry.momrahai.com/1
```

**3. `src/main.tsx` — Enable Sentry with full config**
Replace the disabled `if (false)` block (lines 15-23) with a proper initialization matching the provided example:
```typescript
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.momrahai\.com/],
    sendDefaultPii: true,
    debug: false,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```
Remove the unused `SENTRY_DSN` import from `@/lib/env`.

**4. `src/modules/guiding-light/sentry.client.config.ts` — Update to match**
Add `browserTracingIntegration()` and `tracePropagationTargets` to keep both configs aligned.

### Files changed

| File | Change |
|---|---|
| `.env` | Add `VITE_SENTRY_DSN` |
| `.env.example` | Update `VITE_SENTRY_DSN` with actual DSN |
| `src/main.tsx` | Enable Sentry with full integrations (tracing, replay, trace propagation) |
| `src/modules/guiding-light/sentry.client.config.ts` | Add browserTracingIntegration + tracePropagationTargets |

