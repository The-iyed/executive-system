import { useMutation } from "@tanstack/react-query";
import { saveDraftBasicInfo, saveDraftContent, saveDraftInvitees, submitDraft, resubmitToScheduling, resubmitToContent, createSchedulerStep1, saveSchedulerStep2Content, saveSchedulerStep3Invitees } from "../api";

// ── Step 1: Basic Info ──────────────────────────────────────────────────────

interface SaveBasicInfoParams {
  formData: FormData;
  draftId?: string | null;
}

export function useSaveDraftBasicInfo() {
  return useMutation({
    mutationFn: ({ formData, draftId }: SaveBasicInfoParams) =>
      saveDraftBasicInfo(formData, draftId),
  });
}

// ── Scheduler Step 1: Direct Schedule ────────────────────────────────────────

export function useCreateSchedulerStep1() {
  return useMutation({
    mutationFn: ({ formData, meetingId }: { formData: FormData; meetingId?: string | null }) =>
      createSchedulerStep1(formData, meetingId),
  });
}

// ── Step 2: Content ─────────────────────────────────────────────────────────

interface SaveContentParams {
  draftId: string;
  payload: FormData;
}

export function useSaveDraftContent() {
  return useMutation({
    mutationFn: ({ draftId, payload }: SaveContentParams) =>
      saveDraftContent(draftId, payload),
  });
}

// ── Scheduler Step 2: Content ───────────────────────────────────────────────

interface SaveSchedulerContentParams {
  meetingId: string;
  payload: FormData;
}

export function useSaveSchedulerStep2Content() {
  return useMutation({
    mutationFn: ({ meetingId, payload }: SaveSchedulerContentParams) =>
      saveSchedulerStep2Content(meetingId, payload),
  });
}

// ── Step 3: Invitees ────────────────────────────────────────────────────────

interface SaveInviteesParams {
  draftId: string;
  invitees: Record<string, unknown>[];
  is_content_updated?: boolean;
}

export function useSaveDraftInvitees() {
  return useMutation({
    mutationFn: ({ draftId, invitees, is_content_updated }: SaveInviteesParams) =>
      saveDraftInvitees(draftId, invitees, is_content_updated),
  });
}

// ── Scheduler Step 3: Invitees ──────────────────────────────────────────────

interface SaveSchedulerInviteesParams {
  meetingId: string;
  invitees: Record<string, unknown>[];
  schedule?: boolean;
}

export function useSaveSchedulerStep3Invitees() {
  return useMutation({
    mutationFn: ({ meetingId, invitees,  schedule }: SaveSchedulerInviteesParams) =>
      saveSchedulerStep3Invitees(meetingId, invitees, schedule),
  });
}

// ── Submit / Resubmit ───────────────────────────────────────────────────────

export function useSubmitDraft() {
  return useMutation({
    mutationFn: (draftId: string) => submitDraft(draftId),
  });
}

export function useResubmitToScheduling() {
  return useMutation({
    mutationFn: (draftId: string) => resubmitToScheduling(draftId),
  });
}

export function useResubmitToContent() {
  return useMutation({
    mutationFn: (draftId: string) => resubmitToContent(draftId),
  });
}