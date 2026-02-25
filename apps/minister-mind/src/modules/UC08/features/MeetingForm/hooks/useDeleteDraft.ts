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
  /** When set (e.g. drawer mode), close drawer instead of navigating to MEETINGS */
  onClose?: () => void;
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
  onClose,
}: UseDeleteDraftProps = {}) => {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // React Query mutation for deleting draft
  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      clearDraftData();
      if (onClose) {
        onClose();
      } else {
        navigate(PATH.MEETINGS);
      }
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
      // If no draft ID, close drawer or navigate away
      if (onClose) {
        onClose();
      } else {
        navigate(PATH.MEETINGS);
      }
    }
  }, [draftId, navigate, onClose]);

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
