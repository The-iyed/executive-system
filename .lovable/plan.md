

## Plan: Add configurable timezone env variable

### Problem
The timezone header is always derived from the browser. The user wants an optional env variable override.

### Changes

**1. `.env`** — Add new variable
```
VITE_APP_TIMEZONE=Asia/Riyadh
```

**2. `src/lib/env.ts`** — Export the new variable
```ts
export const APP_TIMEZONE = getEnv('VITE_APP_TIMEZONE', '');
```

**3. `src/lib/api/apiTimezone.ts`** — Use env value when set, fallback to browser
- Import `APP_TIMEZONE` from `@/lib/env`
- In `getBrowserTimezone()`: return `APP_TIMEZONE` if non-empty, otherwise return browser timezone as current default

### Result
- When `VITE_APP_TIMEZONE` is set (e.g. `Asia/Riyadh`), all API requests use that value in the `X-Timezone` header
- When empty or unset, falls back to browser-detected timezone as before
- 3 files changed

