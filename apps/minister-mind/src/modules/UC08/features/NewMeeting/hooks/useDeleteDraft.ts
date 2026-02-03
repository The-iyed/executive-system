import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@auth/utils/axios';
import { PATH } from '../../../routes/paths';
import { clearDraftData } from '../utils/storage';

interface UseDeleteDraftProps {
  draftId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * API function to delete a draft
 */
const deleteDraft = async (draftId: string): Promise<void> => {
  await axiosInstance.delete(`/api/meeting-requests/drafts/${draftId}`);
};

/**
 * Shared hook for deleting meeting draft with confirmation modal
 * Can be used across all steps
 */
export const useDeleteDraft = ({
  draftId,
  onSuccess,
  onError,
}: UseDeleteDraftProps = {}) => {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // React Query mutation for deleting draft
  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      // Clear all draft data using utils
      clearDraftData();

      // Navigate to meetings list
      navigate(PATH.NEW_MEETING);

      // Call custom success callback if provided
      onSuccess?.();
    },
    onError: (error) => {
      const err = error instanceof Error ? error : new Error('حدث خطأ أثناء حذف المسودة');
      onError?.(err);
    },
  });

  /**
   * Open confirmation modal
   */
  const openConfirm = useCallback(() => {
    if (draftId) {
      setIsConfirmOpen(true);
    } else {
      // If no draft ID, just navigate away
      navigate(PATH.NEW_MEETING);
    }
  }, [draftId, navigate]);

  /**
   * Close confirmation modal
   */
  const closeConfirm = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  /**
   * Confirm and delete draft
   */
  const confirmDelete = useCallback(() => {
    if (draftId) {
      deleteMutation.mutate(draftId);
      setIsConfirmOpen(false);
    }
  }, [draftId, deleteMutation]);

  return {
    isConfirmOpen,
    isDeleting: deleteMutation.isPending,
    openConfirm,
    closeConfirm,
    confirmDelete,
  };
};
