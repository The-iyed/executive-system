import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';

interface UseStep3Props {
  draftId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface SchedulingPayload {
  selected_time_slot_id?: string;
  alternative_time_slot_id_1?: string;
  alternative_time_slot_id_2?: string;
}

export const useStep3 = ({
  draftId,
  onSuccess,
  onError,
}: UseStep3Props) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // React Query mutation for submitting scheduling
  const submitMutation = useMutation({
    mutationFn: async (payload: SchedulingPayload) => {
      const response = await axiosInstance.patch(
        `/api/meeting-requests/drafts/${draftId}/scheduling`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: any) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء الحفظ');
      onError?.(err);
    },
  });

  const toggleSlotSelection = useCallback((slotId: string) => {
    setSelectedSlots((prev) => {
      // If slot is already selected, remove it
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      }
      // If we already have 3 slots, don't add more
      if (prev.length >= 3) {
        return prev;
      }
      // Add the slot
      return [...prev, slotId];
    });
  }, []);

  const submitStep = useCallback(async (
    isDraft: boolean,
    selectedSlotIds: string[]
  ): Promise<void> => {
    // Validate: need at least 1 slot if not draft
    if (!isDraft && selectedSlotIds.length === 0) {
      const err = new Error('يرجى اختيار موعد واحد على الأقل');
      onError?.(err);
      return;
    }

    // If draft and no slots, skip API call
    if (isDraft && selectedSlotIds.length === 0) {
      onSuccess?.();
      return;
    }

    // Build payload
    const payload: SchedulingPayload = {};
    if (selectedSlotIds.length > 0) {
      payload.selected_time_slot_id = selectedSlotIds[0];
    }
    if (selectedSlotIds.length > 1) {
      payload.alternative_time_slot_id_1 = selectedSlotIds[1];
    }
    if (selectedSlotIds.length > 2) {
      payload.alternative_time_slot_id_2 = selectedSlotIds[2];
    }

    submitMutation.mutate(payload);
  }, [submitMutation, onSuccess, onError]);

  return {
    selectedSlots,
    toggleSlotSelection,
    submitStep,
    isSubmitting: submitMutation.isPending,
  };
};
