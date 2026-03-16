import { useCallback } from "react";
import type { FileUploadState } from "@gl/components/chat/AounChatView";

interface UseSendMessageProps {
  inputValue: string;
  isStreaming: boolean;
  onSendMessage?: (
    message: string,
    files: File[],
    selectedSuggestion?: string | null,
    isicUserChoice?: string[] | "all",
    documentIds?: Map<string, string>
  ) => Promise<void>;
  setInputValue: (value: string) => void;
  attachedFiles?: File[];
  setAttachedFiles?: (files: File[] | ((prev: File[]) => File[])) => void;
  selectedSuggestion?: string | null;
  /** Used to detect documents-analyzer first message (files-only). Omit or 0 = no messages yet. */
  messageCount?: number;
  fileUploadStates?: Map<File, FileUploadState>;
  setFileUploadStates?: React.Dispatch<React.SetStateAction<Map<File, FileUploadState>>>;
}

export function useSendMessage({
  inputValue,
  isStreaming,
  onSendMessage,
  setInputValue,
  attachedFiles = [],
  setAttachedFiles,
  selectedSuggestion = null,
  messageCount = 0,
  fileUploadStates,
  setFileUploadStates,
}: UseSendMessageProps) {
  const isLettersMode = selectedSuggestion === "letters";
  const isDocumentsAnalyzerMode = selectedSuggestion === "documentsAnalyzer";
  const isFirstDocumentAnalysis =
    isDocumentsAnalyzerMode && messageCount === 0;

  const hasFilesStillUploading = (() => {
    if (!fileUploadStates || attachedFiles.length === 0) return false;
    return attachedFiles.some((file) => {
      const state = fileUploadStates.get(file);
      return state && (state.status === "uploading" || state.status === "processing");
    });
  })();

  const hasContent = (() => {
    if (isLettersMode) return attachedFiles.length > 0;
    if (isFirstDocumentAnalysis) return attachedFiles.length > 0;
    if (isDocumentsAnalyzerMode)
      return !!inputValue?.trim() || attachedFiles.length > 0;
    return !!inputValue?.trim() || attachedFiles.length > 0;
  })();

  const handleSend = useCallback(
    async (_e?: React.MouseEvent<HTMLButtonElement>) => {
      if (!hasContent || isStreaming || hasFilesStillUploading || !onSendMessage) return;
      const textToSend = inputValue?.trim() || "";
      const filesToSend = [...attachedFiles];

      // Collect pre-uploaded document IDs (file name → document_id)
      const documentIds = new Map<string, string>();
      if (fileUploadStates) {
        for (const file of filesToSend) {
          const state = fileUploadStates.get(file);
          if (state?.documentId && (state.status === "ready" || state.status === "processing")) {
            documentIds.set(file.name, state.documentId);
          }
        }
      }

      setInputValue("");
      if (setAttachedFiles) setAttachedFiles([]);
      if (setFileUploadStates) setFileUploadStates(new Map());
      try {
        await onSendMessage(textToSend, filesToSend, selectedSuggestion, undefined, documentIds.size > 0 ? documentIds : undefined);
      } catch {
        setInputValue(textToSend);
        if (setAttachedFiles && filesToSend.length > 0) setAttachedFiles(filesToSend);
      }
    },
    [
      inputValue,
      isStreaming,
      onSendMessage,
      setInputValue,
      attachedFiles,
      setAttachedFiles,
      selectedSuggestion,
      messageCount,
      hasContent,
      fileUploadStates,
      setFileUploadStates,
    ]
  );

  const isSendDisabled = isStreaming || !hasContent || hasFilesStillUploading;

  return { handleSend, isSendDisabled, hasFilesStillUploading };
}
