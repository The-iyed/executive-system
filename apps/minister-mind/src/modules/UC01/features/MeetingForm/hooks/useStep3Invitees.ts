import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import { createStep3InviteesSchema, type Step3InviteesFormData } from '../schemas/step3Invitees.schema';
import { AttendanceMechanism } from '@shared/types';
import { mapUserToFormData } from '../utils/inviteeMappers';
import type { UserApiResponse } from '../../../data/usersApi';
import { getStep3EditableMap } from '../utils/editableFields';

interface UseStep3InviteesProps {
  draftId: string;
  initialData?: Partial<Step3InviteesFormData>;
  meetingCategory?: string;
  meetingConfidentiality?: string;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
  /** From get meeting details: API editable_fields. Used to disable non-editable fields in edit. */
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

  const body = {
    invitees: formData.invitees?.map((invitee, index) => {
      if (invitee.user_id) {
        return {
          user_id: invitee.user_id,
          attendance_mechanism: invitee.attendance_mechanism || AttendanceMechanism.PHYSICAL,
          is_required: invitee.is_required || false,
        };
      }
      
      return {
        name: invitee.name || '',
        position: invitee.position || '',
        mobile: invitee.mobile || '',
        email: invitee.email || '',
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
    // Invitees are required unless the meeting is a bilateral meeting or confidential
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

  const submitMutation = useMutation({
    mutationFn: (payload: { formData: Partial<Step3InviteesFormData>; isDraft: boolean }) =>
      submitStep3InviteesData({ ...payload, draftId, inviteesRequired }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
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
          }
        } else if (err.path[0] === 'invitees') {
          // Table-level error (e.g. invitees required)
          newTableError = err.message;
        }
      });
      setErrors(newErrors);
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
    
    if (field === 'name' && value) {
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

  const handleAddUserFromSelect = useCallback((userOption: { 
    value: string; 
    label: string; 
    description?: string; 
    username?: string; 
    position?: string; 
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const userId = userOption.value;
    const existingUser = formData.invitees?.find((inv) => inv.user_id === userId);
    if (existingUser) return false;

    const userData: UserApiResponse = {
      id: userId,
      username: userOption.username,
      email: userOption.description,
      first_name: userOption.first_name,
      last_name: userOption.last_name,
      position: userOption.position || null,
      phone_number: userOption.phone_number || null,
    };

    const mappedUser = mapUserToFormData(userData);

    const newInvitee = {
      ...mappedUser,
      id: nanoid(),
      attendance_mechanism: AttendanceMechanism.PHYSICAL,
    };

    setFormData((prev) => ({
      ...prev,
      invitees: [newInvitee, ...(prev.invitees || [])],
    }));
    return true;
  }, [formData.invitees]);

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
    handleAddUserFromSelect,
    validateAll,
    submitStep,
    step3EditableMap,
  };
};