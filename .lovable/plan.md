

## Plan: Create shared `request-notes` feature

### Overview
Extract the Notes tab into a shared feature (`src/modules/shared/features/request-notes/`) following the same pattern as `request-info`, `meeting-info`, and `content-info`. Then consume it from UC01, UC02, and UC05.

### Structure

```text
src/modules/shared/features/request-notes/
├── index.ts
├── types.ts
├── RequestNotesView.tsx        # Shared UI (NoteBlock + empty state)
└── requestNotesMapper.ts       # Maps raw meeting API → RequestNotesViewData
```

### Changes

**1. `src/modules/shared/features/request-notes/types.ts`**
- Define `NoteItem` type: `{ key: string; title: string; text: string; variant: 'content' | 'scheduling' | 'general' | 'refusal' | 'cancellation' }`
- Define `RequestNotesViewData`: `{ notes: NoteItem[] }`
- Define `RequestNotesViewProps`: `{ data: RequestNotesViewData; title?: string; emptyTitle?: string; emptyDescription?: string }`

**2. `src/modules/shared/features/request-notes/requestNotesMapper.ts`**
- Move `normalizeNotesFromApi` helper from UC01's NotesTab
- Export `mapMeetingToRequestNotes(meeting, status)` → `RequestNotesViewData`
- Handles: content_officer_notes, scheduling_officer_note, general_notes, rejection/cancellation reasons
- Export `mapContentRequestToRequestNotes(schedulingContentNote)` for UC05's simpler case

**3. `src/modules/shared/features/request-notes/RequestNotesView.tsx`**
- Move `NoteBlock` component and `noteConfig` from UC01's NotesTab
- Render notes list or empty state using consistent design tokens (`text-foreground`, `bg-muted`, etc.)

**4. `src/modules/shared/features/request-notes/index.ts`**
- Re-export all public types, view, and mappers

**5. `src/modules/shared/features/index.ts`**
- Add `export * from './request-notes'`

**6. `src/modules/UC01/features/PreviewMeeting/tabs/NotesTab.tsx`**
- Replace entire implementation with thin wrapper calling `mapMeetingToRequestNotes` + `<RequestNotesView />`

**7. `src/modules/UC02/features/meeting-detail/MeetingDetailPage.tsx`**
- Update the `request-notes` tab case to use the shared feature instead of importing from UC01

**8. `src/modules/UC05/features/content-request-detail/tabs/NotesTab.tsx`**
- Replace with thin wrapper calling `mapContentRequestToRequestNotes` + `<RequestNotesView />`

### Result
- Single source of truth for notes rendering and mapping
- UC01, UC02, UC05 all consume the same shared feature
- Follows established pattern (types → mapper → view → index)
- 8 files created/modified

