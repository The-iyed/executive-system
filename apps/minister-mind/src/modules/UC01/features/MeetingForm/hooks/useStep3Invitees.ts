import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import { useToast } from '@sanad-ai/ui';
import { createStep3InviteesSchema, type Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import { AttendanceMechanism } from '@shared/types';
import { getStep3EditableMap } from '../utils/editableFields';
import { executeStep3SubmitFlow } from '../utils/step3SubmitFlow';
import type { SuggestedAttendee } from '../../../../UC02/hooks/useSuggestMeetingAttendees';

interface UseStep3InviteesProps {
  draftId: string;
  initialData?: Partial<Step3InviteesFormData>;
  meetingCategory?: string;
  meetingConfidentiality?: string;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  editableFields?: string[] | null;
}

interface SubmitStep3InviteesPayload {
  formData: Partial<Step3InviteesFormData>;
  isDraft: boolean;
  draftId: string;
  inviteesRequired: boolean;
}

interface SubmitStep3InviteesResponse {
  success: boolean;
}

const submitStep3InviteesData = async (payload: SubmitStep3InviteesPayload): Promise<SubmitStep3InviteesResponse> => {
  const { formData, isDraft, draftId, inviteesRequired } = payload;

  if (!isDraft) {
    const validationResult = createStep3InviteesSchema({ inviteesRequired }).safeParse(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const effectiveUserId = (uid: string | undefined) =>
    uid && uid !== '__manual__' ? uid : undefined;

  const body = {
    invitees: formData.invitees?.map((invitee, index) => {
      const userId = effectiveUserId(invitee.user_id);
      if (userId) {
        return {
          user_id: userId,
          sector: invitee.sector?.trim() || '',
          attendance_mechanism: invitee.attendance_mechanism || AttendanceMechanism.PHYSICAL,
          is_required: invitee.is_required || false,
        };
      }

      return {
        user_id: undefined,
        name: invitee.name || '',
        position: invitee.position || '',
        mobile: invitee.mobile || '',
        email: invitee.email || '',
        sector: invitee.sector?.trim() || '',
        attendance_mechanism: invitee.attendance_mechanism || AttendanceMechanism.PHYSICAL,
        item_number: index + 1,
        is_required: invitee.is_required || false,
      };
    }) || [],
  };

  await axiosInstance.patch(
    `/api/meeting-requests/drafts/${draftId}/invitees`,
    body
  );

  return { success: true };
};

export const useStep3Invitees = ({
  draftId,
  initialData,
  meetingCategory,
  meetingConfidentiality,
  onSuccess,
  onError,
  isEditMode = false,
  editableFields,
}: UseStep3InviteesProps) => {
  const { toast } = useToast();
  const step3EditableMap = useMemo(
    () => getStep3EditableMap(editableFields ?? undefined),
    [editableFields]
  );
  const [formData, setFormData] = useState<Partial<Step3InviteesFormData>>({
    invitees: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});
  const [tableErrorMessage, setTableErrorMessage] = useState<string>('');

  const inviteesRequired = useMemo(() => {
    const isBilateral = meetingCategory === 'BILATERAL_MEETING';
    const isConfidential = meetingConfidentiality === 'CONFIDENTIAL';
    return !(isBilateral || isConfidential);
  }, [meetingCategory, meetingConfidentiality]);

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData, isEditMode]);

  const showSuccessToast = useCallback(
    (message: string) => {
      toast({ title: 'تم', description: message });
    },
    [toast]
  );

  const showErrorToast = useCallback(
    (message: string) => {
      toast({ title: 'حدث خطأ', description: message, variant: 'destructive' });
    },
    [toast]
  );

  const submitMutation = useMutation({
    mutationFn: async (payload: { formData: Partial<Step3InviteesFormData>; isDraft: boolean }) => {
      if (payload.isDraft) {
        return submitStep3InviteesData({ ...payload, draftId, inviteesRequired });
      }
      await executeStep3SubmitFlow({
        draftId,
        formData: payload.formData,
        inviteesRequired,
        isDraft: false,
        onSuccess: () => onSuccess?.(false),
        onError: (err) => onError?.(err),
        showSuccessToast,
        showErrorToast,
      });
      return { success: true };
    },
    onSuccess: (_, variables) => {
      if (variables.isDraft) {
        onSuccess?.(true);
      }
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

  // Validation result memoized
  const schema = useMemo(() => createStep3InviteesSchema({ inviteesRequired }), [inviteesRequired]);
  const validationResult = useMemo(() => {
    return schema.safeParse(formData);
  }, [formData, schema]);

  const validateAll = useCallback((): boolean => {
    if (!validationResult.success) {
      const newErrors: Record<string, Record<string, string>> = {};
      const newTouched: Record<string, Record<string, boolean>> = {};
      let newTableError = '';

      validationResult.error.errors.forEach((err) => {
        if (err.path[0] === 'invitees' && err.path[1] !== undefined) {
          const inviteeIndex = err.path[1] as number;
          const field = err.path[2] as string;
          const invitee = formData.invitees?.[inviteeIndex];
          
          if (invitee?.id) {
            if (!newErrors[invitee.id]) {
              newErrors[invitee.id] = {};
            }
            newErrors[invitee.id][field] = err.message;
            // Mark field as touched so error styling shows on the cell (e.g. الجوال validation)
            if (!newTouched[invitee.id]) {
              newTouched[invitee.id] = {};
            }
            newTouched[invitee.id][field] = true;
          }
        } else if (err.path[0] === 'invitees') {
          // Table-level error (e.g. invitees required)
          newTableError = err.message;
        }
      });
      setErrors(newErrors);
      setTouched((prev) => ({ ...prev, ...newTouched }));
      setTableErrorMessage(newTableError);
      return false;
    }
    
    setErrors({});
    setTableErrorMessage('');
    return true;
  }, [formData, validationResult]);

  const handleAddAttendee = useCallback(() => {
    const newAttendee = {
      id: nanoid(),
      name: '',
      position: '',
      mobile: '',
      email: '',
      sector: '',
      attendance_mechanism: AttendanceMechanism.PHYSICAL,
      is_required: false,
    };
    setFormData((prev) => ({
      ...prev,
      invitees: [newAttendee, ...(prev.invitees || [])],
    }));
  }, []);

  const handleDeleteAttendee = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees || []).filter((a) => a.id !== id),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    setTouched((prev) => {
      const newTouched = { ...prev };
      delete newTouched[id];
      return newTouched;
    });
  }, []);

  const handleUpdateAttendee = useCallback((id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
    
    setTouched((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: true,
      },
    }));
    
    if ((field === 'name' || field === 'sector') && value) {
      setErrors((prev) => {
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

  const handleAddSuggestedAttendees = useCallback((suggestions: SuggestedAttendee[]) => {
    if (!suggestions.length) return;
    const newInvitees = suggestions.map((s) => ({
      id: nanoid(),
      name: [s.first_name, s.last_name].filter(Boolean).join(' ') || '',
      position: s.position_name || s.job_description || '',
      mobile: s.phone || '',
      email: s.email || '',
      sector: s.department_name || '',
      attendance_mechanism: AttendanceMechanism.PHYSICAL,
      is_required: s.importance_level === 'مناسب جدا',
      user_id: undefined,
      username: undefined,
    }));
    setFormData((prev) => ({
      ...prev,
      invitees: [...newInvitees, ...(prev.invitees || [])],
    }));
  }, []);

  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    if (!isDraft && !validateAll()) {
      return;
    }

    submitMutation.mutate({
      formData,
      isDraft,
    });
  }, [formData, validateAll, submitMutation]);

  return {
    formData,
    errors,
    touched,
    inviteesRequired,
    tableErrorMessage,
    isSubmitting: submitMutation.isPending,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    handleAddSuggestedAttendees,
    validateAll,
    submitStep,
    step3EditableMap,
  };
};