

## Plan: Update Sentry DSN

Replace the current Sentry DSN in `.env` with the new one, and update the `tracePropagationTargets` regex in `main.tsx` to also cover `massar-academy.com`.

### Changes

| File | Change |
|---|---|
| `.env` | Change `VITE_SENTRY_DSN` to `https://6a9ff9897e2093f4ec59a334fb35db09@masar-sentry.massar-academy.com/2` |
| `src/main.tsx` | Add `massar-academy.com` to `tracePropagationTargets` |

