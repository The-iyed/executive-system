import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDraft } from '../../data/draftApi';

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-basket'] });
      setTargetId(null);
      setConfirmOpen(false);
    },
  });

  const requestDelete = useCallback((id: string) => {
    setTargetId(id);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (targetId) mutation.mutate(targetId);
  }, [targetId, mutation]);

  const cancel = useCallback(() => {
    setConfirmOpen(false);
    setTargetId(null);
  }, []);

  return {
    confirmOpen,
    targetId,
    isPending: mutation.isPending,
    requestDelete,
    confirmDelete,
    cancel,
    setConfirmOpen,
  };
}
