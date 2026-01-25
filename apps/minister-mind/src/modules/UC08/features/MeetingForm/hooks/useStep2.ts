import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { UserApiResponse } from 'apps/minister-mind/src/modules/UC01/data/usersApi';
import axiosInstance from '@auth/utils/axios';
import { step2Schema, type Step2FormData } from '../schemas/step2.schema';
import { mapUserToFormData } from '../utils/inviteeMappers';

interface UseStep2Props {
  draftId: string;
  initialData?: Partial<Step2FormData>;
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
}

interface SubmitStep2Payload {
  formData: Partial<Step2FormData>;
  isDraft: boolean;
  draftId: string;
}

interface SubmitStep2Response {
  success: boolean;
}

const submitStep2Data = async (payload: SubmitStep2Payload): Promise<SubmitStep2Response> => {
  const { formData, isDraft, draftId } = payload;

  // Validate if not draft
  if (!isDraft) {
    const validationResult = step2Schema.safeParse(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = validationResult.error;
      throw error;
    }
  }

  const body = {
    invitees: formData.invitees?.map((invitee, index) => {
      // If user exists in system (has user_id), send only user_id and is_required
      if (invitee.user_id) {
        return {
          user_id: invitee.user_id,
          is_required: invitee.is_required || false,
        };
      }
      
      // If external user (no user_id), send all fields
      return {
        name: invitee.name || '',
        position: invitee.position || '',
        mobile: invitee.mobile || '',
        email: invitee.email || '',
        item_number: index + 1,
        is_required: invitee.is_required || false,
      };
    }) || [],
  };

  // Use PATCH for both create and update (same endpoint)
  await axiosInstance.put(
    `/api/meeting-requests/direct-schedule/${draftId}/step2`,
    body
  );

  return { success: true };
};

export const useStep2 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep2Props) => {
  const [formData, setFormData] = useState<Partial<Step2FormData>>({
    invitees: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData, isEditMode]);

  const submitMutation = useMutation({
    mutationFn: (payload: { formData: Partial<Step2FormData>; isDraft: boolean }) =>
      submitStep2Data({ ...payload, draftId }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const validationResult = useMemo(() => {
    return step2Schema.safeParse(formData);
  }, [formData]);

  const validateAll = useCallback((): boolean => {
    if (!validationResult.success) {
      const newErrors: Record<string, Record<string, string>> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0] === 'invitees' && err.path[1] !== undefined) {
          const inviteeIndex = err.path[1] as number;
          const field = err.path[2] as string;
          const invitee = formData.invitees?.[inviteeIndex];
          
          // Skip validation for name, position, mobile if user_id exists
          if (invitee?.user_id && ['name', 'position', 'mobile'].includes(field)) {
            return; // Skip this error
          }
          
          if (invitee?.id) {
            if (!newErrors[invitee.id]) {
              newErrors[invitee.id] = {};
            }
            newErrors[invitee.id][field] = err.message;
          }
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData, validationResult]);

  const handleAddAttendee = useCallback(() => {
    const newAttendee = {
      id: nanoid(),
      name: '',
      position: '',
      mobile: '',
      email: '',
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
    
    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: true,
      },
    }));
    
    // Clear error if field is valid
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
    };

    setFormData((prev) => ({
      ...prev,
      invitees: [newInvitee, ...(prev.invitees || [])],
    }));
    return true;
  }, [formData.invitees]);

  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    const hasInvitees = formData.invitees && formData.invitees.length > 0;

    if (!hasInvitees) {
      onSuccess?.(isDraft);
      return;
    }

    if (!isDraft && !validateAll()) {
      return;
    }

    submitMutation.mutate({
      formData,
      isDraft,
    });
  }, [formData, validateAll, submitMutation, onSuccess]);

  return {
    formData,
    errors,
    touched,
    isSubmitting: submitMutation.isPending,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    handleAddUserFromSelect,
    validateAll,
    submitStep,
  };
};
