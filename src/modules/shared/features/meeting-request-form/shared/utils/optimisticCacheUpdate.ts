import type { QueryClient } from "@tanstack/react-query";

/**
 * Optimistically merge partial meeting data into both
 * ['meeting', id] and ['meeting-draft', id] query caches.
 *
 * This provides instant UI feedback on the detail page after each
 * step saves successfully in edit mode.
 */
export function optimisticMergeMeeting(
  queryClient: QueryClient,
  meetingId: string,
  patch: Record<string, unknown>,
) {
  const keys: unknown[][] = [
    ["meeting", meetingId],
    ["meeting-draft", meetingId],
    ["meeting", meetingId, "preview"],
  ];
  for (const key of keys) {
    queryClient.setQueryData<Record<string, unknown>>(
      key,
      (old) => {
        if (!old) return old;
        return { ...old, ...patch };
      },
    );
  }
}

/**
 * Build a flat patch from Step 1 form values that maps to MeetingApiResponse fields.
 */
export function buildStep1Patch(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  // Direct 1:1 mappings
  const directFields = [
    "meeting_title",
    "meeting_subject",
    "meeting_type",
    "meeting_classification",
    "meeting_sub_category",
    "meeting_justification",
    "related_topic",
    "deadline",
    "meeting_classification_type",
    "meeting_confidentiality",
    "meeting_channel",
    "meeting_location",
    "meeting_start_date",
    "meeting_end_date",
    "sector",
    "description",
    "note",
    "agenda_items",
  ] as const;

  for (const key of directFields) {
    if (key in data && data[key] !== undefined) {
      patch[key] = data[key];
    }
  }

  // Handle custom location: if OTHER was selected, the custom value becomes the location
  if (data.meeting_location === "OTHER" && data.meeting_location_custom) {
    patch.meeting_location = data.meeting_location_custom;
  }

  // Map boolean-like fields
  if (data.is_urgent !== undefined) {
    patch.is_urgent = data.is_urgent === "TRUE";
  }
  if (data.urgent_reason !== undefined) {
    patch.urgent_reason = data.urgent_reason;
  }
  if (data.is_on_behalf_of !== undefined) {
    patch.is_on_behalf_of = data.is_on_behalf_of === "TRUE";
  }

  // Meeting nature → is_sequential
  if (data.meeting_nature !== undefined) {
    patch.is_sequential = data.meeting_nature === "SEQUENTIAL" || data.meeting_nature === "PERIODIC";
  }

  // Meeting owner
  if (data.meeting_owner && typeof data.meeting_owner === "object") {
    const owner = data.meeting_owner as Record<string, unknown>;
    patch.meeting_owner_name =
      owner.displayName || owner.name || owner.username || "";
  }

  return patch;
}

/**
 * Build a patch from Step 2 content FormData.
 * We extract text fields; file uploads won't be in the cache.
 */
export function buildStep2Patch(
  formData: FormData,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  // Extract known text fields from the FormData
  const textFields = [
    "executive_summary",
    "general_notes",
    "content_officer_notes",
  ];

  for (const key of textFields) {
    const val = formData.get(key);
    if (val !== null && typeof val === "string") {
      patch[key] = val;
    }
  }

  // Objectives
  const objectives = formData.get("objectives");
  if (objectives && typeof objectives === "string") {
    try { patch.objectives = JSON.parse(objectives); } catch { /* skip */ }
  }

  // Minister support
  const ministerSupport = formData.get("minister_support");
  if (ministerSupport && typeof ministerSupport === "string") {
    try { patch.minister_support = JSON.parse(ministerSupport); } catch { /* skip */ }
  }

  return patch;
}

/**
 * Build a patch from Step 3 invitees data.
 */
export function buildStep3Patch(
  invitees: Record<string, unknown>[],
): Record<string, unknown> {
  return { invitees };
}
