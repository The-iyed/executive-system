import { useMutation } from "@tanstack/react-query";
import { saveDraftBasicInfo, saveDraftContent, saveDraftInvitees, submitDraft, resubmitToScheduling, resubmitToContent } from "../api";

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

// ── Step 3: Invitees ────────────────────────────────────────────────────────

interface SaveInviteesParams {
  draftId: string;
  invitees: Record<string, unknown>[];
}

export function useSaveDraftInvitees() {
  return useMutation({
    mutationFn: ({ draftId, invitees }: SaveInviteesParams) =>
      saveDraftInvitees(draftId, invitees),
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
