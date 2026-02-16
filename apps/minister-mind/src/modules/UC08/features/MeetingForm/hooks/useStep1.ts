import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import type { Step1FormData } from '../schemas/step1.schema';
import { validateStep1, extractValidationErrors, isFieldRequired } from '../schemas/step1.schema';
import type { MeetingApiResponse } from '../../../data/meetingsApi';

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


const prepareFormData = (formData: Partial<Step1FormData>): FormData => {
  const formDataToSend = new FormData();

  const titleToSend = formData.meetingTitle || formData.meetingSubject;
  if (titleToSend) {
    formDataToSend.append('meeting_title', titleToSend);
  }

  if (formData.meetingCategory) {
    formDataToSend.append('meeting_classification', formData.meetingCategory);
  }

  if (formData.meetingSubjectOptional) {
    formDataToSend.append('meeting_subject', formData.meetingSubjectOptional);
  }

  if (formData.meetingClassification1) {
    formDataToSend.append('meeting_classification_type', formData.meetingClassification1);
  }

  if (formData.meetingConfidentiality) {
    formDataToSend.append('meeting_confidentiality', formData.meetingConfidentiality);
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

  if (formData.relatedDirective) {
    formDataToSend.append('related_directive_id', formData.relatedDirective.value);
  }

  if (formData.requester) {
    formDataToSend.append('submitter_id', formData.requester.value);
  }

  if (formData.meetingOwner && typeof formData.meetingOwner === 'object' && formData.meetingOwner.value) {
    formDataToSend.append('owner_id', formData.meetingOwner.value);
  }

  if (formData.meetingDescription) {
    formDataToSend.append('meeting_description', formData.meetingDescription);
  }

  formDataToSend.append('is_urgent', formData.isUrgent ? 'true' : 'false');
  if (formData.isUrgent && formData.urgentReason) {
    formDataToSend.append('urgent_reason', formData.urgentReason);
  }

  if (formData.meeting_channel) {
    formDataToSend.append('meeting_channel', formData.meeting_channel);
  }
  if (formData.meetingStartDate) {
    formDataToSend.append('meeting_start_date', formData.meetingStartDate);
  }
  if (formData.meetingEndDate) {
    formDataToSend.append('meeting_end_date', formData.meetingEndDate);
  }
  if (formData.location) {
    formDataToSend.append('location', formData.location);
  }
  formDataToSend.append('requires_protocol', formData.requiresProtocol ? 'true' : 'false');

  const isSequential = formData.meetingNature === 'SEQUENTIAL';
  formDataToSend.append('is_sequential', isSequential ? 'true' : 'false');

  if (formData.previousMeeting) {
    formDataToSend.append('previous_meeting_id', formData.previousMeeting);
  }

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
      .map((a) => ({
        agenda_item: a.agenda_item || '',
        presentation_duration_minutes: a.presentation_duration_minutes
          ? parseInt(a.presentation_duration_minutes, 10) || 0
          : 0,
        minister_support_type: a.minister_support_type || undefined,
        minister_support_other: a.minister_support_other || undefined,
      }))
      .filter((a) => a.agenda_item && a.agenda_item.trim() !== '');
    if (agendaItems.length > 0) {
      formDataToSend.append('agenda_items', JSON.stringify(agendaItems));
    }
  }

  if (formData.ministerSupport && formData.ministerSupport.length > 0) {
    const support = formData.ministerSupport
      .map((s) => ({ support_description: s.support_description }))
      .filter((s) => s.support_description && s.support_description.trim() !== '');
    if (support.length > 0) {
      formDataToSend.append('minister_support', JSON.stringify(support));
    }
  }

  formDataToSend.append(
    'topic_discussed_before',
    formData.wasDiscussedPreviously ? 'true' : 'false'
  );

  if (formData.wasDiscussedPreviously && formData.previousMeetingDate && formData.previousMeetingDate !== '') {
    const prevDate = new Date(formData.previousMeetingDate + 'T00:00:00');
    if (!isNaN(prevDate.getTime())) {
      formDataToSend.append('previous_meeting_date', prevDate.toISOString());
    }
  }

  if (formData.notes) {
    formDataToSend.append('general_notes', formData.notes);
  }

  formDataToSend.append('is_data_complete', formData.isComplete ? 'true' : 'false');

  if (formData.presentationFile) {
    formDataToSend.append('presentation_files', formData.presentationFile);
  }
  if (formData.presentation_files && formData.presentation_files.length > 0) {
    formData.presentation_files.forEach((file) => {
      formDataToSend.append('presentation_files', file);
    });
  }

  if (formData.additionalAttachments) {
    formDataToSend.append('additional_files', formData.additionalAttachments);
  }

  return formDataToSend;
};

const submitStep1Data = async (
  payload: SubmitStep1Payload,
  isEditMode: boolean = false
): Promise<string> => {
  const { formData, isDraft, draftId } = payload;

  if (!isDraft) {
    const validationResult = validateStep1(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const formDataToSend = prepareFormData(formData);

  let response;
  if (isEditMode && draftId) {
    response = await axiosInstance.patch<SubmitStep1Response>(
      `/api/meeting-requests/drafts/${draftId}/basic-info`,
      formDataToSend
    );
  } else {
    response = await axiosInstance.post<SubmitStep1Response>(
      '/api/meeting-requests/direct-schedule/step1',
      formDataToSend
    );
  }

  const newDraftId = response.data?.id || draftId;
  if (!newDraftId) {
    throw new Error('Invalid response format: missing draft ID');
  }

  return newDraftId;
};

export const useStep1 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep1Props = {}) => {
  const [formData, setFormData] = useState<Partial<Step1FormData>>({
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
    requiresProtocol: false,
    isComplete: false,
    existingFiles: [],
    presentation_files: [],
    ...initialData,
  });

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => {
        const merged = {
          ...prev,
          ...initialData,
          existingFiles: initialData.existingFiles || prev.existingFiles || [],
        };
        return merged;
      });
    }
  }, [initialData, isEditMode]);

  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1FormData, boolean>>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitStep1Payload) => submitStep1Data(payload, isEditMode),
    onSuccess: (newDraftId) => {
      onSuccess?.(newDraftId);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const validationResult = useMemo(() => {
    return validateStep1(formData);
  }, [formData]);

  const validateField = useCallback(
    (field: keyof Step1FormData, value: any) => {
      const updatedData = { ...formData, [field]: value };
      const result = validateStep1(updatedData);

      if (result.success) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      } else {
        const fieldError = result.error.errors.find((err) => err.path[0] === field);
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError.message,
          }));
        }
      }
    },
    [formData]
  );

  const validateAll = useCallback(
    (markTouched: boolean = true): boolean => {
      if (!validationResult.success) {
        const { formErrors, tableErrors: extractedTableErrors } = extractValidationErrors(
          validationResult,
          formData
        );

        setErrors(formErrors);
        setTableErrors(extractedTableErrors);

        if (markTouched) {
          const allFormFields: (keyof Step1FormData)[] = [
            'relatedDirective',
            'requester',
            'previousMeeting',
            'meetingNature',
            'meetingOwner',
            'meetingTitle',
            'meetingSubject',
            'meetingSubjectOptional',
            'meetingDescription',
            'meetingType',
            'meetingCategory',
            'meetingReason',
            'relatedTopic',
            'dueDate',
            'meetingClassification1',
            'meetingClassification2',
            'meetingConfidentiality',
            'sector',
            'isUrgent',
            'urgentReason',
            'meetingStartDate',
            'meetingEndDate',
            'meeting_channel',
            'location',
            'requiresProtocol',
            'wasDiscussedPreviously',
            'previousMeetingDate',
            'notes',
            'presentation_files',
            'presentationFile',
            'additionalAttachments',
            'isComplete',
          ];

          const allTouched: Partial<Record<keyof Step1FormData, boolean>> = {};
          allFormFields.forEach((field) => {
            allTouched[field] = true;
          });

          const allTableTouched: Record<string, Record<string, boolean>> = {};
          formData.meetingGoals?.forEach((goal) => {
            allTableTouched[goal.id] = { objective: true };
          });
          formData.ministerSupport?.forEach((support) => {
            allTableTouched[support.id] = { support_description: true };
          });
          formData.meetingAgenda?.forEach((agenda) => {
            allTableTouched[agenda.id] = {
              agenda_item: true,
              presentation_duration_minutes: true,
              minister_support_type: true,
              minister_support_other: true,
            };
          });
          formData.previousMeetings?.forEach((meeting) => {
            allTableTouched[meeting.id] = { meeting_subject: true, meeting_date: true };
          });
          formData.relatedDirectives?.forEach((directive) => {
            allTableTouched[directive.id] = { 
              directive: true, 
              previousMeeting: true, 
              directiveDate: true, 
              directiveStatus: true, 
              dueDate: true, 
              responsible: true 
            };
          });

          setTouched(allTouched);
          setTableTouched(allTableTouched);

          setTimeout(() => {
            const firstErrorElement = document.querySelector('[data-error-field]');
            if (firstErrorElement) {
              firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              const formContainer = document.querySelector('[data-form-container]');
              if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
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

  const handleChange = useCallback(
    (field: keyof Step1FormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        if (field === 'wasDiscussedPreviously' && value === false) {
          newData.previousMeetingDate = '';
          newData.previousMeetings = [];
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previousMeetingDate;
            delete newErrors.previousMeetings;
            return newErrors;
          });
          setTableErrors((prevTableErrors) => {
            const newTableErrors = { ...prevTableErrors };
            (prev.previousMeetings || []).forEach((m) => {
              delete newTableErrors[m.id];
            });
            return newTableErrors;
          });
        }
        if (
          field === 'meetingNature' &&
          value !== 'SEQUENTIAL' &&
          value !== 'PERIODIC'
        ) {
          newData.previousMeeting = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previousMeeting;
            return newErrors;
          });
        }
        return newData;
      });
      if (touched[field]) {
        validateField(field, value);
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: keyof Step1FormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, formData[field]);
    },
    [formData, validateField]
  );

  const handleFilesSelect = useCallback((files: File[]) => {
    setFormData((prev) => ({ ...prev, presentation_files: files }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.presentation_files;
      return newErrors;
    });
  }, []);

  const handleAddGoal = useCallback(() => {
    const newGoal = { id: nanoid(), objective: '' };
    setFormData((prev) => ({
      ...prev,
      meetingGoals: [newGoal, ...(prev.meetingGoals || [])],
    }));
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

  const handleAddAgenda = useCallback(() => {
    const newAgenda = {
      id: nanoid(),
      agenda_item: '',
      presentation_duration_minutes: '',
      minister_support_type: '',
      minister_support_other: '',
    };
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: [newAgenda, ...(prev.meetingAgenda || [])],
    }));
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
  }, []);

  const handleAddSupport = useCallback(() => {
    const newSupport = { id: nanoid(), support_description: '' };
    setFormData((prev) => ({
      ...prev,
      ministerSupport: [newSupport,...(prev.ministerSupport || [])],
    }));
  }, []);

  const handleDeleteSupport = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).filter((s) => s.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const handleUpdateSupport = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s
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

  const handleAddPreviousMeeting = useCallback(() => {
    const newMeeting = { id: nanoid(), meeting_subject: '', meeting_date: '' };
    setFormData((prev) => ({
      ...prev,
      previousMeetings: [newMeeting, ...(prev.previousMeetings || [])],
    }));
  }, []);

  const handleDeletePreviousMeeting = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      previousMeetings: (prev.previousMeetings || []).filter((m) => m.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const handleUpdatePreviousMeeting = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      previousMeetings: (prev.previousMeetings || []).map((m) =>
        m.id === id ? { ...m, [field]: value } : m
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
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: [newDirective, ...(prev.relatedDirectives || [])],
    }));
  }, []);

  const handleDeleteDirective = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).filter((d) => d.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const handleUpdateDirective = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).map((d) =>
        d.id === id ? { ...d, [field]: value } : d
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

  /** Fill form from a previous meeting (do NOT set relatedDirective / Guidance per spec) */
  const fillFormFromPreviousMeeting = useCallback((meeting: MeetingApiResponse) => {
    const deadlineVal = meeting.deadline
      ? (meeting.deadline.includes('T') ? meeting.deadline : `${meeting.deadline}T00:00:00`).slice(0, 10)
      : '';
    setFormData((prev) => ({
      ...prev,
      meetingTitle: meeting.meeting_title ?? prev.meetingTitle,
      meetingSubject: meeting.meeting_title ?? meeting.meeting_subject ?? prev.meetingSubject,
      meetingSubjectOptional: meeting.meeting_subject ?? prev.meetingSubjectOptional,
      meetingDescription: (meeting as any).meeting_description ?? prev.meetingDescription,
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
      location: meeting.location ?? prev.location,
      requester:
        meeting.submitter_id != null
          ? { value: meeting.submitter_id, label: (meeting as any).submitter_name ?? meeting.submitter_name ?? '' }
          : prev.requester,
      meetingOwner:
        meeting.current_owner_user_id != null
          ? {
              value: meeting.current_owner_user_id,
              label: (meeting as any).meeting_owner_name ?? '',
            }
          : prev.meetingOwner,
    }));
  }, []);

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
          const { formErrors, tableErrors: extractedTableErrors } = extractValidationErrors(
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
    [formData, validateAll, submitMutation]
  );

  const getIsFieldRequired = useCallback(
    (field: keyof Step1FormData) => {
      return isFieldRequired(field, formData);
    },
    [formData]
  );

  return {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    setTableErrors,
    setTableTouched,
    isSubmitting: submitMutation.isPending,
    isLoading: submitMutation.isPending,
    isError: submitMutation.isError,
    isSuccess: submitMutation.isSuccess,
    error: submitMutation.error,
    isFieldRequired: getIsFieldRequired,
    handleChange,
    handleBlur,
    handleFilesSelect,
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoal,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    handleAddSupport,
    handleDeleteSupport,
    handleUpdateSupport,
    handleAddPreviousMeeting,
    handleDeletePreviousMeeting,
    handleUpdatePreviousMeeting,
    handleAddDirective,
    handleDeleteDirective,
    handleUpdateDirective,
    fillFormFromPreviousMeeting,
    validateAll,
    submitStep,
  };
};
