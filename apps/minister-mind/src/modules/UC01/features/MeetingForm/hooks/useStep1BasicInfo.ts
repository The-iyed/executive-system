import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import { validateStep1BasicInfo, extractStep1BasicInfoErrors, isStep1BasicInfoFieldRequired } from '../schemas/step1BasicInfo.schema';
import { getStep1EditableMap, EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES } from '../utils';
import { buildDraftBasicInfoFormData, submitDraftBasicInfo } from '../../../data';

export type Step1ErrorKey = keyof Step1BasicInfoFormData;

const STEP1_DATE_TIME_FIELDS: Step1ErrorKey[] = [
  'meeting_start_date',
  'meeting_end_date',
  'alternative_1_start_date',
  'alternative_1_end_date',
  'alternative_2_start_date',
  'alternative_2_end_date',
];

interface UseStep1BasicInfoProps {
  draftId?: string;
  initialData?: Partial<Step1BasicInfoFormData>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  /** From get meeting details: list of API field names (snake_case) that are editable. Used to disable non-editable fields in edit. */
  editableFields?: string[] | null;
}

export interface SubmitStep1BasicInfoPayload {
  formData: Partial<Step1BasicInfoFormData>;
  isDraft: boolean;
  draftId?: string;
}

/** Validates form, builds FormData via data layer, submits draft basic-info. */
async function submitStep1BasicInfoData(
  payload: SubmitStep1BasicInfoPayload,
  isEditMode: boolean
): Promise<string> {
  const { formData, isDraft, draftId } = payload;

  if (!isDraft) {
    const result = validateStep1BasicInfo(formData);
    if (!result.success) {
      const err = new Error('Validation failed');
      (err as Error & { validationErrors: unknown }).validationErrors = result.error;
      throw err;
    }
  }

  const fd = buildDraftBasicInfoFormData(formData);
  return submitDraftBasicInfo({ formData: fd, draftId, isEditMode });
}

export const useStep1BasicInfo = ({
  draftId,
  initialData,
  onSuccess,
  onError,
  isEditMode = false,
  editableFields,
}: UseStep1BasicInfoProps = {}) => {
  const step1EditableMap = useMemo(
    () => getStep1EditableMap(editableFields ?? undefined),
    [editableFields]
  );
  const [formData, setFormData] = useState<Partial<Step1BasicInfoFormData>>({
    meetingAgenda: [],
    is_urgent: false,
    is_on_behalf_of: false,
    is_based_on_directive: false,
    ...initialData,
  });

  // Update form data when initialData changes (edit mode or create flow after refresh when draft is fetched)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Clear meeting date range (main + alternatives) when meeting is urgent
  useEffect(() => {
    if (formData.is_urgent === true) {
      setFormData((prev) => ({
        ...prev,
        meeting_start_date: '',
        meeting_end_date: '',
        alternative_1_start_date: '',
        alternative_1_end_date: '',
        alternative_2_start_date: '',
        alternative_2_end_date: '',
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.meeting_start_date;
        delete next.meeting_end_date;
        delete next.alternative_1_start_date;
        delete next.alternative_1_end_date;
        delete next.alternative_2_start_date;
        delete next.alternative_2_end_date;
        return next;
      });
    }
  }, [formData.is_urgent]);

  const showMeetingDates = formData.is_urgent !== true;

  const [errors, setErrors] = useState<Partial<Record<Step1ErrorKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Step1ErrorKey, boolean>>>({});

  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  // React Query mutation for submitting step 1
  const submitMutation = useMutation({
    mutationFn: (payload: SubmitStep1BasicInfoPayload) => submitStep1BasicInfoData(payload, isEditMode),
    onSuccess: (newDraftId) => {
      onSuccess?.(newDraftId);
    },
    onError: (error: unknown) => {
      const editStateMessage = 'لا يمكنك التعديل على هذا الاجتماع في حالته الحالية';
      let message = isEditMode ? editStateMessage : 'حدث خطأ أثناء الحفظ';

      if (!isEditMode) {
        if (error && typeof error === 'object') {
          const anyError = error as { detail?: unknown };
          if (typeof anyError.detail === 'string') message = anyError.detail;
        } else if (typeof error === 'string') {
          message = error;
        }
      }

      const err = error instanceof Error ? error : new Error(message);
      onError?.(err);
    },
  });

  // Validation with conditional rules
  const validationResult = useMemo(() => {
    return validateStep1BasicInfo(formData);
  }, [formData]);

  // Validate single field - similar to login form pattern
  const validateField = useCallback(
    (field: keyof Step1BasicInfoFormData, value: any) => {
      const updatedData = { ...formData, [field]: value };
      const result = validateStep1BasicInfo(updatedData);

      // Check if this specific field has an error
      const fieldError = result.success 
        ? null 
        : result.error.errors.find((err) => err.path[0] === field);

      if (!fieldError) {
        // Field is valid - clear the error
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      } else {
        // Field has an error - set it
        setErrors((prev) => ({
          ...prev,
          [field]: fieldError.message,
        }));
      }
    },
    [formData]
  );

  // Validate all fields (including meeting date range when applicable)
  const validateAll = useCallback(
    (markTouched: boolean = true): boolean => {
      const allFormFields: Step1ErrorKey[] = [
        'meetingSubject',
        'meetingType',
        'meetingCategory',
        'meetingReason',
        'relatedTopic',
        'dueDate',
        'meetingClassification1',
        'meetingClassification2',
        'meetingConfidentiality',
        'meetingChannel',
        'meeting_location',
        'sector',
        'notes',
        'is_urgent',
        'is_on_behalf_of',
        'is_based_on_directive',
      ];
      if (showMeetingDates) {
        allFormFields.push(
          'meeting_start_date',
          'meeting_end_date',
          'alternative_1_start_date',
          'alternative_1_end_date',
          'alternative_2_start_date',
          'alternative_2_end_date'
        );
      }

      const buildTouched = (): Partial<Record<Step1ErrorKey, boolean>> => {
        const allTouched: Partial<Record<Step1ErrorKey, boolean>> = {};
        allFormFields.forEach((field) => {
          allTouched[field] = true;
        });
        if (formData.is_urgent === true) allTouched.urgent_reason = true;
        if (formData.is_on_behalf_of === true) allTouched.meeting_manager_id = true;
        if (formData.is_based_on_directive === true) {
          allTouched.directive_method = true;
          if (formData.directive_method === 'PREVIOUS_MEETING') allTouched.previous_meeting_minutes_file = true;
          if (formData.directive_method === 'DIRECT_DIRECTIVE') allTouched.directive_text = true;
        }
        if (formData.meetingChannel === 'PHYSICAL') allTouched.meeting_location = true;
        return allTouched;
      };

      if (!validationResult.success) {
        const { formErrors, tableErrors: extractedTableErrors } = extractStep1BasicInfoErrors(
          validationResult,
          formData
        );
        setErrors(formErrors);
        setTableErrors(extractedTableErrors);
        if (markTouched) {
          setTouched((prev) => ({ ...prev, ...buildTouched() }));
          setTableTouched(
            Object.fromEntries(
              [
                ...(formData.meetingAgenda ?? []).map((a) => [
                  a.id,
                  { agenda_item: true, presentation_duration_minutes: true, minister_support_type: true, minister_support_other: true },
                ]),
              ] as [string, Record<string, boolean>][]
            )
          );
          setTimeout(() => {
            document.querySelector('[data-error-field]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) ??
              document.querySelector('[data-form-container]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
        return false;
      }

      setErrors({});
      setTableErrors({});
      return true;
    },
    [validationResult, formData, showMeetingDates]
  );

  const isValidDateTime = useCallback((val: unknown): boolean => {
    if (val == null || typeof val !== 'string') return false;
    const s = String(val).trim();
    if (!s) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  }, []);

  // Form field handlers
  const handleChange = useCallback(
    (field: keyof Step1BasicInfoFormData, value: any) => {
      // Clear meeting date/time errors first (outside setFormData) so they disappear on first select and form re-renders correctly
      if (STEP1_DATE_TIME_FIELDS.includes(field) && isValidDateTime(value)) {
        setErrors((prevErrors) => {
          const next = { ...prevErrors };
          delete next[field];
          if (field === 'meeting_start_date') delete next.meeting_end_date;
          return next;
        });
      }

      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        if (field === 'is_urgent' && value === false) {
          newData.urgent_reason = '';
          setErrors((prevErrors) => {
            const next = { ...prevErrors };
            delete next.urgent_reason;
            return next;
          });
          setTouched((prevTouched) => {
            const next = { ...prevTouched };
            delete next.urgent_reason;
            return next;
          });
        }
        // Clear meeting date errors when is_urgent is true
        if (field === 'is_urgent' && value === true) {
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.meeting_start_date;
            delete newErrors.meeting_end_date;
            delete newErrors.alternative_1_start_date;
            delete newErrors.alternative_1_end_date;
            delete newErrors.alternative_2_start_date;
            delete newErrors.alternative_2_end_date;
            return newErrors;
          });
        }
        // Clear meeting_manager_id when is_on_behalf_of is false
        if (field === 'is_on_behalf_of' && value === false) {
          newData.meeting_manager_id = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.meeting_manager_id;
            return newErrors;
          });
        }
        // Clear directive-related fields when is_based_on_directive is false
        if (field === 'is_based_on_directive' && value === false) {
          newData.directive_method = '';
          newData.previous_meeting_minutes_file = null;
          newData.directive_text = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.directive_method;
            delete newErrors.previous_meeting_minutes_file;
            delete newErrors.directive_text;
            return newErrors;
          });
        }
        // Clear previous_meeting_minutes_file when directive_method changes away from PREVIOUS_MEETING
        if (field === 'directive_method' && value !== 'PREVIOUS_MEETING') {
          newData.previous_meeting_minutes_file = null;
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previous_meeting_minutes_file;
            return newErrors;
          });
        }
        // Clear directive_text when directive_method changes away from DIRECT_DIRECTIVE
        if (field === 'directive_method' && value !== 'DIRECT_DIRECTIVE') {
          newData.directive_text = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.directive_text;
            return newErrors;
          });
        }
        // Clear meeting category when switching to EXTERNAL if current category is not allowed for external
        if (field === 'meetingType' && value === 'EXTERNAL' && prev.meetingCategory) {
          if (EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES.includes(prev.meetingCategory)) {
            newData.meetingCategory = '';
            setErrors((prevErrors) => {
              const newErrors = { ...prevErrors };
              delete newErrors.meetingCategory;
              return newErrors;
            });
          }
        }
        // Clear meeting_location when meeting channel is not PHYSICAL (حضوري)
        if (field === 'meetingChannel' && value !== 'PHYSICAL') {
          newData.meeting_location = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.meeting_location;
            return newErrors;
          });
        }
        return newData;
      });
      // Validate field on change if it's been touched (like login form pattern).
      // Skip validation for date/time fields when value is valid so we don't re-show "required" (e.g. end is set in next tick by start picker).
      if (touched[field]) {
        const skipValidation =
          STEP1_DATE_TIME_FIELDS.includes(field) && isValidDateTime(value);
        if (!skipValidation) {
          validateField(field, value);
        }
      }
    },
    [touched, validateField, isValidDateTime]
  );

  const handleBlur = useCallback(
    (field: Step1ErrorKey) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, formData[field]);
    },
    [formData, validateField]
  );

  // Table handlers - Agenda (includes minister support per requirement)
  const handleAddAgenda = useCallback(() => {
    const newAgenda = {
      id: nanoid(),
      agenda_item: '',
      presentation_duration_minutes: '',
      minister_support_type: '',
      minister_support_other: '',
    };
    setFormData((prev) => {
      const updatedAgenda = [newAgenda, ...(prev.meetingAgenda || [])];
      // Clear table-specific errors when adding a new item
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.meetingAgenda;
        return newErrors;
      });
      // Clear all table errors for meetingAgenda rows
      setTableErrors((prevTableErrors) => {
        const newTableErrors = { ...prevTableErrors };
        // Get all agenda IDs from updated agenda
        const agendaIds = updatedAgenda.map((a) => a.id);
        // Remove errors for all agenda rows
        agendaIds.forEach((id) => {
          delete newTableErrors[id];
        });
        return newTableErrors;
      });
      return {
        ...prev,
        meetingAgenda: updatedAgenda,
      };
    });
  }, []);

  const handleDeleteAgenda = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: (prev.meetingAgenda || []).filter((a) => a.id !== id),
    }));
  }, []);

  const handleUpdateAgenda = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: (prev.meetingAgenda || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
    // Clear error when field is updated
    if (value) {
      setTableErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[id]) {
          delete newErrors[id][field];
          if (Object.keys(newErrors[id]).length === 0) {
            delete newErrors[id];
          }
        }
        return newErrors;
      });
    }
  }, []);

  // Submit step
  const submitStep = useCallback(
    async (isDraft: boolean = false): Promise<string | null> => {
      if (!isDraft && !validateAll(true)) {
        return null;
      }

      try {
        const newDraftId = await submitMutation.mutateAsync({
          formData,
          isDraft,
          draftId,
        });
        return newDraftId;
      } catch (error: any) {
        if (error?.validationErrors) {
          const { formErrors, tableErrors: extractedTableErrors } = extractStep1BasicInfoErrors(
            {
              success: false,
              error: error.validationErrors,
            } as any,
            formData
          );
          setErrors(formErrors);
          setTableErrors(extractedTableErrors);
        }
        return null;
      }
    },
    [formData, draftId, validateAll, submitMutation]
  );

  // Helper to check if a field is required (form fields + meeting date range)
  const getIsFieldRequired = useCallback(
    (field: Step1ErrorKey) => {
      return isStep1BasicInfoFieldRequired(field, formData);
    },
    [formData]
  );

  return {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    isSubmitting: submitMutation.isPending,
    isLoading: submitMutation.isPending,
    isError: submitMutation.isError,
    isSuccess: submitMutation.isSuccess,
    error: submitMutation.error,
    isStep1BasicInfoFieldRequired: getIsFieldRequired,
    handleChange,
    handleBlur,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    validateAll,
    submitStep,
    step1EditableMap,
  };
};