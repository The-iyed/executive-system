import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import axiosInstance from '@auth/utils/axios';
import { getUsers } from '../../../data/usersApi';
import {
  step3Schema,
  type Step3FormData,
  type InviteeFormRow,
} from '../schemas/step3.schema';
import {
  mapUserToStep3InviteeRow,
  createEmptyStep3InviteeRow,
} from '../utils/inviteeMappers';

type MeetingOwnerOption = { value: string; label: string } | null | undefined;

interface UseStep3Props {
  draftId: string;
  initialData?: Partial<Step3FormData>;
  /** Step1 meeting owner (value = user id). Used to auto-insert owner as first invitee. */
  step1FormData?: { meetingOwner?: MeetingOwnerOption };
  onSuccess?: (isDraft: boolean) => void;
  onError?: (error: Error) => void;
  isEditMode?: boolean;
}

interface SubmitStep3Payload {
  formData: Partial<Step3FormData>;
  isDraft: boolean;
  draftId: string;
}

function toBackendInvitee(row: InviteeFormRow): Record<string, unknown> {
  return {
    full_name: row.full_name,
    position_title: row.position_title,
    mobile_number: row.mobile_number,
    email: row.email,
    attendance_mode: row.attendance_mode,
    view_permission: row.view_permission,
  };
}

const submitStep3Data = async (payload: SubmitStep3Payload): Promise<{ success: boolean }> => {
  const { formData, isDraft, draftId } = payload;

  if (!isDraft) {
    const validationResult = step3Schema.safeParse(formData);
    if (!validationResult.success) {
      const error = new Error('Validation failed');
      (error as Error & { validationErrors: unknown }).validationErrors = validationResult.error;
      throw error;
    }
  }

  const body: Record<string, unknown> = {
    invitees: (formData.invitees ?? []).map(toBackendInvitee),
  };
  if ((formData.minister_invitees?.length ?? 0) > 0) {
    body.minister_invitees = formData.minister_invitees.map(toBackendInvitee);
  }
  if ((formData.proposer_user_ids?.length ?? 0) > 0) {
    body.proposer_user_ids = formData.proposer_user_ids;
  }

  await axiosInstance.put(`/api/meeting-requests/direct-schedule/${draftId}/step3`, body);
  return { success: true };
};

export const useStep3 = ({
  draftId,
  initialData,
  step1FormData,
  onSuccess,
  onError,
  isEditMode = false,
}: UseStep3Props) => {
  const [formData, setFormData] = useState<Partial<Step3FormData>>({
    invitees: [],
    minister_invitees: [],
    proposer_user_ids: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});
  const ownerSeededRef = useRef(false);

  // Seed owner as first invitee when we have meeting owner and no invitees yet (create mode only)
  useEffect(() => {
    const ownerOption = step1FormData?.meetingOwner;
    const value = ownerOption && typeof ownerOption === 'object' && ownerOption.value;
    if (!value || ownerSeededRef.current) return;
    const invitees = formData.invitees ?? [];
    const hasExistingInvitees = invitees.length > 0 || (initialData?.invitees?.length ?? 0) > 0;
    if (hasExistingInvitees) {
      ownerSeededRef.current = true;
      return;
    }
    ownerSeededRef.current = true;
    getUsers({ search: value, limit: 5 })
      .then((res) => {
        const user = res.items.find((u) => u.id === value);
        const ownerRow: InviteeFormRow = user
          ? mapUserToStep3InviteeRow(user, { isOwner: true })
          : {
              ...createEmptyStep3InviteeRow(),
              full_name: typeof ownerOption === 'object' && ownerOption.label ? ownerOption.label : '',
              isOwner: true,
            };
        setFormData((prev) => ({
          ...prev,
          invitees: [ownerRow],
        }));
      })
      .catch(() => {
        const label = typeof ownerOption === 'object' && ownerOption.label ? ownerOption.label : '';
        setFormData((prev) => ({
          ...prev,
          invitees: [
            {
              ...createEmptyStep3InviteeRow(),
              full_name: label,
              isOwner: true,
            },
          ],
        }));
      });
  }, [step1FormData?.meetingOwner, formData.invitees?.length, initialData?.invitees?.length]);

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      if ((initialData.invitees?.length ?? 0) > 0) ownerSeededRef.current = true;
    }
  }, [initialData, isEditMode]);

  const submitMutation = useMutation({
    mutationFn: (payload: { formData: Partial<Step3FormData>; isDraft: boolean }) =>
      submitStep3Data({ ...payload, draftId }),
    onSuccess: (_, variables) => {
      onSuccess?.(variables.isDraft);
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const validateAll = useCallback((): boolean => {
    const result = step3Schema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: Record<string, Record<string, string>> = {};
    result.error.errors.forEach((err) => {
      const path = err.path as (string | number)[];
      if (path[0] === 'invitees') {
        if (path.length === 1) {
          newErrors['__invitees_table__'] = { _: err.message };
        } else if (typeof path[1] === 'number') {
          const row = formData.invitees?.[path[1]];
          const field = (path[2] as string) ?? '_';
          if (row?.id) {
            if (!newErrors[row.id]) newErrors[row.id] = {};
            newErrors[row.id][field] = err.message;
          }
        }
      }
      if (path[0] === 'minister_invitees' && typeof path[1] === 'number') {
        const row = formData.minister_invitees?.[path[1]];
        const field = (path[2] as string) ?? '_';
        if (row?.id) {
          if (!newErrors[row.id]) newErrors[row.id] = {};
          newErrors[row.id][field] = err.message;
        }
      }
    });
    setErrors(newErrors);
    return false;
  }, [formData]);

  const handleAddInvitee = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      invitees: [...(prev.invitees ?? []), createEmptyStep3InviteeRow()],
    }));
  }, []);

  const handleDeleteInvitee = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees ?? []).filter((r) => r.id !== id),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTouched((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleUpdateInvitee = useCallback((id: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      invitees: (prev.invitees ?? []).map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
    setTouched((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: true },
    }));
  }, []);

  const handleAddMinisterInvitee = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      minister_invitees: [...(prev.minister_invitees ?? []), createEmptyStep3InviteeRow()],
    }));
  }, []);

  const handleDeleteMinisterInvitee = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      minister_invitees: (prev.minister_invitees ?? []).filter((r) => r.id !== id),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTouched((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleUpdateMinisterInvitee = useCallback((id: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      minister_invitees: (prev.minister_invitees ?? []).map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
    setTouched((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: true },
    }));
  }, []);

  const setProposerUserIds = useCallback((ids: string[]) => {
    setFormData((prev) => ({ ...prev, proposer_user_ids: ids }));
  }, []);

  const submitStep = useCallback(
    async (isDraft: boolean = false): Promise<void> => {
      const hasInvitees = (formData.invitees?.length ?? 0) > 0;
      if (!hasInvitees) {
        if (isDraft) {
          onSuccess?.(true);
          return;
        }
        setErrors({ __invitees_table__: { _: 'يجب إضافة مدعو واحد على الأقل' } });
        return;
      }
      if (!isDraft && !validateAll()) return;
      submitMutation.mutate({ formData, isDraft });
    },
    [formData, validateAll, submitMutation, onSuccess]
  );

  const ownerRowId = formData.invitees?.[0]?.isOwner ? formData.invitees[0].id : null;
  const nonDeletableInviteeIds = ownerRowId ? [ownerRowId] : [];

  return {
    formData,
    errors,
    touched,
    isSubmitting: submitMutation.isPending,
    handleAddInvitee,
    handleDeleteInvitee,
    handleUpdateInvitee,
    handleAddMinisterInvitee,
    handleDeleteMinisterInvitee,
    handleUpdateMinisterInvitee,
    setProposerUserIds,
    validateAll,
    submitStep,
    nonDeletableInviteeIds,
  };
};
