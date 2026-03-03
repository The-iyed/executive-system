import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/modules/auth/utils/axios';
import { getUsers } from '@/modules/UC02/data/usersApi';
import {
  step3Schema,
  type Step3FormData,
  type InviteeFormRow,
} from '../schemas/step3.schema';
import {
  mapUserToStep3InviteeRow,
  createEmptyStep3InviteeRow,
} from '../utils/inviteeMappers';
import type { SuggestedAttendee } from '../../../hooks/useSuggestMeetingAttendees';
import type { Step1FormData } from '../schemas/step1.schema';

interface UseStep3Props {
  draftId: string;
  initialData?: Partial<Step3FormData>;
  step1FormData?: Pick<Partial<Step1FormData>, 'meetingOwner'>;
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
  const r = row as InviteeFormRow & { _objectGuid?: string; _isManual?: boolean };
  const object_guid = r._isManual === true ? undefined : r._objectGuid;
  return {
    object_guid,
    full_name: row.full_name,
    position_title: row.position_title ?? '',
    mobile_number: row.mobile_number,
    sector: (row as { sector?: string }).sector ?? '',
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
    body.minister_invitees = formData?.minister_invitees?.map(toBackendInvitee);
  }
  if ((formData.proposer_object_guids?.length ?? 0) > 0) {
    body.proposer_object_guids = formData.proposer_object_guids;
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
    proposer_object_guids: [],
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
        const user = res.items.find((u) => (u as { object_guid?: string }).object_guid === value || u.id === value);
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
      if (path[0] === 'minister_invitees') {
        if (path.length === 1) {
          newErrors['__minister_invitees_table__'] = { _: err.message };
        } else if (typeof path[1] === 'number') {
          const row = formData.minister_invitees?.[path[1]];
          const field = (path[2] as string) ?? '_';
          if (row?.id) {
            if (!newErrors[row.id]) newErrors[row.id] = {};
            newErrors[row.id][field] = err.message;
          }
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

  const handleAddSuggestedMinisterInvitees = useCallback((suggestions: SuggestedAttendee[]) => {
    if (!suggestions || suggestions.length === 0) return;
    setFormData((prev) => {
      const existing = prev.minister_invitees ?? [];
      const newRows = suggestions.map((s) => {
        const base = createEmptyStep3InviteeRow();
        const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ') || base.full_name;
        return {
          ...base,
          full_name: fullName,
          position_title: s.position_name || s.job_description || base.position_title,
          mobile_number: s.phone || base.mobile_number,
          sector: s.department_name || base.sector,
          email: s.email || base.email,
          attendance_mode: 'IN_PERSON',
          view_permission: false,
        } as InviteeFormRow;
      });
      return {
        ...prev,
        minister_invitees: [...newRows, ...existing],
      };
    });
  }, []);

  const setProposerObjectGuids = useCallback((ids: string[]) => {
    setFormData((prev) => ({ ...prev, proposer_object_guids: ids }));
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
    handleAddSuggestedMinisterInvitees,
    setProposerObjectGuids,
    validateAll,
    submitStep,
    nonDeletableInviteeIds,
  };
};
