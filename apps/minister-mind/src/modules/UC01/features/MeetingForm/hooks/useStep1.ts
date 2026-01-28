import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import type { Step1FormData } from '../schemas/step1.schema';
import { validateStep1, extractValidationErrors, isFieldRequired } from '../schemas/step1.schema';

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
    // Auto-set to SPECIAL if PRIVATE_MEETING per requirement
    const classificationType =
      formData.meetingCategory === 'PRIVATE_MEETING' ? 'SPECIAL' : formData.meetingClassification1;
    formDataToSend.append('meeting_classification_type', classificationType);
  }
  if (formData.meeting_location !== undefined && formData.meeting_location !== '') {
    formDataToSend.append('meeting_location', formData.meeting_location);
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
  if (formData.is_urgent && formData.presentation_attachment_timing) {
    formDataToSend.append('presentation_attachment_timing', formData.presentation_attachment_timing);
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

  // File uploads - append all presentation files
  if (formData.presentation_files && formData.presentation_files.length > 0) {
    formData.presentation_files.forEach((file) => {
      formDataToSend.append('presentation_files', file);
    });
  }
  // Additional files (optional)
  if (formData.additional_files && formData.additional_files.length > 0) {
    formData.additional_files.forEach((file) => {
      formDataToSend.append('additional_files', file);
    });
  }

  return formDataToSend;
};

/**
 * Submits basic info and file (if exists) to API
 */
const submitStep1Data = async (
  payload: SubmitStep1Payload,
  isEditMode: boolean = false
): Promise<string> => {
  const { formData, isDraft, draftId } = payload;

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

  let response;
  if (isEditMode && draftId) {
    // Update existing draft using PATCH
    response = await axiosInstance.patch<SubmitStep1Response>(
      `/api/meeting-requests/drafts/${draftId}/basic-info`,
      formDataToSend
    );
  } else {
    // Create new draft using POST
    response = await axiosInstance.post<SubmitStep1Response>(
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
    relatedDirectives: [],
    wasDiscussedPreviously: false,
    existingFiles: [],
    presentation_files: [],
    additional_files: [],
    is_urgent: false,
    is_on_behalf_of: false,
    is_based_on_directive: false,
    ...initialData,
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => {
        // Merge initialData, ensuring arrays and objects are properly merged
        const merged = {
          ...prev,
          ...initialData,
          // Preserve existingFiles from initialData if present
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

  // React Query mutation for submitting step 1
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

  // Validation with conditional rules
  const validationResult = useMemo(() => {
    return validateStep1(formData);
  }, [formData]);

  // Validate single field - similar to login form pattern
  const validateField = useCallback(
    (field: keyof Step1FormData, value: any) => {
      const updatedData = { ...formData, [field]: value };
      const result = validateStep1(updatedData);

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
            'meeting_location',
            'wasDiscussedPreviously',
            'previousMeetingDate',
            'notes',
            'presentation_files',
            'additional_files',
            'is_urgent',
            'is_on_behalf_of',
            'is_based_on_directive',
          ];

          const allTouched: Partial<Record<keyof Step1FormData, boolean>> = {};
          allFormFields.forEach((field) => {
            allTouched[field] = true;
          });

          // Mark conditional fields as touched based on their parent field values
          // Similar to previousMeetingDate when wasDiscussedPreviously is true
          if (formData.is_urgent === true) {
            allTouched.urgent_reason = true;
            allTouched.presentation_attachment_timing = true;
          }
          if (formData.is_on_behalf_of === true) {
            allTouched.meeting_manager_id = true;
          }
          if (formData.is_based_on_directive === true) {
            allTouched.directive_method = true;
            if (formData.directive_method === 'PREVIOUS_MEETING') {
              allTouched.previous_meeting_minutes_id = true;
            }
          }

          // Mark all table rows as touched
          const allTableTouched: Record<string, Record<string, boolean>> = {};
          formData.meetingGoals?.forEach((goal) => {
            allTableTouched[goal.id] = { objective: true };
          });
          formData.meetingAgenda?.forEach((agenda) => {
            allTableTouched[agenda.id] = {
              agenda_item: true,
              presentation_duration_minutes: true,
              minister_support_type: true,
              minister_support_other: true,
            };
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
          newData.presentation_attachment_timing = '';
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.urgent_reason;
            delete newErrors.presentation_attachment_timing;
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
        // Clear presentation_files error when meetingConfidentiality or meetingCategory changes
        // and the file is no longer required (becomes optional)
        if (field === 'meetingConfidentiality' || field === 'meetingCategory') {
          // Check if file is now optional (not required) using the updated form data
          const isFileRequired = isFieldRequired('presentation_files', newData);
          
          // If file is not required (optional) and has an error, clear the error
          if (!isFileRequired) {
            setErrors((prevErrors) => {
              if (prevErrors.presentation_files) {
                const newErrors = { ...prevErrors };
                delete newErrors.presentation_files;
                return newErrors;
              }
              return prevErrors;
            });
          }
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

  const handleAdditionalFilesSelect = useCallback((files: File[]) => {
    setFormData((prev) => ({ ...prev, additional_files: files || [] }));
  }, []);

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
      // Validate if not draft - this will set errors and touched state
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
    handleFilesSelect,
    handleAdditionalFilesSelect,
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
  };
};
