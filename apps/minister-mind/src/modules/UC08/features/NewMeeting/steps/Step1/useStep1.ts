import { useState, useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import type { Step1FormData } from './schema';

interface UseStep1Props {
  draftId?: string;
  initialData?: Partial<Step1FormData>;
  onSuccess?: (draftId: string) => void;
  onError?: (error: Error) => void;
}

export const useStep1 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
}: UseStep1Props = {}) => {
  const [formData, setFormData] = useState<Partial<Step1FormData>>({
    meetingGoals: [],
    meetingAgenda: [],
    ministerSupport: [],
    previousMeetings: [],
    relatedDirectives: [],
    wasDiscussedPreviously: false,
    isComplete: false,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1FormData, boolean>>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form field handlers
  const handleChange = useCallback(
    (field: keyof Step1FormData, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        // Clear previousMeetings when wasDiscussedPreviously is set to false
        if (field === 'wasDiscussedPreviously' && value === false) {
          newData.previousMeetings = [];
        }
        return newData;
      });
    },
    []
  );

  const handleBlur = useCallback(
    (field: keyof Step1FormData) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

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
  }, []);

  const handleUpdateGoal = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      meetingGoals: (prev.meetingGoals || []).map((g) =>
        g.id === id ? { ...g, [field]: value } : g
      ),
    }));
  }, []);

  // Table handlers - Agenda
  const handleAddAgenda = useCallback(() => {
    const newAgenda = { id: nanoid(), agenda_item: '', presentation_duration_minutes: '' };
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

  // Table handlers - Support
  const handleAddSupport = useCallback(() => {
    const newSupport = { id: nanoid(), support_description: '' };
    setFormData((prev) => ({
      ...prev,
      ministerSupport: [newSupport, ...(prev.ministerSupport || [])],
    }));
  }, []);

  const handleDeleteSupport = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).filter((s) => s.id !== id),
    }));
  }, []);

  const handleUpdateSupport = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  }, []);

  // Table handlers - Previous Meetings
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
  }, []);

  const handleUpdatePreviousMeeting = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      previousMeetings: (prev.previousMeetings || []).map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  }, []);

  // Table handlers - Related Directives
  const handleAddDirective = useCallback(() => {
    const newDirective = {
      id: nanoid(),
      previous_meeting: '',
      directive_date: '',
      directive_status: '',
      due_date: '',
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

  // Validation
  const validateAll = useCallback((): boolean => {
    // Basic validation - can be extended
    const newErrors: Partial<Record<keyof Step1FormData, string>> = {};
    
    if (!formData.meetingNature) {
      newErrors.meetingNature = 'هذا الحقل مطلوب';
    }
    if (!formData.meetingSubject) {
      newErrors.meetingSubject = 'هذا الحقل مطلوب';
    }
    if (!formData.meetingType) {
      newErrors.meetingType = 'هذا الحقل مطلوب';
    }
    if (!formData.meetingCategory) {
      newErrors.meetingCategory = 'هذا الحقل مطلوب';
    }
    if (!formData.meetingGoals || formData.meetingGoals.length === 0) {
      newErrors.meetingGoals = 'يجب إضافة هدف واحد على الأقل';
    }
    if (!formData.ministerSupport || formData.ministerSupport.length === 0) {
      newErrors.ministerSupport = 'يجب إضافة دعم واحد على الأقل';
    }
    if (!formData.isComplete) {
      newErrors.isComplete = 'يجب التأكيد على اكتمال الطلب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit
  const submitStep = useCallback(async (isDraft: boolean): Promise<string | null> => {
    if (!isDraft && !validateAll()) {
      return null;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call
      const newDraftId = draftId || nanoid();
      onSuccess?.(newDraftId);
      return newDraftId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, validateAll, onSuccess, onError]);

  return {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    isSubmitting,
    handleChange,
    handleBlur,
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
    validateAll,
    submitStep,
  };
};
