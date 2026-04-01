

# CRUD Operations for Content Directives (إضافة التوجيهات)

## Goal
Replace the current client-side-only directive management in the المحتوى tab with real API-backed CRUD operations using the new `/api/content/{MEETING_ID}/directives` endpoints, with optimistic updates.

## Current State
- The directives table in ContentTab currently manages directives via local React state (`manualAddedActions`, `deletedExistingDirectiveIds`, `aiDirectivesSuggestions`, etc.)
- No dedicated API calls to `/api/content/{MEETING_ID}/directives` exist yet
- The meeting ID is available as `h.id` (the content request/meeting ID from URL params)

## New API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/content/{MEETING_ID}/directives` | List directives |
| POST | `/api/content/{MEETING_ID}/directives` | Create directive |
| PATCH | `/api/content/{MEETING_ID}/directives/{id}` | Update directive |
| DELETE | `/api/content/{MEETING_ID}/directives/{id}` | Delete directive |

## Plan

### 1. Add API functions to `contentApi.ts`
- Add `getContentDirectives(meetingId)` → GET
- Add `createContentDirective(meetingId, data)` → POST (body: `{ title, due_date, assignees, status }`)
- Add `updateContentDirective(meetingId, directiveId, data)` → PATCH (partial body)
- Add `deleteContentDirective(meetingId, directiveId)` → DELETE
- Define `ContentDirective` interface matching the POST body shape (`id`, `title`, `due_date`, `assignees`, `status`)

### 2. Add query + mutations to `useContentRequestDetailPage.ts`
- **Query**: `useQuery(['content-directives', id])` calling `getContentDirectives(id)` — replaces reliance on `contentRequest.related_directives`
- **Create mutation**: optimistic insert into cache, rollback on error, toast feedback
- **Update mutation**: optimistic patch in cache (for inline status/assignee/due_date edits), rollback on error
- **Delete mutation**: optimistic removal from cache, rollback on error
- Expose: `contentDirectives`, `createDirectiveMutation`, `updateDirectiveMutation`, `deleteDirectiveMutation`
- Update `hasDirectives` computed to include content directives count

### 3. Update ContentTab.tsx table rendering
- Use `contentDirectives` from API query as the primary data source for the "regular directive" rows (replacing `directivesFiltered` from `contentRequest.related_directives`)
- Wire "إضافة توجيه" button → open inline add row → on select, call `createDirectiveMutation.mutate(...)` instead of pushing to local `manualAddedActions`
- Wire delete button on each row → `deleteDirectiveMutation.mutate(directiveId)`
- Wire inline edits (status select, due date picker, assignees) → `updateDirectiveMutation.mutate(...)` on change
- Keep AI suggestions and suggested-actions rows as-is (they use different flows)

### 4. Update send-to-scheduling flow
- `handleSendToScheduling` should include API-fetched directives alongside AI/suggested/manual ones in the payload

## Files Changed
1. `src/modules/UC05/data/contentApi.ts` — new API functions + types
2. `src/modules/UC05/features/content-request-detail/hooks/useContentRequestDetailPage.ts` — query + 3 mutations + expose
3. `src/modules/UC05/features/content-request-detail/tabs/ContentTab.tsx` — wire table to API mutations

