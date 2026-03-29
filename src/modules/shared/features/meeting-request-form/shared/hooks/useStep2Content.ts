import { useState, useCallback, useRef } from "react";
import { MeetingStatus } from "../types/types";
import { MeetingStatusUnCommitted } from "@/modules/shared/types";

/* ─── Types ─── */

export interface ExistingAttachment {
  id: string;
  file_name: string;
  blob_url?: string;
  file_size?: number;
  file_type?: string;
  presentation_sequence?: number;
}

export interface Step2ContentInitialData {
  existingPresentations?: ExistingAttachment[];
  existingAdditionalFiles?: ExistingAttachment[];
  can_upload_more_than_one: boolean;
  hasExecutiveSummary?: boolean;
}

/* ─── State ─── */

interface Step2ContentState {
  /** New presentation file selected by the user (single file) */
  newPresentationFile: File | null;
  /** Existing presentation files from the server (with version info) */
  existingPresentations: ExistingAttachment[];
  /** New additional files selected by the user */
  additional_files: File[];
  /** Existing additional files from the server */
  existingAdditionalFiles: ExistingAttachment[];
  /** IDs of server attachments marked for deletion */
  deleted_attachment_ids: string[];
}

/* ─── Helpers ─── */

function buildInitialState(initial?: Step2ContentInitialData): Step2ContentState {
  return {
    newPresentationFile: null,
    existingPresentations: initial?.existingPresentations ?? [],
    additional_files: [],
    existingAdditionalFiles: initial?.existingAdditionalFiles ?? [],
    deleted_attachment_ids: [],
  };
}

/* ─── Hook ─── */

interface UseStep2ContentOptions {
  initialData?: Step2ContentInitialData;
  isEditMode?: boolean;
  meetingStatus?: string;
}

export function useStep2Content({
  initialData,
  isEditMode = false,
  meetingStatus,
}: UseStep2ContentOptions) {
  const hasSyncedRef = useRef(false);
  const [state, setState] = useState<Step2ContentState>(() => buildInitialState(initialData));

  // One-time sync when edit-mode data arrives asynchronously
  if (initialData && isEditMode && !hasSyncedRef.current) {
    const hasData =
      (initialData.existingPresentations?.length ?? 0) > 0 ||
      (initialData.existingAdditionalFiles?.length ?? 0) > 0;

    if (hasData) {
      hasSyncedRef.current = true;
      setState((prev) => ({
        ...prev,
        existingPresentations: initialData.existingPresentations ?? prev.existingPresentations,
        existingAdditionalFiles: initialData.existingAdditionalFiles ?? prev.existingAdditionalFiles,
      }));
    }
  }

  /* ── Computed ── */

  const isDraftStatus =
    !meetingStatus ||
    meetingStatus === MeetingStatusUnCommitted.DRAFT_UNCOMMITTED ||
    meetingStatus === MeetingStatus.DRAFT;

  const isReturnedStatus =
    meetingStatus === MeetingStatus.RETURNED_FROM_SCHEDULING ||
    meetingStatus === MeetingStatus.RETURNED_FROM_CONTENT || 
    meetingStatus === MeetingStatus.SCHEDULED;

  const hasPresentationFile =
    state.newPresentationFile !== null || state.existingPresentations.length > 0;

  const hasContent =
    state.newPresentationFile !== null ||
    state.additional_files.length > 0 ||
    state.deleted_attachment_ids.length > 0;

  /** Draft → free edit; Returned → can add one new version (no removing existing) */
  // const canUploadNewPresentation = !state.newPresentationFile && (isDraftStatus ? !hasPresentationFile : isReturnedStatus);
  // const canUploadNewPresentation = !state.newPresentationFile && (isDraftStatus ? !hasPresentationFile :  initialData?.can_upload_more_than_one);
  // const canUploadNewPresentation =
  // !state.newPresentationFile &&
  // (
  //   isDraftStatus ||
  //   initialData?.can_upload_more_than_one
  // );
  const hasExistingPresentation = state.existingPresentations.length > 0;

  const isScheduledContentOrScheduling =
    meetingStatus === MeetingStatus.SCHEDULED_SCHEDULING ||
    meetingStatus === MeetingStatus.SCHEDULED_CONTENT;

  const canUploadNewPresentation =
    !state.newPresentationFile &&
    (
      !hasExistingPresentation ||
      initialData?.hasExecutiveSummary ||
      initialData?.can_upload_more_than_one ||
      (!isScheduledContentOrScheduling && !initialData?.hasExecutiveSummary)
    );

  /** Allow deleting existing presentations when not in scheduled content/scheduling statuses */
  const canDeleteExistingPresentation =
    !isScheduledContentOrScheduling || isDraftStatus;

  /* ── Presentation actions ── */

  const uploadPresentation = useCallback((file: File) => {
    setState((prev) => ({ ...prev, newPresentationFile: file }));
  }, []);

  const removeNewPresentation = useCallback(() => {
    setState((prev) => ({ ...prev, newPresentationFile: null }));
  }, []);

  const removeExistingPresentation = useCallback((attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      existingPresentations: prev.existingPresentations.filter((f) => f.id !== attachmentId),
      deleted_attachment_ids: [...prev.deleted_attachment_ids, attachmentId],
    }));
  }, []);

  /* ── Additional files ── */

  const addAdditionalFiles = useCallback((files: File[]) => {
    setState((prev) => ({
      ...prev,
      additional_files: [...prev.additional_files, ...files],
    }));
  }, []);

  const removeAdditionalFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      additional_files: prev.additional_files.filter((_, i) => i !== index),
    }));
  }, []);

  const deleteExistingAdditional = useCallback((attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      existingAdditionalFiles: prev.existingAdditionalFiles.filter((f) => f.id !== attachmentId),
      deleted_attachment_ids: [...prev.deleted_attachment_ids, attachmentId],
    }));
  }, []);

  /* ── Commit: promote new files → existing (called after successful step save) ── */

  const commitNewFiles = useCallback(() => {
    setState((prev) => {
      const promotedPresentations: ExistingAttachment[] = [];
      if (prev.newPresentationFile) {
        const maxSeq = prev.existingPresentations.reduce(
          (max, p) => Math.max(max, p.presentation_sequence ?? 0),
          0,
        );
        promotedPresentations.push({
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file_name: prev.newPresentationFile.name,
          file_size: prev.newPresentationFile.size,
          file_type: prev.newPresentationFile.type,
          presentation_sequence: maxSeq + 1,
        });
      }

      const promotedAdditional: ExistingAttachment[] = prev.additional_files.map((file) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      }));

      return {
        ...prev,
        newPresentationFile: null,
        existingPresentations: [...promotedPresentations, ...prev.existingPresentations],
        additional_files: [],
        existingAdditionalFiles: [...prev.existingAdditionalFiles, ...promotedAdditional],
        deleted_attachment_ids: [],
      };
    });
  }, []);

  /* ── Build FormData for API ── */

  const prepareFormData = useCallback((): FormData => {
    const fd = new FormData();

    if (state.newPresentationFile) {
      fd.append("presentation_files", state.newPresentationFile);
    }

    state.additional_files.forEach((file) => fd.append("additional_files", file));

    const uniqueDeleted = [...new Set(state.deleted_attachment_ids)];
    if (uniqueDeleted.length > 0) {
      fd.append("deleted_attachment_ids", JSON.stringify(uniqueDeleted));
    }

    return fd;
  }, [state]);

  return {
    state,
    hasPresentationFile,
    hasContent,
    canUploadNewPresentation,
    canDeleteExistingPresentation,
    isReturnedStatus,

    // Presentation actions
    uploadPresentation,
    removeNewPresentation,
    removeExistingPresentation,

    // Additional file actions
    addAdditionalFiles,
    removeAdditionalFile,
    deleteExistingAdditional,

    commitNewFiles,
    prepareFormData,
  };
}