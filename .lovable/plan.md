

## Plan: Clean Up Sentry Integration

### Problem
Sentry init is duplicated in `main.tsx` and `sentry.client.config.ts`, the DSN is referenced via env var in multiple places, and `env.ts` exports an unused `SENTRY_DSN` constant. This needs consolidation into one clean file with a hardcoded DSN.

### Changes

**1. Create `src/lib/sentry.ts`** — single source of truth
- Hardcode the DSN directly: `https://6a9ff9897e2093f4ec59a334fb35db09@masar-sentry.massar-academy.com/2`
- Call `Sentry.init()` with all config (browserTracing, replay, tracePropagationTargets for localhost/momrahai/massar-academy, sendDefaultPii, tracesSampleRate 0.2)
- No env var dependency — just import and it runs

**2. Update `src/main.tsx`**
- Replace all Sentry imports and inline init (lines 10, 14-28) with a single `import '@/lib/sentry';` at the top
- Remove the `import * as Sentry from "@sentry/react"` line

**3. Delete `src/modules/guiding-light/sentry.client.config.ts`**
- Redundant duplicate — no longer needed

**4. Clean up `src/lib/env.ts`**
- Remove the `SENTRY_DSN` export (lines 51-55)

**5. Clean up `.env` and `.env.example`**
- Remove `VITE_SENTRY_DSN` line from both files

### Result
One file (`src/lib/sentry.ts`) owns all Sentry config. `main.tsx` just imports it. No env vars, no duplication.

### Files changed

| File | Change |
|---|---|
| `src/lib/sentry.ts` | New — hardcoded DSN, full Sentry.init |
| `src/main.tsx` | Replace Sentry code with `import '@/lib/sentry'` |
| `src/modules/guiding-light/sentry.client.config.ts` | Delete |
| `src/lib/env.ts` | Remove SENTRY_DSN export |
| `.env` | Remove VITE_SENTRY_DSN line |
| `.env.example` | Remove VITE_SENTRY_DSN line |

