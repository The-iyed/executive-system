/**
 * Stub – editable-fields restrictions have been removed.
 * These hooks are kept as no-ops so existing field components compile without changes.
 */

/** Always returns true (field is editable). */
export function useIsFieldEditable(_fieldName: string): boolean {
  return true;
}

/** Always returns null context (no restrictions). */
export function useEditableFieldsContext() {
  return { editableFields: null, isFieldEditable: () => true };
}
