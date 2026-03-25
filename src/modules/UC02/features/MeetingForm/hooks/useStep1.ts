import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/modules/auth/utils/axios';
import type { Step1FormData } from '../schemas/step1.schema';
import { validateStep1, extractValidationErrors } from '../schemas/step1.schema';
import { isStep1FieldVisible } from '../utils/step1FieldConditions';
import { LOCATION_OPTIONS, getLocationDropdownValue, isPresetLocation } from '../utils/constants';
import { STEP1_FORM_FIELDS } from '../types/step1.types';
import type { MeetingApiResponse } from '../../../data/meetingsApi';
import { useMeetingAgenda } from './useMeetingAgenda';
import { toISOStringWithTimezone } from '@/modules/shared';

interface UseStep1Props {
  draftId?: string;
  initialData?: Partial<Step1FormData>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
}

interface SubmitStep1Payload {
  formData: Partial<Step1FormData>;
  isDraft: boolean;
  draftId?: string;
}

interface SubmitStep1Response {
  id: string;
}

const getOptionValue = (v: { value: string } | null | undefined): string | undefined =>
  v && typeof v === 'object' && 'value' in v ? v.value : undefined;

const prepareFormData = (formData: Partial<Step1FormData>): FormData => {
  const fd = new FormData();
  const title = formData.meetingTitle || formData.meetingSubject;
  if (title) fd.append('meeting_title', title);
  if (formData.meetingCategory) fd.append('meeting_classification', formData.meetingCategory);
  if (formData.meetingSubjectOptional) fd.append('meeting_subject', formData.meetingSubjectOptional);
  if (formData.meetingClassification1) fd.append('meeting_classification_type', formData.meetingClassification1);
  if (formData.meetingConfidentiality) fd.append('meeting_confidentiality', formData.meetingConfidentiality);
  if (formData.sector) fd.append('sector', formData.sector);
  if (formData.relatedTopic) fd.append('related_topic', formData.relatedTopic);
  if (formData.dueDate && formData.dueDate !== '') {
    const d = new Date(formData.dueDate + 'T00:00:00');
    if (!Number.isNaN(d.getTime())) fd.append('deadline', toISOStringWithTimezone(d));
  }
  if (formData.meetingReason) fd.append('meeting_justification', formData.meetingReason);
  // relatedDirective kept in form state only; not sent to API
  if (formData.requester) fd.append('submitter_id', getOptionValue(formData.requester as { value: string }) ?? '');
  if (formData.meetingOwner) fd.append('owner_id', getOptionValue(formData.meetingOwner as { value: string }) ?? '');
  if (formData.meetingDescription) fd.append('description', formData.meetingDescription);
  fd.append('is_urgent', formData.isUrgent ? 'true' : 'false');
  if (formData.isUrgent && formData.urgentReason) fd.append('urgent_reason', formData.urgentReason);
  if (formData.meeting_channel) fd.append('meeting_channel', formData.meeting_channel);
  if (formData.meetingStartDate) fd.append('meeting_start_date', formData.meetingStartDate);
  if (formData.meetingEndDate) fd.append('meeting_end_date', formData.meetingEndDate);
  if (formData.location) fd.append('location', formData.location);
  fd.append('requires_protocol', formData.requiresProtocol ? 'true' : 'false');
  fd.append('is_sequential', formData.meetingNature === 'SEQUENTIAL' ? 'true' : 'false');
  if (formData.previousMeeting) fd.append('previous_meeting_id', String(formData.previousMeeting));
  if (formData.meetingGoals?.length) {
    const objectives = formData.meetingGoals
      .filter((g) => g.objective?.trim())
      .map((g) => ({ objective: g.objective }));
    if (objectives.length) fd.append('objectives', JSON.stringify(objectives));
  }
  if (formData.meetingAgenda?.length) {
    const items = formData.meetingAgenda
      .filter((a) => a.agenda_item?.trim())
      .map((a) => ({
        agenda_item: a.agenda_item || '',
        presentation_duration_minutes: parseInt(a.presentation_duration_minutes ?? '0', 10) || 0,
        minister_support_type: a.minister_support_type || undefined,
        minister_support_other: a.minister_support_other || undefined,
      }));
    if (items.length) fd.append('agenda_items', JSON.stringify(items));
  }
  if (formData.ministerSupport?.length) {
    const support = formData.ministerSupport
      .filter((s) => s.support_description?.trim())
      .map((s) => ({ support_description: s.support_description }));
    if (support.length) fd.append('minister_support', JSON.stringify(support));
  }
  fd.append('topic_discussed_before', formData.wasDiscussedPreviously ? 'true' : 'false');
  if (formData.wasDiscussedPreviously && formData.previousMeetingDate) {
    const d = new Date(formData.previousMeetingDate + 'T00:00:00');
    if (!Number.isNaN(d.getTime())) fd.append('previous_meeting_date', toISOStringWithTimezone(d));
  }
  if (formData.notes) fd.append('note', formData.notes);
  fd.append('is_data_complete', formData.isComplete ? 'true' : 'false');
  return fd;
};

const submitStep1Data = async (payload: SubmitStep1Payload, isEditMode: boolean): Promise<string> => {
  const { formData, isDraft, draftId } = payload;
  if (!isDraft) {
    const result = validateStep1(formData);
    if (!result.success) {
      const err = new Error('Validation failed');
      (err as Error & { validationErrors: unknown }).validationErrors = result.error;
      throw err;
    }
  }
  const body = prepareFormData(formData);
  const url = isEditMode && draftId
    ? `/api/meeting-requests/direct-schedule/${draftId}/step1`
    : '/api/meeting-requests/direct-schedule/step1';
  const method = isEditMode && draftId ? 'put' : 'post';
  const { data } = await axiosInstance[method]<SubmitStep1Response>(url, body);
  const newDraftId = data?.id ?? draftId;
  if (!newDraftId) throw new Error('Invalid response format: missing draft ID');
  return newDraftId;
};

const INITIAL_STATE: Partial<Step1FormData> = {
  meetingGoals: [],
  meetingAgenda: [],
  ministerSupport: [],
  relatedDirectives: [],
  previousMeetings: [],
  wasDiscussedPreviously: false,
  meetingNature: '',
  meetingOwner: null,
  meetingTitle: '',
  meetingDescription: '',
  isUrgent: false,
  urgentReason: '',
  meeting_channel: '',
  meetingStartDate: '',
  meetingEndDate: '',
  location: '',
  location_option: '',
  requiresProtocol: false,
  isComplete: false,
  /** سرية الاجتماع: default عادي (non-confidential). */
  meetingConfidentiality: 'NORMAL',
};

export function useStep1({
  draftId,
  initialData,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep1Props = {}) {
  const [formData, setFormData] = useState<Partial<Step1FormData>>({ ...INITIAL_STATE, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1FormData, boolean>>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  const { handleAddAgenda, handleDeleteAgenda, handleUpdateAgenda } = useMeetingAgenda({
    agenda: formData.meetingAgenda ?? [],
    setFormData,
    setErrors,
    setTableErrors,
  });

  useEffect(() => {
    if (!initialData || !isEditMode) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
    }));
  }, [initialData, isEditMode]);

  const validateField = useCallback((field: keyof Step1FormData, value: unknown) => {
    const data = { ...formData, [field]: value };
    const result = validateStep1(data);
    setErrors((prev) => {
      const next = { ...prev };
      if (result.success) {
        delete next[field];
        return next;
      }
      const issue = result.error.errors.find((e) => e.path[0] === field);
      if (issue) next[field] = issue.message;
      else delete next[field];
      return next;
    });
  }, [formData]);

  const validateAll = useCallback((markTouched = true): boolean => {
    const result = validateStep1(formData);
    if (result.success) {
      setErrors({});
      setTableErrors({});
      return true;
    }
    const { formErrors, tableErrors: extractedTableErrors } = extractValidationErrors(result, formData);
    setErrors(formErrors);
    setTableErrors(extractedTableErrors);

    if (markTouched) {
      const touchedMap: Partial<Record<keyof Step1FormData, boolean>> = {};
      STEP1_FORM_FIELDS.forEach((key) => {
        if (isStep1FieldVisible(key, formData)) {
          touchedMap[key] = true;
        }
      });
      setTouched(touchedMap);
      setTableTouched(
        Object.fromEntries(
          (formData.meetingAgenda ?? []).map((a) => [
            a.id,
            { agenda_item: true, presentation_duration_minutes: true, minister_support_type: true, minister_support_other: true },
          ])
        )
      );

      requestAnimationFrame(() => {
        const el = document.querySelector('[data-error-field]') ?? document.querySelector('[data-form-container]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    return false;
  }, [formData]);

  const touchAndValidate = useCallback((field: keyof Step1FormData, value: unknown) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  }, [validateField]);

  const handleChange = useCallback((field: keyof Step1FormData, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'wasDiscussedPreviously' && value === false) {
        next.previousMeetingDate = '';
        next.previousMeetings = [];
      }
      if (field === 'meetingNature' && value !== 'SEQUENTIAL' && value !== 'PERIODIC') {
        next.previousMeeting = '';
      }
      if (field === 'meetingCategory' && value !== 'BUSINESS') {
        next.meetingClassification1 = '';
      }
      if (field === 'meeting_channel' && value !== 'PHYSICAL') {
        next.location = '';
        next.location_option = '';
      }
      if (field === 'location_option') {
        const str = typeof value === 'string' ? value : '';
        next.location = isPresetLocation(str) ? str : '';
      }
      return next;
    });
    if (field === 'wasDiscussedPreviously' && value === false) {
      setErrors((e) => {
        const next = { ...e };
        delete next.previousMeetingDate;
        return next;
      });
    }
    if (field === 'meetingNature' && value !== 'SEQUENTIAL' && value !== 'PERIODIC') {
      setErrors((e) => {
        const next = { ...e };
        delete next.previousMeeting;
        return next;
      });
    }
    if (field === 'meetingCategory' && value !== 'BUSINESS') {
      setErrors((e) => {
        const next = { ...e };
        delete next.meetingClassification1;
        return next;
      });
    }
    if (field === 'meeting_channel' && value !== 'PHYSICAL') {
      setErrors((e) => {
        const next = { ...e };
        delete next.location;
        return next;
      });
    }
    touchAndValidate(field, value);
  }, [touchAndValidate]);

  const handleBlur = useCallback((field: keyof Step1FormData) => {
    touchAndValidate(field, formData[field]);
  }, [formData, touchAndValidate]);

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitStep1Payload) => submitStep1Data(payload, isEditMode),
    onSuccess: (id) => onSuccess?.(id),
    onError: (err) => onError?.(err instanceof Error ? err : new Error('حدث خطأ أثناء الحفظ')),
  });

  const submitStep = useCallback(async (isDraft = false): Promise<string | null> => {
    if (!isDraft && !validateAll(true)) return null;
    try {
      return await submitMutation.mutateAsync({ formData, isDraft, draftId });
    } catch (err: unknown) {
      const validationErrors = (err as Error & { validationErrors?: unknown })?.validationErrors;
      if (validationErrors) {
        const { formErrors, tableErrors: extractedTableErrors } = extractValidationErrors(
          { success: false, error: validationErrors } as Parameters<typeof extractValidationErrors>[0],
          formData
        );
        setErrors(formErrors);
        setTableErrors(extractedTableErrors);
      }
      return null;
    }
  }, [formData, draftId, validateAll, submitMutation]);

  const fillFormFromPreviousMeeting = useCallback((meeting: MeetingApiResponse) => {
    const deadlineVal = meeting.deadline
      ? (meeting.deadline.includes('T') ? meeting.deadline : `${meeting.deadline}T00:00:00`).slice(0, 10)
      : '';
    const meetingUnknown = meeting as unknown as Record<string, unknown>;
    const meetingDesc = meetingUnknown.description ?? '';
    const meetingLocation = typeof meetingUnknown.location === 'string' ? meetingUnknown.location : undefined;
    setFormData((prev) => ({
      ...prev,
      meetingTitle: meeting.meeting_title ?? prev.meetingTitle,
      meetingSubject: meeting.meeting_title ?? meeting.meeting_subject ?? prev.meetingSubject,
      meetingSubjectOptional: meeting.meeting_subject ?? prev.meetingSubjectOptional,
      meetingDescription: typeof meetingDesc === 'string' ? meetingDesc : prev.meetingDescription,
      meetingType: meeting.meeting_type ?? prev.meetingType,
      meetingCategory: meeting.meeting_classification ?? prev.meetingCategory,
      sector: meeting.sector ?? prev.sector,
      meetingReason: meeting.meeting_justification ?? prev.meetingReason,
      relatedTopic: meeting.related_topic ?? prev.relatedTopic,
      dueDate: deadlineVal || prev.dueDate,
      meetingClassification1: meeting.meeting_classification_type ?? prev.meetingClassification1,
      meetingConfidentiality: meeting.meeting_confidentiality ?? prev.meetingConfidentiality,
      meeting_channel: meeting.meeting_channel ?? prev.meeting_channel,
      requiresProtocol: meeting.requires_protocol ?? prev.requiresProtocol,
      location: meetingLocation ?? prev.location ?? '',
      location_option: getLocationDropdownValue(meetingLocation, undefined) ?? prev.location_option ?? '',
      requester: meeting.submitter_id != null
        ? { value: meeting.submitter_id, label: meeting.submitter_name ?? '' }
        : prev.requester,
      meetingOwner: (meeting.current_owner_object_guid ?? meeting.current_owner_user_id) != null
        ? { value: meeting.current_owner_object_guid ?? meeting.current_owner_user_id, label: meeting.meeting_owner_name ?? '' }
        : prev.meetingOwner,
    }));
  }, []);

  const isFieldVisible = useCallback(
    (field: keyof Step1FormData) => isStep1FieldVisible(field, formData),
    [formData]
  );

  return {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    isSubmitting: submitMutation.isPending,
    isFieldVisible,
    handleChange,
    handleBlur,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    fillFormFromPreviousMeeting,
    validateAll,
    submitStep,
  };
}