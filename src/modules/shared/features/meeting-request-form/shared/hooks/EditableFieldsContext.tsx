import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Maps parent fields to their dependent children.
 * If a parent is not editable, its children are also not editable.
 */
const FIELD_DEPENDENCIES: Record<string, string[]> = {
  meeting_type: ["sector"],
  meeting_channel: ["meeting_location", "meeting_location_custom"],
  meeting_location: ["meeting_location_custom"],
  is_urgent: ["urgent_reason"],
  is_on_behalf_of: ["meeting_owner_id"],
  meeting_classification: [
    "meeting_justification",
    "meeting_classification_type",
    "meeting_sub_category",
    "related_topic",
    "deadline",
  ],
  is_based_on_directive: [
    "directive_method",
    "directive_text",
    "previous_meeting_minutes_file_content",
  ],
  directive_method: ["directive_text", "previous_meeting_minutes_file_content"],
};

interface EditableFieldsContextValue {
  /** null = no restriction (all fields editable — new mode) */
  editableFields: Set<string> | null;
  /** Checks if a field is editable, considering parent-child relationships */
  isFieldEditable: (fieldName: string) => boolean;
}

const EditableFieldsContext = createContext<EditableFieldsContextValue>({
  editableFields: null,
  isFieldEditable: () => true,
});

interface EditableFieldsProviderProps {
  /** Array of editable field keys from the API. Pass null/undefined for new mode (all editable). */
  editableFields?: string[] | null;
  children: ReactNode;
}

/**
 * Resolves the full set of non-editable fields by traversing parent→child dependencies.
 * If a parent is locked, all its descendants are also locked.
 */
function resolveLockedFields(editableSet: Set<string>): Set<string> {
  const locked = new Set<string>();

  function lockDescendants(parent: string) {
    const children = FIELD_DEPENDENCIES[parent];
    if (!children) return;
    for (const child of children) {
      if (!locked.has(child)) {
        locked.add(child);
        lockDescendants(child);
      }
    }
  }

  // For each parent with dependencies, if the parent is not editable → lock all descendants
  for (const parent of Object.keys(FIELD_DEPENDENCIES)) {
    if (!editableSet.has(parent)) {
      lockDescendants(parent);
    }
  }

  return locked;
}

export function EditableFieldsProvider({ editableFields, children }: EditableFieldsProviderProps) {
  const value = useMemo<EditableFieldsContextValue>(() => {
    if (!editableFields) {
      return { editableFields: null, isFieldEditable: () => true };
    }

    const editableSet = new Set(editableFields);
    const lockedByDependency = resolveLockedFields(editableSet);

    const isFieldEditable = (fieldName: string): boolean => {
      // Explicitly not editable
      if (!editableSet.has(fieldName)) return false;
      // Locked because a parent is not editable
      if (lockedByDependency.has(fieldName)) return false;
      return true;
    };

    return { editableFields: editableSet, isFieldEditable };
  }, [editableFields]);

  return (
    <EditableFieldsContext.Provider value={value}>
      {children}
    </EditableFieldsContext.Provider>
  );
}

/**
 * Returns whether a specific field is editable.
 * In new-creation mode (no editable fields list), always returns true.
 */
export function useIsFieldEditable(fieldName: string): boolean {
  const { isFieldEditable } = useContext(EditableFieldsContext);
  return isFieldEditable(fieldName);
}

/**
 * Returns the raw context for advanced usage (e.g., checking multiple fields).
 */
export function useEditableFieldsContext() {
  return useContext(EditableFieldsContext);
}
