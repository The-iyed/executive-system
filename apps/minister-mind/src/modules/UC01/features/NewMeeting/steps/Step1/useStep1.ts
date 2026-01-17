import { useState, useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { useMutation } from '@tanstack/react-query';
import type { Step1FormData } from './schema';
import axiosInstance from '@auth/utils/axios';
import { validateStep1, extractValidationErrors, isFieldRequired } from './validation';

interface UseStep1Props {
  draftId?: string;
  initialData?: Partial<Step1FormData>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
}

interface SubmitStep1Payload {
  formData: Partial<Step1FormData>;
  isDraft: boolean;
}

interface SubmitStep1Response {
  id: string;
}


const prepareFormData = (formData: Partial<Step1FormData>): FormData => {
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
      .map((a) => ({
        agenda_item: a.agenda_item || '',
        presentation_duration_minutes: a.presentation_duration_minutes
          ? parseInt(a.presentation_duration_minutes, 10) || 0
          : 0,
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

  // Boolean
  formDataToSend.append(
    'topic_discussed_before',
    formData.wasDiscussedPreviously ? 'true' : 'false'
  );

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

  // File upload
  if (formData.file) {
    formDataToSend.append('file', formData.file);
  }

  return formDataToSend;
};

/**
 * Submits basic info and file (if exists) to API
 */
const submitStep1Data = async (payload: SubmitStep1Payload): Promise<string> => {
  const { formData, isDraft } = payload;

  // Validate if not draft
  if (!isDraft) {
    const validationResult = validateStep1(formData);
    if (!validationResult.success) {
      // Create a validation error with details
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const formDataToSend = prepareFormData(formData);

  // Submit basic info with file (if exists) in FormData
  const response = await axiosInstance.post<SubmitStep1Response>(
    '/api/meeting-requests/drafts/basic-info',
    formDataToSend
  );

  const newDraftId = response.data?.id;
  if (!newDraftId) {
    throw new Error('Invalid response format: missing draft ID');
  }

  return newDraftId;
};

export const useStep1 = ({
  initialData,
  onSuccess,
  onError,
}: UseStep1Props = {}) => {
  const [formData, setFormData] = useState<Partial<Step1FormData>>({
    meetingGoals: [],
    meetingAgenda: [],
    ministerSupport: [],
    relatedDirectives: [],
    wasDiscussedPreviously: false,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1FormData, boolean>>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  // React Query mutation for submitting step 1
  const submitMutation = useMutation({
    mutationFn: submitStep1Data,
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
    return validateStep1(formData);
  }, [formData]);

  // Validate single field
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

  // Validate all fields
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
          // Mark all form fields as touched
          const allFormFields: (keyof Step1FormData)[] = [
            'meetingSubject',
            'meetingType',
            'meetingCategory',
            'meetingReason',
            'relatedTopic',
            'dueDate',
            'meetingClassification1',
            'meetingClassification2',
            'meetingConfidentiality',
            'sector',
            'wasDiscussedPreviously',
            'previousMeetingDate',
            'notes',
            'file',
          ];

          const allTouched: Partial<Record<keyof Step1FormData, boolean>> = {};
          allFormFields.forEach((field) => {
            allTouched[field] = true;
          });

          // Mark all table rows as touched
          const allTableTouched: Record<string, Record<string, boolean>> = {};
          formData.meetingGoals?.forEach((goal) => {
            allTableTouched[goal.id] = { objective: true };
          });
          formData.ministerSupport?.forEach((support) => {
            allTableTouched[support.id] = { support_description: true };
          });
          formData.meetingAgenda?.forEach((agenda) => {
            allTableTouched[agenda.id] = { agenda_item: true, presentation_duration_minutes: true };
          });

          setTouched(allTouched);
          setTableTouched(allTableTouched);

          // Scroll to first error
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

      // Clear errors if validation passes
      setErrors({});
      setTableErrors({});
      return true;
    },
    [validationResult, formData]
  );

  // Form field handlers
  const handleChange = useCallback(
    (field: keyof Step1FormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        // Clear previousMeetingDate and relatedDirectives when wasDiscussedPreviously is set to false
        if (field === 'wasDiscussedPreviously' && value === false) {
          newData.previousMeetingDate = '';
          // Get directive IDs before clearing
          const directiveIds = prev.relatedDirectives?.map((d) => d.id) || [];
          newData.relatedDirectives = [];
          // Clear errors for previousMeetingDate and relatedDirectives
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.previousMeetingDate;
            delete newErrors.relatedDirectives;
            return newErrors;
          });
          // Clear table errors for relatedDirectives
          setTableErrors((prevTableErrors) => {
            const newTableErrors = { ...prevTableErrors };
            // Remove all errors for relatedDirectives rows using the IDs we collected
            directiveIds.forEach((id) => {
              delete newTableErrors[id];
            });
            return newTableErrors;
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

  const handleFileSelect = useCallback((file: File | null) => {
    setFormData((prev) => ({ ...prev, file: file || undefined }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.file;
      return newErrors;
    });
  }, []);

  // Table handlers - Goals
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

  // Table handlers - Agenda
  const handleAddAgenda = useCallback(() => {
    const newAgenda = { id: nanoid(), agenda_item: '', presentation_duration_minutes: '' };
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: [newAgenda,...(prev.meetingAgenda || [])],
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

  // Table handlers - Support
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
      // Validate if not draft - this will set errors and touched state
      if (!isDraft && !validateAll(true)) {
        return null;
      }

      try {
        const newDraftId = await submitMutation.mutateAsync({
          formData,
          isDraft,
        });
        return newDraftId;
      } catch (error: any) {
        // If validation error, extract and set errors
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
        // Error is also handled by mutation onError
        return null;
      }
    },
    [formData, validateAll, submitMutation]
  );

  // Helper to check if a field is required
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
    isSubmitting: submitMutation.isPending,
    isLoading: submitMutation.isPending,
    isError: submitMutation.isError,
    isSuccess: submitMutation.isSuccess,
    error: submitMutation.error,
    isFieldRequired: getIsFieldRequired,
    handleChange,
    handleBlur,
    handleFileSelect,
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoal,
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
    handleAddSupport,
    handleDeleteSupport,
    handleUpdateSupport,
    handleAddDirective,
    handleDeleteDirective,
    handleUpdateDirective,
    validateAll,
    submitStep,
  };
};
