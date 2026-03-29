

## Plan: Replace all hardcoded Almarai font references with IBM Plex Sans Arabic

### Problem
34 files still have `fontFamily: "'Almarai', sans-serif"` or similar hardcoded references. The project font was changed to IBM Plex Sans Arabic but these inline styles were not updated.

### Scope
Every occurrence of `Almarai` in `fontFamily` or `font-family` across the codebase needs to be replaced with `'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif`.

### Files to update (34 files + 1 CSS)

**CSS file:**
- `src/modules/UC02/components/minister-fullcalendar.css` — change `--fc-font-family: 'Almarai'` to `'IBM Plex Sans Arabic', 'Frutiger LT Arabic'`

**Component/utility files with `fontFamily: "'Almarai'..."` constants or inline styles (all 34 files from search results):**

Replace every instance of:
```ts
fontFamily: "'Almarai', sans-serif"
// or
fontFamily: "Almarai, sans-serif"
// or
fontFamily: "'Almarai', 'Almarai', sans-serif"
// or
fontFamily: "'Almarai', 'Frutiger LT Arabic', sans-serif"
```

With:
```ts
fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif"
```

Key files include:
1. `src/modules/UC05/components/content-request-card.tsx`
2. `src/modules/UC02/features/calendar/components/CalendarHeader.tsx`
3. `src/modules/UC01/features/PreviewMeeting/tabs/MeetingPreviewTab.tsx`
4. `src/modules/guiding-light/components/meetings/DetailedMeetingCard.tsx`
5. `src/modules/shared/components/AgendaPreviewTable.tsx`
6. `src/modules/shared/components/Mou7tawaContentTab.tsx`
7. `src/modules/UC02/components/MinisterCalendarView.tsx`
8. `src/modules/shared/components/search-input.tsx`
9. `src/modules/shared/components/MeetingInfo.tsx`
10. `src/modules/auth/components/SSOLoader.tsx`
11. `src/modules/shared/components/MeetingActionsBar.tsx`
12. `src/modules/shared/utils/format.ts`
13. All remaining 22 files from the search results

### Approach
- Global find-and-replace of `Almarai` → `IBM Plex Sans Arabic` in all fontFamily declarations
- Ensure the fallback chain is consistently `'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif`
- ~34 TypeScript/TSX files + 1 CSS file updated

### Note
Many of these inline `fontFamily` styles could eventually be removed entirely since the global CSS already sets `IBM Plex Sans Arabic` as the body font. But for now, the safest approach is to update them all to the correct font to ensure consistency everywhere, including portal-rendered components.

