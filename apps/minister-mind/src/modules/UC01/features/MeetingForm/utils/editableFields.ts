
const STEP1_FORM_TO_API_FIELDS: Record<string, string[]> = {
  meetingType: ['meeting_type'],
  meetingSubject: ['meeting_title', 'meeting_subject'],
  meetingDescription: ['meeting_description'],
  meetingReason: ['meeting_justification'],
  meetingCategory: ['meeting_classification'],
  meetingClassification1: ['meeting_classification_type'],
  meetingConfidentiality: ['meeting_confidentiality'],
  meetingChannel: ['meeting_channel'],
  meeting_location: ['meeting_location'],
  sector: ['sector'],
  relatedTopic: ['related_topic'],
  dueDate: ['deadline'],
  is_on_behalf_of: ['is_on_behalf_of'],
  meeting_manager_id: ['meeting_owner'],
  is_urgent: ['is_urgent'],
  urgent_reason: ['is_urgent'],
  meetingAgenda: ['agenda_items'],
  notes: ['note', 'general_notes', 'general_note'],
  is_based_on_directive: ['is_based_on_directive'],
  directive_method: ['directive_method'],
  directive_text: ['directive_text'],
  previous_meeting_minutes_file: ['previous_meeting_minutes_file'],
  meeting_start_date: ['meeting_start_date'],
  meeting_end_date: ['meeting_end_date'],
  alternative_1_start_date: ['alternative_1_start_date'],
  alternative_1_end_date: ['alternative_1_end_date'],
  alternative_2_start_date: ['alternative_2_start_date'],
  alternative_2_end_date: ['alternative_2_end_date'],
};

const STEP2_FORM_TO_API_FIELDS: Record<string, string[]> = {
  presentation_files: ['attachments', 'presentation_files'],
  presentation_attachment_timing: ['presentation_attachment_timing'],
  additional_files: ['attachments', 'additional_files'],
};

const STEP3_FORM_TO_API_FIELDS: Record<string, string[]> = {
  invitees: ['invitees'],
};

const EDITABLE_SET_WHEN_EMPTY = true;

function isEditableForMap(
  editableFields: string[] | undefined | null,
  formFieldKey: string,
  formToApiMap: Record<string, string[]>
): boolean {
  if (!editableFields || editableFields.length === 0) {
    return EDITABLE_SET_WHEN_EMPTY;
  }
  const apiKeys = formToApiMap[formFieldKey];
  if (!apiKeys || apiKeys.length === 0) {
    return EDITABLE_SET_WHEN_EMPTY;
  }
  const set = new Set(editableFields);
  return apiKeys.some((apiKey) => set.has(apiKey));
}

function getEditableMap(
  editableFields: string[] | undefined | null,
  formToApiMap: Record<string, string[]>
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const key of Object.keys(formToApiMap) as string[]) {
    map[key] = isEditableForMap(editableFields, key, formToApiMap);
  }
  return map;
}

export function isFormFieldEditable(
  editableFields: string[] | undefined | null,
  formFieldKey: string
): boolean {
  if (!editableFields || editableFields.length === 0) {
    return EDITABLE_SET_WHEN_EMPTY;
  }
  return isEditableForMap(editableFields, formFieldKey, STEP1_FORM_TO_API_FIELDS);
}

export function getStep1EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP1_FORM_TO_API_FIELDS);
}

export function getStep2EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP2_FORM_TO_API_FIELDS);
}

export function getStep3EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP3_FORM_TO_API_FIELDS);
}