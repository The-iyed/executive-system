import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { step2Schema, type Step2FormData } from '../schemas/step2.schema';
import axiosInstance from '@auth/utils/axios';
import { mapUserToFormData } from '../utils/inviteeMappers';
import type { UserApiResponse } from '../../../data/usersApi';

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

/**
 * API function to submit Step 2 data
 */
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
  await axiosInstance.patch(
    `/api/meeting-requests/drafts/${draftId}/invitees`,
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

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData, isEditMode]);

  // React Query mutation for submitting step 2
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

  // Validation result memoized
  const validationResult = useMemo(() => {
    return step2Schema.safeParse(formData);
  }, [formData]);

  /**
   * Validate all form data
   * Skip validation for name, position, mobile when user_id exists
   */
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

  /**
   * Add a new attendee to the list
   */
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

  /**
   * Delete an attendee from the list
   */
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

  /**
   * Update an attendee field
   */
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

  /**
   * Add a user from async select to the invitees list
   * Accepts user option with user details and adds them with user_id set
   */
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

    // Check if user is already in the list
    const existingUser = formData.invitees?.find((inv) => inv.user_id === userId);
    if (existingUser) {
      console.warn('User already added to invitees');
      return;
    }

    // Map user option to UserApiResponse format for the mapper
    const userData: UserApiResponse = {
      id: userId,
      username: userOption.username,
      email: userOption.description,
      first_name: userOption.first_name,
      last_name: userOption.last_name,
      position: userOption.position || null,
      phone_number: userOption.phone_number || null,
    };

    // Use mapper to create form data
    const mappedUser = mapUserToFormData(userData);

    // Create new invitee with generated ID
    const newInvitee = {
      ...mappedUser,
      id: nanoid(),
    };

    setFormData((prev) => ({
      ...prev,
      invitees: [newInvitee, ...(prev.invitees || [])],
    }));
  }, [formData.invitees]);

  /**
   * Submit step 2 data (with validation if not draft)
   * If no invitees exist, skips API call and directly calls onSuccess
   */
  const submitStep = useCallback(async (isDraft: boolean = false): Promise<void> => {
    const hasInvitees = formData.invitees && formData.invitees.length > 0;

    // If no invitees, skip API call and directly proceed
    if (!hasInvitees) {
      onSuccess?.(isDraft);
      return;
    }

    // Validate before submitting if not draft
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
