import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import { validateStep1BasicInfo, extractStep1BasicInfoErrors, isStep1BasicInfoFieldRequired } from '../schemas/step1BasicInfo.schema';
import { getStep1EditableMap } from '../utils';
import { MeetingLocation, isPresetMeetingLocation } from '../utils/constants';
import { EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES } from '@/modules/shared';
import { buildDraftBasicInfoFormData, submitDraftBasicInfo } from '../../../data';
import { useMeetingAgenda } from './useMeetingAgenda';

export type Step1ErrorKey = keyof Step1BasicInfoFormData;

const STEP1_DATE_TIME_FIELDS: Step1ErrorKey[] = [
  'meeting_start_date',
  'meeting_end_date',
];

interface UseStep1BasicInfoProps {
  draftId?: string;
  initialData?: Partial<Step1BasicInfoFormData>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  editableFields?: string[] | null;
}

export interface SubmitStep1BasicInfoPayload {
  formData: Partial<Step1BasicInfoFormData>;
  isDraft: boolean;
  draftId?: string;
}

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
    /** سرية الاجتماع: default عادي (non-confidential). */
    meetingConfidentiality: 'NORMAL',
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

  const [errors, setErrors] = useState<Partial<Record<Step1ErrorKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Step1ErrorKey, boolean>>>({});

  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

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

  const validationResult = useMemo(() => {
    return validateStep1BasicInfo(formData);
  }, [formData]);

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
      allFormFields.push(
        'meeting_start_date',
        'meeting_end_date'
      );

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
          validationResult as any,
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
    [validationResult, formData]
  );

  const isValidDateTime = useCallback((val: unknown): boolean => {
    if (val == null || typeof val !== 'string') return false;
    const s = String(val).trim();
    if (!s) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  }, []);

  const handleChange = useCallback(
    (field: keyof Step1BasicInfoFormData, value: any) => {
      if (field === 'meetingSubject') {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.meetingSubject;
          return next;
        });
      }
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
          if (EXTERNAL_MEETING_EXCLUDED_CATEGORY_VALUES.includes(prev.meetingCategory as any)) {
            newData.meetingCategory = '';
            setErrors((prevErrors) => {
              const newErrors = { ...prevErrors };
              delete newErrors.meetingCategory;
              return newErrors;
            });
          }
        }
        // Clear meeting classification when category is not Business Meetings (اجتماعات الأعمال)
        if (field === 'meetingCategory' && value !== 'BUSINESS') {
          newData.meetingClassification1 = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.meetingClassification1;
            return newErrors;
          });
        }
        // Clear meeting_location and location option when meeting channel is not PHYSICAL (حضوري)
        if (field === 'meetingChannel' && value !== 'PHYSICAL') {
          newData.meeting_location = '';
          newData.meeting_location_option = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.meeting_location;
            return newErrors;
          });
        }
        // Sync meeting_location when location dropdown changes (preset = fixed option, no free text)
        if (field === 'meeting_location_option') {
          newData.meeting_location = isPresetMeetingLocation(value) ? (value as string) : '';
        }
        return newData;
      });
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
      // Meeting date errors are shown only on Next (validateAll), not on blur
      if (!STEP1_DATE_TIME_FIELDS.includes(field)) {
        validateField(field, formData[field]);
      }
    },
    [formData, validateField]
  );

  const { handleAddAgenda, handleDeleteAgenda, handleUpdateAgenda } = useMeetingAgenda({
    agenda: formData.meetingAgenda ?? [],
    setFormData,
    setErrors,
    setTableErrors,
  });

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