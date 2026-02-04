import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import type { Step1BasicInfoFormData } from '../schemas/step1BasicInfo.schema';
import { validateStep1BasicInfo, extractStep1BasicInfoErrors, isStep1BasicInfoFieldRequired } from '../schemas/step1BasicInfo.schema';
import { getWeekStart, getWeekEnd } from '../utils';
import { getDraftAvailableTimeSlots } from '../../../data/calendarApi';
import { patchDraftScheduling } from '../../../data';

export interface Step1SchedulingState {
  selected_time_slot_id: string | null;
  alternative_time_slot_id_1: string | null;
  alternative_time_slot_id_2: string | null;
}

/** Keys that can have validation errors (form fields + time slot main) */
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

interface SubmitStep1BasicInfoPayload {
  formData: Partial<Step1BasicInfoFormData>;
  isDraft: boolean;
  draftId?: string;
  /** Time slots to send in the same request when creating/updating draft */
  timeSlots?: {
    selected_time_slot_id?: string | null;
    alternative_time_slot_id_1?: string | null;
    alternative_time_slot_id_2?: string | null;
  };
}

interface SubmitStep1BasicInfoResponse {
  id: string;
}


const prepareBasicInfoFormData = (formData: Partial<Step1BasicInfoFormData>): FormData => {
  const formDataToSend = new FormData();

  // Required fields
  if (formData.meetingSubject) {
    formDataToSend.append('meeting_title', formData.meetingSubject);
    formDataToSend.append('meeting_subject', formData.meetingSubject);
  }
  if (formData.meetingCategory) {
    formDataToSend.append('meeting_classification', formData.meetingCategory);
  }
  if (formData.meetingConfidentiality) {
    formDataToSend.append('meeting_confidentiality', formData.meetingConfidentiality);
  }

  // Optional fields
  if (formData.meetingType) {
    formDataToSend.append('meeting_type', formData.meetingType);
  }
  if (formData.meetingClassification1) {
    formDataToSend.append('meeting_classification_type', formData.meetingClassification1);
  }
  if (formData.meetingChannel && formData.meetingChannel !== '') {
    formDataToSend.append('meeting_channel', formData.meetingChannel);
  }
  if (formData.sector) {
    formDataToSend.append('sector', formData.sector);
  }
  if (formData.relatedTopic) {
    formDataToSend.append('related_topic', formData.relatedTopic);
  }
  if (formData.dueDate && formData.dueDate !== '') {
    const deadlineDate = new Date(formData.dueDate + 'T00:00:00');
    if (!isNaN(deadlineDate.getTime())) {
      formDataToSend.append('deadline', deadlineDate.toISOString());
    }
  }
  if (formData.meetingReason) {
    formDataToSend.append('meeting_justification', formData.meetingReason);
  }

  // JSON array fields - transform to backend format
  if (formData.meetingGoals && formData.meetingGoals.length > 0) {
    const objectives = formData.meetingGoals
      .map((g) => ({ objective: g.objective }))
      .filter((g) => g.objective && g.objective.trim() !== '');
    if (objectives.length > 0) {
      formDataToSend.append('objectives', JSON.stringify(objectives));
    }
  }
  if (formData.meetingAgenda && formData.meetingAgenda.length > 0) {
    const agendaItems = formData.meetingAgenda
      .map((a) => {
        const item: Record<string, unknown> = {
          agenda_item: a.agenda_item || '',
          presentation_duration_minutes: a.presentation_duration_minutes
            ? parseInt(String(a.presentation_duration_minutes), 10) || 0
            : 0,
        };
        if (a.minister_support_type && a.minister_support_type.trim() !== '') {
          item.minister_support_type = a.minister_support_type;
          if (a.minister_support_type === 'أخرى' && a.minister_support_other?.trim()) {
            item.minister_support_other = a.minister_support_other;
          }
        }
        return item;
      })
      .filter((a) => (a.agenda_item as string) && String(a.agenda_item).trim() !== '');
    if (agendaItems.length > 0) {
      formDataToSend.append('agenda_items', JSON.stringify(agendaItems));
    }
  }

  // Boolean
  formDataToSend.append(
    'topic_discussed_before',
    formData.wasDiscussedPreviously ? 'true' : 'false'
  );
  if (formData.is_urgent !== undefined) {
    formDataToSend.append('is_urgent', formData.is_urgent ? 'true' : 'false');
  }
  if (formData.is_on_behalf_of !== undefined) {
    formDataToSend.append('is_on_behalf_of', formData.is_on_behalf_of ? 'true' : 'false');
  }
  if (formData.is_based_on_directive !== undefined) {
    formDataToSend.append('is_based_on_directive', formData.is_based_on_directive ? 'true' : 'false');
  }

  // Date fields (ISO 8601 format)
  // Only send previousMeetingDate if wasDiscussedPreviously is true
  if (formData.wasDiscussedPreviously && formData.previousMeetingDate && formData.previousMeetingDate !== '') {
    const prevDate = new Date(formData.previousMeetingDate + 'T00:00:00');
    if (!isNaN(prevDate.getTime())) {
      formDataToSend.append('previous_meeting_date', prevDate.toISOString());
    }
  }

  // Related directives - format according to backend payload structure
  if (formData.relatedDirectives && formData.relatedDirectives.length > 0) {
    const directives = formData.relatedDirectives
      .map((d) => {
        const directive: any = {};
        
        if (d.directive && d.directive.trim() !== '') {
          directive.directive_text = d.directive;
        }
        if (d.previousMeeting && d.previousMeeting.trim() !== '') {
          directive.related_meeting = d.previousMeeting;
        }
        if (d.directiveDate && d.directiveDate !== '') {
          const directiveDate = new Date(d.directiveDate + 'T00:00:00');
          if (!isNaN(directiveDate.getTime())) {
            directive.directive_date = directiveDate.toISOString();
          }
        }
        if (d.directiveStatus && d.directiveStatus.trim() !== '') {
          directive.directive_status = d.directiveStatus;
        }
        if (d.dueDate && d.dueDate !== '') {
          const deadlineDate = new Date(d.dueDate + 'T00:00:00');
          if (!isNaN(deadlineDate.getTime())) {
            directive.deadline = deadlineDate.toISOString();
          }
        }
        if (d.responsible && d.responsible.trim() !== '') {
          directive.responsible_persons = d.responsible;
        }
        
        // Only include directive if it has at least one field
        return Object.keys(directive).length > 0 ? directive : null;
      })
      .filter(Boolean);
    
    if (directives.length > 0) {
      formDataToSend.append('related_directives', JSON.stringify(directives));
    }
  }

  // Notes
  if (formData.notes) {
    formDataToSend.append('general_notes', formData.notes);
  }

  // Urgent meeting fields
  if (formData.is_urgent && formData.urgent_reason) {
    formDataToSend.append('urgent_reason', formData.urgent_reason);
  }

  // On behalf of fields
  if (formData.is_on_behalf_of && formData.meeting_manager_id) {
    formDataToSend.append('meeting_manager_id', formData.meeting_manager_id);
  }

  // Directive fields
  if (formData.is_based_on_directive && formData.directive_method) {
    formDataToSend.append('directive_method', formData.directive_method);
  }
  if (formData.is_based_on_directive && formData.directive_method === 'PREVIOUS_MEETING' && formData.previous_meeting_minutes_id) {
    formDataToSend.append('previous_meeting_minutes_id', formData.previous_meeting_minutes_id);
  }

  return formDataToSend;
};

/**
 * Submits basic info and file (if exists) to API
 */
const submitStep1BasicInfoData = async (
  payload: SubmitStep1BasicInfoPayload,
  isEditMode: boolean = false
): Promise<string> => {
  const { formData, isDraft, draftId, timeSlots } = payload;

  // Validate if not draft
  if (!isDraft) {
    const validationResult = validateStep1BasicInfo(formData);
    if (!validationResult.success) {
      // Create a validation error with details
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const formDataToSend = prepareBasicInfoFormData(formData);

  // Append time slots to the same request when present
  if (timeSlots) {
    if (timeSlots.selected_time_slot_id) {
      formDataToSend.append('selected_time_slot_id', timeSlots.selected_time_slot_id);
    }
    if (timeSlots.alternative_time_slot_id_1) {
      formDataToSend.append('alternative_time_slot_id_1', timeSlots.alternative_time_slot_id_1);
    }
    if (timeSlots.alternative_time_slot_id_2) {
      formDataToSend.append('alternative_time_slot_id_2', timeSlots.alternative_time_slot_id_2);
    }
  }

  let response;
  if (isEditMode && draftId) {
    // Update existing draft using PATCH
    response = await axiosInstance.patch<SubmitStep1BasicInfoResponse>(
      `/api/meeting-requests/drafts/${draftId}/basic-info`,
      formDataToSend
    );
  } else {
    // Create new draft using POST
    response = await axiosInstance.post<SubmitStep1BasicInfoResponse>(
      '/api/meeting-requests/drafts/basic-info',
      formDataToSend
    );
  }

  const newDraftId = response.data?.id || draftId;
  if (!newDraftId) {
    throw new Error('Invalid response format: missing draft ID');
  }

  return newDraftId;
};

export const useStep1BasicInfo = ({
  draftId,
  initialData,
  initialScheduling,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep1BasicInfoProps = {}) => {
  const [formData, setFormData] = useState<Partial<Step1BasicInfoFormData>>({
    meetingGoals: [],
    meetingAgenda: [],
    relatedDirectives: [],
    wasDiscussedPreviously: false,
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
        'wasDiscussedPreviously',
        'previousMeetingDate',
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
          if (formData.directive_method === 'PREVIOUS_MEETING') allTouched.previous_meeting_minutes_id = true;
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
                ...(formData.meetingGoals ?? []).map((g) => [g.id, { objective: true }]),
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
        // Clear dependent fields and their errors when parent fields change
        if (field === 'wasDiscussedPreviously' && value === false) {
          newData.previousMeetingDate = '';
          const directiveIds = prev.relatedDirectives?.map((d) => d.id) || [];
          newData.relatedDirectives = [];
          // Clear errors for dependent fields
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previousMeetingDate;
            delete newErrors.relatedDirectives;
            return newErrors;
          });
          setTableErrors((prevTableErrors) => {
            const newTableErrors = { ...prevTableErrors };
            directiveIds.forEach((id) => {
              delete newTableErrors[id];
            });
            return newTableErrors;
          });
        }
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
          newData.previous_meeting_minutes_id = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.directive_method;
            delete newErrors.previous_meeting_minutes_id;
            return newErrors;
          });
        }
        // Clear previous_meeting_minutes_id when directive_method changes away from PREVIOUS_MEETING
        if (field === 'directive_method' && value !== 'PREVIOUS_MEETING') {
          newData.previous_meeting_minutes_id = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previous_meeting_minutes_id;
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

  // Table handlers - Goals
  const handleAddGoal = useCallback(() => {
    const newGoal = { id: nanoid(), objective: '' };
    setFormData((prev) => {
      const updatedGoals = [newGoal, ...(prev.meetingGoals || [])];
      // Clear table-specific errors when adding a new item
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.meetingGoals;
        return newErrors;
      });
      // Clear all table errors for meetingGoals rows
      setTableErrors((prevTableErrors) => {
        const newTableErrors = { ...prevTableErrors };
        // Get all goal IDs from updated goals
        const goalIds = updatedGoals.map((g) => g.id);
        // Remove errors for all goal rows
        goalIds.forEach((id) => {
          delete newTableErrors[id];
        });
        return newTableErrors;
      });
      return {
        ...prev,
        meetingGoals: updatedGoals,
      };
    });
  }, []);

  const handleDeleteGoal = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      meetingGoals: (prev.meetingGoals || []).filter((g) => g.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const handleUpdateGoal = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      meetingGoals: (prev.meetingGoals || []).map((g) =>
        g.id === id ? { ...g, [field]: value } : g
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

  // Table handlers - Directives
  const handleAddDirective = useCallback(() => {
    const newDirective = {
      id: nanoid(),
      directive: '',
      previousMeeting: '',
      directiveDate: '',
      directiveStatus: '',
      dueDate: '',
      responsible: '',
    };
    setFormData((prev) => {
      const updatedDirectives = [newDirective, ...(prev.relatedDirectives || [])];
      // Clear table-specific errors when adding a new item
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.relatedDirectives;
        return newErrors;
      });
      // Clear all table errors for relatedDirectives rows
      setTableErrors((prevTableErrors) => {
        const newTableErrors = { ...prevTableErrors };
        // Get all directive IDs from updated directives
        const directiveIds = updatedDirectives.map((d) => d.id);
        // Remove errors for all directive rows
        directiveIds.forEach((id) => {
          delete newTableErrors[id];
        });
        return newTableErrors;
      });
      return {
        ...prev,
        relatedDirectives: updatedDirectives,
      };
    });
  }, []);

  const handleDeleteDirective = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).filter((d) => d.id !== id),
    }));
  }, []);

  const handleUpdateDirective = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
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
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoal,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    handleAddDirective,
    handleDeleteDirective,
    handleUpdateDirective,
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