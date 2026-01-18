import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@auth/utils/axios';
import type { Step3FormData } from './schema';

interface UseStep3Props {
  draftId: string;
  initialData?: Partial<Step3FormData>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface SchedulingPayload {
  selected_time_slot_id?: string;
  alternative_time_slot_id_1?: string;
  alternative_time_slot_id_2?: string;
  meeting_channel?: string;
  requires_protocol?: boolean;
  notes?: string;
}

export const useStep3 = ({
  draftId,
  initialData,
  onSuccess,
  onError,
}: UseStep3Props) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Step3FormData>>({
    meetingChannel: '',
    requiresProtocol: false,
    notes: '',
    ...initialData,
  });

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

  const handleChange = useCallback((field: keyof Step3FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    
    // Add form fields
    if (formData.meetingChannel) {
      payload.meeting_channel = formData.meetingChannel;
    }
    if (formData.requiresProtocol !== undefined) {
      payload.requires_protocol = formData.requiresProtocol;
    }
    if (formData.notes) {
      payload.notes = formData.notes;
    }

    submitMutation.mutate(payload);
  }, [submitMutation, onSuccess, onError, formData]);

  return {
    selectedSlots,
    toggleSlotSelection,
    submitStep,
    isSubmitting: submitMutation.isPending,
    formData,
    handleChange,
  };
};
