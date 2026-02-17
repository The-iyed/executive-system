import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@auth/utils/axios';
import { PATH } from '../../../routes/paths';
import { clearDraftData } from '../utils';

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
      clearDraftData();
      navigate(PATH.MEETINGS);

      // Call custom success callback if provided
      onSuccess?.();
    },
    onError: (error: unknown) => {
      let message = 'حدث خطأ أثناء حذف المسودة';

      if (error && typeof error === 'object') {
        const anyError = error as { detail?: unknown };
        if (typeof anyError.detail === 'string') {
          message = anyError.detail;
        }
      } else if (typeof error === 'string') {
        message = error;
      }

      const err = error instanceof Error ? error : new Error(message);
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
      navigate(PATH.MEETINGS);
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
