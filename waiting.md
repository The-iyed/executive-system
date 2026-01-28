# Waiting List Feature - Frontend Implementation Guide

## Overview

This document provides comprehensive guidance for implementing the waiting list functionality in the frontend application. The waiting list feature allows scheduling officers to manage requests that cannot be immediately scheduled, with automatic return to submitters after a configured duration.

## Business Requirements

### Requirement 9: Cancel from Waiting List
When a request is in the waiting list (WAITING status), the scheduling officer has **limited actions**:
- ✅ Can schedule the request later
- ✅ Can cancel the request
- ❌ **Cannot** transfer to any functional role (consultation, guidance, content)
- ❌ **Cannot** perform any other transfer actions

### Requirement 10: Automatic Return to Submitter
- After **Z hours** (default: 24 hours) from adding a request to the waiting list, the system automatically moves it from WAITING → READY
- The submitter receives the request back in READY status
- If the submitter wants to keep it in the waiting list, they can resubmit it
- When resubmitted, the timer resets and starts counting again from zero
- This cycle can continue indefinitely if the submitter keeps resubmitting

## User Roles and Permissions

### Scheduling Officer
- **Permission Required**: `scheduling:cancel_from_waiting_list`
- **Actions Available**:
  - View waiting list requests
  - Schedule from waiting list
  - Cancel from waiting list
  - See time remaining before automatic return

### Submitter
- **Permission Required**: `meeting_request:resubmit_from_ready`
- **Actions Available**:
  - View requests in READY status
  - Resubmit to waiting list (resets timer)
  - See notification explaining why request was returned

## API Endpoints

### 1. Cancel from Waiting List

**Endpoint**: `POST /api/scheduling/{meeting_id}/cancel-from-waiting-list`

**Authentication**: Bearer token required

**Permission**: `scheduling:cancel_from_waiting_list`

**Request Body**:
```json
{
  "notes": "Optional cancellation notes"
}
```

**Response**: 
- Status Code: `200 OK`
- Body: `MeetingRequestResponse` object
- The `status` field will be `"CANCELLED"`
- The `waiting_list_added_at` field will be `null`

**Error Responses**:
- `400 Bad Request`: Request is not in WAITING status
- `403 Forbidden`: User lacks required permission
- `404 Not Found`: Meeting request not found

### 2. Get Waiting List

**Endpoint**: `GET /api/scheduling/waiting-list`

**Authentication**: Bearer token required

**Permission**: `meeting_request:read:all`

**Query Parameters**:
- `search` (optional): Search term for meeting title, request number, or meeting subject
- `skip` (default: 0): Pagination offset
- `limit` (default: 100, max: 1000): Number of records per page

**Response**:
- Status Code: `200 OK`
- Body: `PaginatedResponse<MeetingRequestResponse>`
- Each request includes `waiting_list_added_at` timestamp (ISO 8601 format)

### 3. Resubmit from Ready

**Endpoint**: `POST /api/meeting-requests/{meeting_request_id}/resubmit-from-ready`

**Authentication**: Bearer token required

**Permission**: `meeting_request:resubmit_from_ready`

**Request Body**:
```json
{
  "notes": "Optional resubmission notes"
}
```

**Response**:
- Status Code: `200 OK`
- Body: `MeetingRequestResponse` object
- The `status` field will be `"WAITING"`
- The `waiting_list_added_at` field will be set to current timestamp

**Error Responses**:
- `400 Bad Request`: Request is not in READY status, or user is not the submitter
- `403 Forbidden`: User lacks required permission
- `404 Not Found`: Meeting request not found

## Data Structure

### MeetingRequestResponse - New Field

The `MeetingRequestResponse` object now includes:

**`waiting_list_added_at`**: `string | null`
- ISO 8601 formatted datetime string
- `null` when request is not in waiting list
- Set when request enters WAITING status
- Cleared when request is cancelled or scheduled

**Example**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "WAITING",
  "waiting_list_added_at": "2026-01-25T10:00:00Z",
  "meeting_title": "Quarterly Review Meeting",
  // ... other fields
}
```

## User Flows

### Flow 1: Scheduling Officer - Cancel from Waiting List

1. **View Waiting List**
   - Scheduling officer navigates to waiting list dashboard
   - Sees list of requests in WAITING status
   - Each request shows time remaining before automatic return

2. **Cancel Request**
   - Scheduling officer clicks "Cancel" button on a WAITING request
   - System shows confirmation dialog
   - Officer can optionally add cancellation notes
   - On confirmation, system sends cancel request
   - Request status changes to CANCELLED
   - Request is removed from waiting list view

3. **Visual Feedback**
   - Success message: "Request cancelled successfully"
   - Request disappears from waiting list
   - Request appears in cancelled requests list (if applicable)

### Flow 2: Automatic Return to Submitter

1. **System Action** (Background)
   - After 24 hours (configurable), system automatically moves request from WAITING → READY
   - This happens via background job, no user action required

2. **Submitter View**
   - Submitter sees request in READY status
   - Clear notification/alert explains: "This request was automatically returned to you after 24 hours in the waiting list"
   - Submitter sees "Resubmit to Waiting List" button

3. **Resubmit Decision**
   - If submitter clicks "Resubmit":
     - Request moves back to WAITING status
     - Timer resets to 24 hours
     - Request returns to scheduling officer's waiting list
   - If submitter does nothing:
     - Request remains in READY status
     - No automatic action occurs

### Flow 3: Scheduling Officer - Schedule from Waiting List

1. **View Waiting List**
   - Scheduling officer sees request in WAITING status
   - Can see time remaining before automatic return

2. **Schedule Request**
   - Scheduling officer clicks "Schedule" button
   - Normal scheduling flow proceeds
   - Request moves to SCHEDULED status
   - Request removed from waiting list

## UI/UX Requirements

### Waiting List Dashboard (Scheduling Officer)

#### Table/List View
- **Columns to Display**:
  - Request Number
  - Request Date (created_at)
  - Submitter Name
  - Meeting Title
  - Classification
  - **Time Remaining** (NEW - critical field)
  - Status Badge (WAITING)

#### Time Remaining Display
- **Format**: "Xh Ym remaining" (e.g., "23h 45m remaining")
- **Color Coding**:
  - Green: > 12 hours remaining
  - Yellow/Orange: 6-12 hours remaining
  - Red: < 6 hours remaining
  - Gray: "Expired - Will be returned to submitter" (if time has passed)
- **Update Frequency**: Update every minute (real-time countdown)
- **Icon**: Clock icon next to time remaining

#### Action Buttons for WAITING Status
- **Schedule Button**
  - Primary button style
  - Opens scheduling dialog/form
  - Only action that moves request forward

- **Cancel Button**
  - Warning/danger button style (red or orange)
  - Shows confirmation dialog before action
  - Confirmation message: "Are you sure you want to cancel this request? This action cannot be undone."

#### Hidden Actions for WAITING Status
The following buttons/actions should **NOT** be visible for WAITING status:
- ❌ Return to submitter
- ❌ Request consultation
- ❌ Request guidance
- ❌ Send to content
- ❌ Any other transfer/forward actions

#### Status Badge
- **WAITING Status**: Orange/yellow badge
- **Text**: "قيد الانتظار" (Arabic) or "Waiting" (English)

### Submitter Dashboard - READY Status

#### Alert/Notification
- **Type**: Informational alert (blue/info style)
- **Title**: "Request Returned to You"
- **Message**: 
  - "This request was automatically returned to you after 24 hours in the waiting list."
  - "If you want to keep it in the waiting list, click 'Resubmit to Waiting List'."
  - "The timer will reset and start counting again."

#### Action Button
- **Resubmit to Waiting List Button**
  - Primary button style
  - Icon: Send/Arrow icon
  - Text: "Resubmit to Waiting List" or "إرسال إلى قائمة الانتظار"
  - On click: Shows confirmation (optional) then submits

#### Status Badge
- **READY Status**: Blue badge
- **Text**: "جاهز" (Arabic) or "Ready" (English)

## State Management Considerations

### Real-Time Updates
- **Polling**: Consider polling the waiting list endpoint every 30-60 seconds to detect status changes
- **WebSocket** (if available): Subscribe to status change events for real-time updates
- **Manual Refresh**: Provide refresh button for users to manually update

### Timer Management
- **Client-Side Timer**: Calculate time remaining on client side for smooth countdown
- **Server Sync**: Periodically sync with server to ensure accuracy
- **Handle Edge Cases**:
  - Request expires while user is viewing it
  - Request is cancelled/scheduled by another user
  - Network disconnection during countdown

### Caching Strategy
- Cache waiting list data with appropriate TTL
- Invalidate cache when:
  - User performs an action (cancel, schedule)
  - Timer expires
  - Status changes detected

## Error Handling

### Common Error Scenarios

#### 1. Request Not in WAITING Status
- **Error**: "Meeting request must be in WAITING status to cancel from waiting list"
- **User Action**: 
  - Show error message
  - Refresh request data
  - Update UI to reflect current status

#### 2. Permission Denied
- **Error**: `403 Forbidden`
- **User Action**:
  - Hide cancel button if user lacks permission
  - Show appropriate message if user tries to access

#### 3. Request Already Processed
- **Scenario**: Another user cancelled/scheduled the request
- **User Action**:
  - Show notification: "This request has been updated by another user"
  - Refresh request data
  - Update UI accordingly

#### 4. Network Errors
- **User Action**:
  - Show retry button
  - Maintain optimistic UI updates where appropriate
  - Rollback on failure

## Validation Rules

### Cancel Action
- Only available when `status === "WAITING"`
- Requires `scheduling:cancel_from_waiting_list` permission
- Notes field is optional

### Resubmit Action
- Only available when `status === "READY"`
- Only submitter can resubmit (validate `submitter_id === current_user.id`)
- Notes field is optional

## Testing Checklist

### Scheduling Officer Actions
- [ ] Can view waiting list with all WAITING requests
- [ ] Time remaining displays correctly for each request
- [ ] Timer updates every minute
- [ ] Can see Schedule button for WAITING requests
- [ ] Can see Cancel button for WAITING requests
- [ ] Cannot see transfer buttons (consultation, guidance, content) for WAITING requests
- [ ] Cancel button shows confirmation dialog
- [ ] Cancel action successfully moves request to CANCELLED status
- [ ] Request disappears from waiting list after cancel
- [ ] Error handling works when request status changes unexpectedly

### Submitter Actions
- [ ] Can see requests in READY status
- [ ] Alert/notification displays explaining READY status
- [ ] Can see Resubmit button for READY requests
- [ ] Resubmit successfully moves request back to WAITING
- [ ] Timer resets after resubmit
- [ ] Cannot resubmit requests that are not in READY status
- [ ] Cannot resubmit requests that belong to other submitters

### Automatic Transitions
- [ ] UI updates when request automatically moves from WAITING to READY
- [ ] Timer shows "Expired" when time is up
- [ ] Submitter receives notification when request returns
- [ ] Real-time updates work correctly (polling or WebSocket)

### Edge Cases
- [ ] Multiple users viewing same request
- [ ] Request expires while user is viewing it
- [ ] Network disconnection during countdown
- [ ] Permission changes during session
- [ ] Very long waiting times (days/weeks)

## Configuration

### Waiting List Duration
- **Default**: 24 hours
- **Source**: Backend constant `BusinessLimits.WAITING_LIST_DURATION_HOURS`
- **Frontend**: Should use this value from backend or default to 24 hours
- **Display**: Show in user-friendly format (hours and minutes)

### Time Zone Considerations
- All timestamps are in UTC
- Convert to user's local timezone for display
- Ensure countdown calculations account for timezone differences

## Accessibility Requirements

### Visual Indicators
- Timer must be readable with sufficient contrast
- Color coding should have text alternatives
- Status badges should have ARIA labels

### Keyboard Navigation
- All action buttons must be keyboard accessible
- Confirmation dialogs must be keyboard navigable
- Focus management for modal dialogs

### Screen Readers
- Announce status changes
- Announce timer updates (optional, may be too frequent)
- Announce action confirmations

## Performance Considerations

### Large Lists
- Implement pagination for waiting list
- Virtual scrolling for very long lists
- Lazy loading of request details

### Timer Performance
- Use efficient timer implementation (requestAnimationFrame or similar)
- Avoid memory leaks from multiple timers
- Clean up timers when components unmount

## Integration Points

### Navigation
- Add "Waiting List" menu item for scheduling officers
- Add "Ready Requests" section for submitters
- Breadcrumb navigation for request details

### Notifications
- Notify scheduling officer when request is about to expire (optional enhancement)
- Notify submitter when request returns to READY
- Notify scheduling officer when request is resubmitted

### Audit Trail
- All actions are logged in backend
- Frontend should display action history if available
- Show who performed each action and when

## Support and Troubleshooting

### Common Issues

1. **Timer not updating**
   - Check if component is mounted
   - Verify timer cleanup on unmount
   - Check for JavaScript errors in console

2. **Actions not working**
   - Verify user permissions
   - Check network requests in browser dev tools
   - Verify request status matches action requirements

3. **Status not updating**
   - Check polling/WebSocket connection
   - Verify cache invalidation
   - Check for backend errors

### Debug Information
- Log all API requests/responses in development
- Display request status and permissions in debug mode
- Show waiting_list_added_at timestamp in request details

## Future Enhancements (Optional)

These are potential future improvements, not required for initial implementation:

1. **Expiration Warnings**
   - Show warning when request is 1 hour away from expiration
   - Send notification to scheduling officer

2. **Bulk Actions**
   - Allow cancelling multiple requests at once
   - Batch operations for efficiency

3. **Statistics Dashboard**
   - Show average time in waiting list
   - Show number of requests expiring soon
   - Show resubmission rates

4. **Custom Duration**
   - Allow scheduling officer to set custom expiration time per request
   - Override default 24-hour duration

## Questions or Issues?

For technical questions or implementation issues, contact:
- Backend API documentation
- Development team lead
- Product owner for business rule clarifications

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-25  
**Related Documents**: 
- `WAITING_LIST_IMPLEMENTATION_SUMMARY.md` (Backend implementation details)
- `WAITING_LIST_FRONTEND_IMPLEMENTATION.md` (Previous version with code examples)
