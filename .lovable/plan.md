

## Plan: Remove loader on logout

### Problem
When the user clicks "تسجيل الخروج", a full-screen `ScreenLoader` flashes before the login page appears. This happens because:
- **Non-SSO**: `logout()` sets `user = null`, then does `window.location.href` reload — on reload, `isInitialised` starts as `false`, showing the loader
- **SSO**: `oidcLogout()` calls `signoutRedirect()` which navigates to IdP — while waiting, the app re-renders with no user and may flash the loader

### Solution
Skip the full-page reload for non-SSO logout. Instead, clear tokens and use React Router navigation so `isInitialised` stays `true` and the login page renders immediately with no loader.

### Changes

**File: `src/modules/auth/context/AuthProvider.tsx`**

In the `logout` function (non-SSO branch ~line 230-233):
- Remove `window.location.href` redirect
- Keep `clearTokens()` and `setUser(null)` — this makes `isAuthenticated = false`
- The existing route catch-all (`Navigate to /login`) handles the redirect without a loader since `isInitialised` remains `true`

```ts
// Before
clearTokens();
setUser(null);
window.location.href = window.location.origin + PATH.LOGIN;

// After
clearTokens();
setUser(null);
// No reload — isInitialised stays true, router redirects to /login instantly
```

For SSO logout, the redirect is external (IdP) so we cannot avoid it, but we should not reset state before the redirect completes. The current SSO flow already avoids setting `isInitialised = false`, so no change needed there.

### Result
- Non-SSO: logout instantly shows login page, no loader flash
- SSO: no change (external redirect is unavoidable)
- 1 file, ~1 line removed

