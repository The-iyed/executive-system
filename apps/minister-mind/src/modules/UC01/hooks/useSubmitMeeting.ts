import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@sanad-ai/ui';
import { MeetingStatus } from '@shared/types';
import { submitDraft, resubmitToScheduling, resubmitToContent } from '../data/draftApi';

export const SUCCESS_MESSAGE = 'تم الإرسال بنجاح';
export const ERROR_MESSAGE = 'حدث خطأ أثناء الإرسال';
export const STATUS_CAN_NOT_SUBMIT = "لا يمكن الإرسال في هذه الحالة";

const STATUS_TO_API: Record<string, (draftId: string) => Promise<unknown>> = {
  [MeetingStatus.DRAFT]: submitDraft,
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: resubmitToScheduling,
  [MeetingStatus.RETURNED_FROM_CONTENT]: resubmitToContent,
};

export interface SubmitMeetingParams {
  meetingId: string;
  status: string;
}

export interface UseSubmitMeetingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useSubmitMeeting(options: UseSubmitMeetingOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    successMessage = SUCCESS_MESSAGE,
    errorMessage = ERROR_MESSAGE,
  } = options;

  const mutation = useMutation({
    mutationFn: async ({ meetingId, status }: SubmitMeetingParams) => {
      const api = STATUS_TO_API[status];
      if (!api) {
        throw new Error(STATUS_CAN_NOT_SUBMIT);
      }
      return api(meetingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'uc01'] });
      toast({ title: successMessage });
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      const err = error instanceof Error ? error : new Error(errorMessage);
      const message = err?.message ?? errorMessage;
      toast({ title: 'حدث خطأ', description: message, variant: 'destructive' });
      onErrorCallback?.(err);
    },
  });

  const submittingMeetingId =
    mutation.isPending && mutation.variables != null ? mutation.variables.meetingId : null;
  const submittingStatus = mutation.variables?.status ?? null;

  return {
    submitMeeting: mutation.mutate,
    submitMeetingAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    submittingMeetingId,
    submittingStatus,
    error: mutation.error,
  };
}