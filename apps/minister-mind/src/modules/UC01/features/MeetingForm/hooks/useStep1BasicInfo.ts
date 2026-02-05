import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import { validateStep1BasicInfo, extractStep1BasicInfoErrors, isStep1BasicInfoFieldRequired } from '../schemas/step1BasicInfo.schema';
import { getWeekStart, getWeekEnd } from '../utils';
import { getDraftAvailableTimeSlots } from '../../../data/calendarApi';
import { patchDraftScheduling, buildDraftBasicInfoFormData, submitDraftBasicInfo } from '../../../data';

export interface Step1SchedulingState {
  selected_time_slot_id: string | null;
  alternative_time_slot_id_1: string | null;
  alternative_time_slot_id_2: string | null;
}

export type Step1ErrorKey = keyof Step1BasicInfoFormData | 'selected_time_slot_id';

export type TimeSlotField = 'main' | 'alt1' | 'alt2';

interface UseStep1BasicInfoProps {
  draftId?: string;
  initialData?: Partial<Step1BasicInfoFormData>;
  initialScheduling?: Partial<Step1SchedulingState>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
}

export interface SubmitStep1BasicInfoPayload {
  formData: Partial<Step1BasicInfoFormData>;
  isDraft: boolean;
  draftId?: string;
  timeSlots?: {
    selected_time_slot_id?: string | null;
    alternative_time_slot_id_1?: string | null;
    alternative_time_slot_id_2?: string | null;
  };
}

/** Validates form, builds FormData via data layer, submits draft basic-info. */
async function submitStep1BasicInfoData(
  payload: SubmitStep1BasicInfoPayload,
  isEditMode: boolean
): Promise<string> {
  const { formData, isDraft, draftId, timeSlots } = payload;

  if (!isDraft) {
    const result = validateStep1BasicInfo(formData);
    if (!result.success) {
      const err = new Error('Validation failed');
      (err as Error & { validationErrors: unknown }).validationErrors = result.error;
      throw err;
    }
  }

  const fd = buildDraftBasicInfoFormData(formData);
  return submitDraftBasicInfo({ formData: fd, draftId, timeSlots, isEditMode });
}

export const useStep1BasicInfo = ({
  draftId,
  initialData,
  initialScheduling,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep1BasicInfoProps = {}) => {
  const [formData, setFormData] = useState<Partial<Step1BasicInfoFormData>>({
    meetingAgenda: [],
    is_urgent: false,
    is_on_behalf_of: false,
    is_based_on_directive: false,
    ...initialData,
  });

  // Time slots (required when draftId exists and not urgent)
  const [selected_time_slot_id, setSelectedTimeSlotId] = useState<string | null>(
    initialScheduling?.selected_time_slot_id ?? null
  );
  const [alternative_time_slot_id_1, setAlternativeTimeSlotId1] = useState<string | null>(
    initialScheduling?.alternative_time_slot_id_1 ?? null
  );
  const [alternative_time_slot_id_2, setAlternativeTimeSlotId2] = useState<string | null>(
    initialScheduling?.alternative_time_slot_id_2 ?? null
  );

  // Update form data when initialData changes (edit mode or create flow after refresh when draft is fetched)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Sync time slot state from initialScheduling when draft is loaded
  useEffect(() => {
    if (initialScheduling) {
      if (initialScheduling.selected_time_slot_id != null) setSelectedTimeSlotId(initialScheduling.selected_time_slot_id);
      if (initialScheduling.alternative_time_slot_id_1 != null) setAlternativeTimeSlotId1(initialScheduling.alternative_time_slot_id_1);
      if (initialScheduling.alternative_time_slot_id_2 != null) setAlternativeTimeSlotId2(initialScheduling.alternative_time_slot_id_2);
    }
  }, [initialScheduling?.selected_time_slot_id, initialScheduling?.alternative_time_slot_id_1, initialScheduling?.alternative_time_slot_id_2]);

  // Clear time slots when meeting is urgent
  useEffect(() => {
    if (formData.is_urgent === true) {
      setSelectedTimeSlotId(null);
      setAlternativeTimeSlotId1(null);
      setAlternativeTimeSlotId2(null);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.selected_time_slot_id;
        return next;
      });
    }
  }, [formData.is_urgent]);

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const showTimeSlots = formData.is_urgent !== true;

  const startDateStr = useMemo(() => {
    const d = weekStart;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [weekStart]);
  const endDateStr = useMemo(() => {
    const d = weekEnd;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [weekEnd]);

  const queryClient = useQueryClient();
  const timeSlotsQueryKey = ['draft-available-time-slots', startDateStr, endDateStr];

  // Prefetch time slots on step 1 when not urgent (no draftId required)
  useEffect(() => {
    if (!showTimeSlots) return;
    queryClient.prefetchQuery({
      queryKey: timeSlotsQueryKey,
      queryFn: () => getDraftAvailableTimeSlots(),
    });
  }, [showTimeSlots, startDateStr, endDateStr, queryClient]);

  const { data: slotsData = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: timeSlotsQueryKey,
    queryFn: () => getDraftAvailableTimeSlots(),
    enabled: showTimeSlots,
  });

  const calendarEvents = useMemo(
    () =>
      slotsData.map((slot) => {
        const startDate = new Date(slot.slot_start);
        const endDate = new Date(slot.slot_end);
        const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        return {
          id: slot.id,
          date: startDate,
          startTime,
          endTime,
          is_available: slot.is_available,
        };
      }),
    [slotsData]
  );

  const schedulingMutation = useMutation({
    mutationFn: ({ dId, payload }: { dId: string; payload: Parameters<typeof patchDraftScheduling>[1] }) =>
      patchDraftScheduling(dId, payload),
    onError: (err) => {
      onError?.(err instanceof Error ? err : new Error('فشل حفظ المواعيد'));
    },
  });

  const slotOptions = useMemo(() => {
    return calendarEvents
      .filter((e) => e.is_available)
      .map((event) => {
        const d = event.date;
        const dateLabel = d.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const label = `${dateLabel} ${event.startTime}–${event.endTime}`;
        return { value: event.id, label };
      });
  }, [calendarEvents]);

  const [errors, setErrors] = useState<Partial<Record<Step1ErrorKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Step1ErrorKey, boolean>>>({});

  const persistScheduling = useCallback(
    (main: string | null, alt1: string | null, alt2: string | null) => {
      if (!draftId) return;
      const payload: Parameters<typeof patchDraftScheduling>[1] = {};
      if (main) payload.selected_time_slot_id = main;
      if (alt1 && alt1 !== main) payload.alternative_time_slot_id_1 = alt1;
      if (alt2 && alt2 !== main && alt2 !== alt1) payload.alternative_time_slot_id_2 = alt2;
      if (Object.keys(payload).length > 0) schedulingMutation.mutate({ dId: draftId, payload });
    },
    [draftId, schedulingMutation]
  );

  const clearTimeSlotError = useCallback(() => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.selected_time_slot_id;
      return next;
    });
  }, []);

  const markTimeSlotTouched = useCallback((field: TimeSlotField) => {
    if (field === 'main') {
      setTouched((prev) => ({ ...prev, selected_time_slot_id: true }));
    }
  }, []);

  const handleTimeSlotChange = useCallback(
    (field: TimeSlotField, value: string) => {
      clearTimeSlotError();
      markTimeSlotTouched(field);
      if (field === 'main') {
        if (!value) {
          setSelectedTimeSlotId(null);
          setAlternativeTimeSlotId1(null);
          setAlternativeTimeSlotId2(null);
          return;
        }
        const nextAlt1 = alternative_time_slot_id_1 === value ? null : alternative_time_slot_id_1;
        const nextAlt2 = alternative_time_slot_id_2 === value ? null : alternative_time_slot_id_2;
        setSelectedTimeSlotId(value);
        setAlternativeTimeSlotId1(nextAlt1);
        setAlternativeTimeSlotId2(nextAlt2);
        persistScheduling(value, nextAlt1, nextAlt2);
      } else if (field === 'alt1') {
        if (!value || value === selected_time_slot_id) {
          setAlternativeTimeSlotId1(null);
          persistScheduling(selected_time_slot_id, null, alternative_time_slot_id_2);
          return;
        }
        const nextAlt2 = value === alternative_time_slot_id_2 ? null : alternative_time_slot_id_2;
        setAlternativeTimeSlotId1(value);
        setAlternativeTimeSlotId2(nextAlt2);
        persistScheduling(selected_time_slot_id, value, nextAlt2);
      } else {
        if (!value || value === selected_time_slot_id || value === alternative_time_slot_id_1) {
          setAlternativeTimeSlotId2(null);
          persistScheduling(selected_time_slot_id, alternative_time_slot_id_1, null);
          return;
        }
        setAlternativeTimeSlotId2(value);
        persistScheduling(selected_time_slot_id, alternative_time_slot_id_1, value);
      }
    },
    [
      selected_time_slot_id,
      alternative_time_slot_id_1,
      alternative_time_slot_id_2,
      persistScheduling,
      clearTimeSlotError,
      markTimeSlotTouched,
    ]
  );

  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  // React Query mutation for submitting step 1
  const submitMutation = useMutation({
    mutationFn: (payload: SubmitStep1BasicInfoPayload) => submitStep1BasicInfoData(payload, isEditMode),
    onSuccess: (newDraftId) => {
      onSuccess?.(newDraftId);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
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

  // Validate all fields (including time slot when applicable)
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
        'sector',
        'notes',
        'is_urgent',
        'is_on_behalf_of',
        'is_based_on_directive',
      ];
      if (showTimeSlots) allFormFields.push('selected_time_slot_id');

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
        return allTouched;
      };

      if (!validationResult.success) {
        const { formErrors, tableErrors: extractedTableErrors } = extractStep1BasicInfoErrors(
          validationResult,
          formData
        );
        // Include time slot error when required and empty (same check as other required fields)
        const errorsToSet =
          showTimeSlots && !selected_time_slot_id
            ? { ...formErrors, selected_time_slot_id: 'اختر الموعد الرئيسي للاجتماع' }
            : formErrors;
        setErrors(errorsToSet);
        setTableErrors(extractedTableErrors);
        if (markTouched) {
          setTouched((prev) => ({ ...prev, ...buildTouched(), selected_time_slot_id: true }));
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
            const timeSlotEl = document.querySelector('[data-time-slot-error]');
            if (timeSlotEl && showTimeSlots && !selected_time_slot_id) {
              timeSlotEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              document.querySelector('[data-error-field]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) ??
                document.querySelector('[data-form-container]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
        return false;
      }

      // Form valid – check time slot when required (same pattern as other fields: set error + mark touched)
      if (showTimeSlots && !selected_time_slot_id) {
        setErrors((prev) => ({ ...prev, selected_time_slot_id: 'مطلوب – اختر الموعد الرئيسي للاجتماع' }));
        if (markTouched) {
          setTouched((prev) => ({ ...prev, ...buildTouched(), selected_time_slot_id: true }));
        }
        setTimeout(() => {
          document.querySelector('[data-time-slot-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) ??
            document.querySelector('[data-form-container]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return false;
      }

      setErrors({});
      setTableErrors({});
      return true;
    },
    [validationResult, formData, showTimeSlots, selected_time_slot_id]
  );

  // Form field handlers
  const handleChange = useCallback(
    (field: keyof Step1BasicInfoFormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        // Clear urgent-related fields when is_urgent is false
        if (field === 'is_urgent' && value === false) {
          newData.urgent_reason = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.urgent_reason;
            return newErrors;
          });
        }
        // Clear time slot error when is_urgent is true
        if (field === 'is_urgent' && value === true) {
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.selected_time_slot_id;
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
        return newData;
      });
      // Validate field on change if it's been touched (like login form pattern)
      if (touched[field]) {
        validateField(field, value);
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: Step1ErrorKey) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (field === 'selected_time_slot_id') {
        if (showTimeSlots && !selected_time_slot_id) {
          setErrors((prev) => ({ ...prev, selected_time_slot_id: 'مطلوب – اختر الموعد الرئيسي للاجتماع' }));
        } else if (selected_time_slot_id) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.selected_time_slot_id;
            return next;
          });
        }
        return;
      }
      validateField(field, formData[field]);
    },
    [formData, validateField, showTimeSlots, selected_time_slot_id]
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
      // Validate if not draft (includes time slot when showTimeSlots) - sets errors and touched
      if (!isDraft && !validateAll(true)) {
        return null;
      }

      try {
        const newDraftId = await submitMutation.mutateAsync({
          formData,
          isDraft,
          draftId,
          timeSlots:
            showTimeSlots &&
            (selected_time_slot_id || alternative_time_slot_id_1 || alternative_time_slot_id_2)
              ? {
                  selected_time_slot_id: selected_time_slot_id || undefined,
                  alternative_time_slot_id_1: alternative_time_slot_id_1 || undefined,
                  alternative_time_slot_id_2: alternative_time_slot_id_2 || undefined,
                }
              : undefined,
        });
        return newDraftId;
      } catch (error: any) {
        // If validation error, extract and set errors
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
        // Error is also handled by mutation onError
        return null;
      }
    },
    [
      formData,
      draftId,
      showTimeSlots,
      selected_time_slot_id,
      alternative_time_slot_id_1,
      alternative_time_slot_id_2,
      validateAll,
      submitMutation,
    ]
  );

  // Helper to check if a field is required (form fields + time slot)
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
    // Time slots (step 1 scheduling)
    timeSlots: {
      selected_time_slot_id,
      alternative_time_slot_id_1,
      alternative_time_slot_id_2,
      slotOptions,
      isLoadingSlots,
      showTimeSlots,
    },
    handleSelectMainSlot: (v: string) => handleTimeSlotChange('main', v),
    handleSelectAlt1: (v: string) => handleTimeSlotChange('alt1', v),
    handleSelectAlt2: (v: string) => handleTimeSlotChange('alt2', v),
  };
};