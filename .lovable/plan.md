

## Plan: Show "توثيق الاجتماع" tab for SCHEDULED, CLOSED, and CLOSED_PASS statuses

### Problem
Currently the "توثيق الاجتماع" tab only appears when status is `SCHEDULED`. For `CLOSED`, a different "التوجيهات" tab appears instead. The tab should be visible for all three statuses: مجدول (`SCHEDULED`), مغلق (`CLOSED`), and مغلق - تمرير (`CLOSED_PASS`).

### Changes to `useMeetingDetailPage.ts` (lines 262–269)

Update the tab logic:

```typescript
// Before:
if (meetingStatus === MeetingStatus.SCHEDULED) {
  const filtered = all.filter((t) => !TABS_HIDDEN_WHEN_SCHEDULED.includes(t.id));
  return [...filtered, { id: 'meeting-documentation', label: 'توثيق الاجتماع' }];
}
if (meetingStatus === MeetingStatus.CLOSED) {
  return [...all, { id: 'directives', label: 'التوجيهات' }];
}

// After:
if (meetingStatus === MeetingStatus.SCHEDULED) {
  const filtered = all.filter((t) => !TABS_HIDDEN_WHEN_SCHEDULED.includes(t.id));
  return [...filtered, { id: 'meeting-documentation', label: 'توثيق الاجتماع' }];
}
if (meetingStatus === MeetingStatus.CLOSED || meetingStatus === MeetingStatus.CLOSED_PASS) {
  return [...all, { id: 'meeting-documentation', label: 'توثيق الاجتماع' }];
}
```

Also update the auto-switch guard (line 275–276) to allow the tab for all three statuses:

```typescript
// Before:
else if (meetingStatus !== MeetingStatus.SCHEDULED && activeTab === 'meeting-documentation') setActiveTab('request-info');
else if (meetingStatus !== MeetingStatus.CLOSED && activeTab === 'directives') setActiveTab('request-info');

// After:
else if (![MeetingStatus.SCHEDULED, MeetingStatus.CLOSED, MeetingStatus.CLOSED_PASS].includes(meetingStatus) && activeTab === 'meeting-documentation') setActiveTab('request-info');
```

### Files changed

| File | Change |
|---|---|
| `useMeetingDetailPage.ts` | Show `meeting-documentation` tab for SCHEDULED, CLOSED, and CLOSED_PASS; remove old `directives` tab logic for CLOSED; update auto-switch guard |

