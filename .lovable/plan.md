

## Plan: Make meeting date always required + improve user display label fallback

### Changes

#### 1. `submitter/Step1Form.tsx` — Make date always required
Line 71: change `required={!isSchedulerEdit}` to `required` (always true).

#### 2. `userDisplayLabel.ts` — Fix name priority before mail
Currently `getUserDisplayLabel` checks `mail` first. Reorder to prioritize name fields, and add `name`, `username`, `email`, `first_name`/`last_name` fallbacks before mail:

```ts
export function getUserDisplayLabel(user: Record<string, unknown>): string {
  if (user.displayNameAR && typeof user.displayNameAR === 'string') return user.displayNameAR;
  if (user.displayName && typeof user.displayName === 'string') return user.displayName;
  if (user.displayNameEN && typeof user.displayNameEN === 'string') return user.displayNameEN;
  if (user.givenName && typeof user.givenName === 'string') return user.givenName;
  if (user.name && typeof user.name === 'string') return user.name;
  if (user.username && typeof user.username === 'string') return user.username;
  const first = user.first_name ?? user.givenName;
  const last = user.last_name ?? user.sn;
  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;
  const mail = user.mail ?? user.email;
  if (mail && typeof mail === 'string') return mail;
  return String(user.cn ?? '');
}
```

Priority: `displayNameAR` > `displayName` > `displayNameEN` > `givenName` > `name` > `username` > `first_name + last_name` > `mail/email` > `cn`

### Files changed

| File | Change |
|---|---|
| `submitter/Step1Form.tsx` | Change `MeetingDateField` required prop to always `true` |
| `userDisplayLabel.ts` | Reorder fallback chain: names before mail, add `name`/`username`/`first_name`+`last_name` |

