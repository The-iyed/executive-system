/**
 * Editable fields utility for edit meeting form.
 * The API returns editable_fields (snake_case). Form uses camelCase.
 * A form field is editable only if its corresponding API field(s) are in editable_fields.
 * "Related" fields: some form fields depend on one API field (e.g. meeting_manager_id -> meeting_owner);
 * conditional fields (e.g. urgent_reason) are editable only when their parent API field is editable.
 */

/** Map: form field key (Step1) -> API field key(s) that control editability. All must be in editable_fields for the form field to be editable. */
const STEP1_FORM_TO_API_FIELDS: Record<string, string[]> = {
  meetingType: ['meeting_type'],
  meetingSubject: ['meeting_title', 'meeting_subject'],
  meetingDescription: ['meeting_description'],
  meetingReason: ['meeting_justification'],
  meetingCategory: ['meeting_classification'],
  meetingClassification1: ['meeting_classification_type'],
  meetingConfidentiality: ['meeting_confidentiality'],
  meetingChannel: ['meeting_channel'],
  sector: ['sector'],
  relatedTopic: ['related_topic'],
  dueDate: ['deadline'],
  is_on_behalf_of: ['is_on_behalf_of'],
  meeting_manager_id: ['meeting_owner'],
  is_urgent: ['is_urgent'],
  urgent_reason: ['is_urgent'],
  meetingAgenda: ['agenda_items'],
  notes: ['general_notes', 'general_note'],
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

/** Map: form field key (Step2) -> API field key(s) that control editability. */
const STEP2_FORM_TO_API_FIELDS: Record<string, string[]> = {
  presentation_files: ['attachments', 'presentation_files'],
  presentation_attachment_timing: ['presentation_attachment_timing'],
  additional_files: ['attachments', 'additional_files'],
};

/** Map: form field key (Step3) -> API field key(s) that control editability. */
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

/**
 * Returns whether the given form field is editable based on the API editable_fields list.
 * When editable_fields is missing or empty, all fields are considered editable (configurable).
 *
 * @param editableFields - API response editable_fields (snake_case array)
 * @param formFieldKey - Form field key (camelCase, e.g. meetingType, meeting_manager_id)
 * @returns true if the field can be edited
 */
export function isFormFieldEditable(
  editableFields: string[] | undefined | null,
  formFieldKey: string
): boolean {
  if (!editableFields || editableFields.length === 0) {
    return EDITABLE_SET_WHEN_EMPTY;
  }
  return isEditableForMap(editableFields, formFieldKey, STEP1_FORM_TO_API_FIELDS);
}

/**
 * Returns a map of Step1 form field keys to editable boolean.
 * Use this to pass disabled={!editableMap.meetingType} etc. to form controls.
 *
 * @param editableFields - API response editable_fields (snake_case array)
 * @returns Record<formFieldKey, boolean>
 */
export function getStep1EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP1_FORM_TO_API_FIELDS);
}

/**
 * Returns a map of Step2 form field keys to editable boolean.
 */
export function getStep2EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP2_FORM_TO_API_FIELDS);
}

/**
 * Returns a map of Step3 form field keys to editable boolean.
 */
export function getStep3EditableMap(
  editableFields: string[] | undefined | null
): Record<string, boolean> {
  return getEditableMap(editableFields, STEP3_FORM_TO_API_FIELDS);
}
