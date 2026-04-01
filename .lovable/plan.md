

## Plan: Fix directive filtering and button display logic on /directives

### Problem
Currently the directive card badge shows `status` (TAKEN/ADOPTED) but the user wants:
1. **Tabs**: Keep filtering by `status` (TAKEN = التوجيهات الحالية, ADOPTED = التوجيهات السابقة) — already correct
2. **Card badge**: Show `scheduling_officer_status` (OPEN/CLOSED) to indicate whether "تم الأخذ بالتوجيه"
3. **Button visibility**: "الأخذ بالتوجيه" should only depend on `scheduling_officer_status` — show when OPEN, hide when CLOSED

### Changes

#### 1. `DirectivesFeature.tsx` — Change `statusField` and simplify `hidden` logic

- Line 118: Change `statusField="status"` to `statusField="scheduling_officer_status"` so the card badge reflects scheduling officer status
- Line 41: Simplify `hidden` from `d.status === 'ADOPTED' || d.scheduling_officer_status === 'CLOSED'` to just `d.scheduling_officer_status === 'CLOSED'`

### Files changed

| File | Change |
|---|---|
| `src/modules/UC02/features/directives/DirectivesFeature.tsx` | Change `statusField` to `scheduling_officer_status`; simplify button `hidden` to only check `scheduling_officer_status` |

