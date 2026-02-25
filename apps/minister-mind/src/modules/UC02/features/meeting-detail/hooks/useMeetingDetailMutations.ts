/**
 * Meeting detail mutations – reject, sendToContent, requestGuidance, etc.
 * Returns mutation objects for use in the detail page.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  rejectMeeting,
  sendToContent,
  requestGuidance,
  moveToWaitingList,
} from '../../../data/meetingsApi';

export interface UseMeetingDetailMutationsParams {
  meetingId: string | undefined;
  onRejectSuccess?: () => void;
  onSendToContentSuccess?: () => void;
  onRequestGuidanceSuccess?: () => void;
  onMoveToWaitingListSuccess?: () => void;
}

export function useMeetingDetailMutations({
  meetingId,
  onRejectSuccess,
  onSendToContentSuccess,
  onRequestGuidanceSuccess,
  onMoveToWaitingListSuccess,
}: UseMeetingDetailMutationsParams) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; notes: string }) =>
      rejectMeeting(meetingId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      onRejectSuccess?.();
      navigate(-1);
    },
  });

  const sendToContentMutation = useMutation({
    mutationFn: (payload: { notes: string; is_draft?: boolean }) =>
      sendToContent(meetingId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      onSendToContentSuccess?.();
    },
  });

  const requestGuidanceMutation = useMutation({
    mutationFn: (payload: { notes: string; is_draft?: boolean }) =>
      requestGuidance(meetingId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['guidance-records', meetingId] });
      onRequestGuidanceSuccess?.();
    },
  });

  const moveToWaitingListMutation = useMutation({
    mutationFn: () => moveToWaitingList(meetingId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      onMoveToWaitingListSuccess?.();
      navigate(-1);
    },
  });

  return {
    rejectMutation,
    sendToContentMutation,
    requestGuidanceMutation,
    moveToWaitingListMutation,
    queryClient,
  };
}
