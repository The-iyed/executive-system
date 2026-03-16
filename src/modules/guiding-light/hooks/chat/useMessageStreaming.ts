import { useCallback, useRef } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { sendLegislatorMessageStream } from "@gl/api/legislator/conversations";
import type {
  ChatMessage,
  SendMessageRequest,
  StreamingEvent,
  MessagesResponse,
} from "@gl/api/types";
import {
  parseStreamingContent,
  getStreamingDisplayContent,
  convertApiMessageToChatMessage,
  splitConcatenatedUrls,
} from "@gl/lib/messageParsing";
import { useCreateConversation } from "./useCreateConversation";
import type { DocumentWithId } from "@gl/api/types";

const ERROR_SENDING = "حدث خطأ أثناء الإرسال";

interface UseMessageStreamingProps {
  id: string | undefined;
  newMessages: ChatMessage[];
  setNewMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  isSendingRef: React.MutableRefObject<boolean>;
  isInSendingFlowRef: React.MutableRefObject<boolean>;
  pendingMessagesRef: React.MutableRefObject<ChatMessage[]>;
  stableMessagesRef: React.MutableRefObject<ChatMessage[]>;
  isStreamingRef: React.MutableRefObject<boolean>;
  setStreamingUpdateKey: React.Dispatch<React.SetStateAction<number>>;
  newlyCreatedConversationsRef: React.MutableRefObject<Set<string>>;
  messagesData?: InfiniteData<MessagesResponse>;
  moduleRefs: {
    pendingMessages: React.MutableRefObject<ChatMessage[]>;
    stableMessages: React.MutableRefObject<ChatMessage[]>;
    isSending: React.MutableRefObject<boolean>;
    isInSendingFlow: React.MutableRefObject<boolean>;
    newlyCreatedConversations: React.MutableRefObject<Set<string>>;
    isStreaming: React.MutableRefObject<boolean>;
    streamingUpdateKey: React.MutableRefObject<number>;
  };
  shouldAutoScrollRef?: React.MutableRefObject<boolean>;
  onConversationCreated?: (conversationId: string) => void;
}

export function useMessageStreaming({
  id,
  newMessages,
  setNewMessages,
  isSending,
  setIsSending,
  isSendingRef,
  isInSendingFlowRef,
  pendingMessagesRef,
  stableMessagesRef,
  isStreamingRef,
  setStreamingUpdateKey,
  newlyCreatedConversationsRef,
  messagesData,
  moduleRefs,
  shouldAutoScrollRef,
  onConversationCreated,
}: UseMessageStreamingProps) {
  const queryClient = useQueryClient();
  /** Accumulates thinking chunks in order; reset at start of each send so batched events don't reorder. */
  const thinkingTextAccumulatorRef = useRef("");
  /** UI-selected tool for the current send; used in streaming/done so we never fall back to "normale" when another tool was selected. */
  const initialToolUsedRef = useRef<string>("");
  const createConversation = useCreateConversation();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTimeRef = useRef(0);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const smoothScrollToBottom = useCallback(
    (isStreaming: boolean) => {
      const container = messagesContainerRef.current;
      if (!container || shouldAutoScrollRef?.current === false) return;
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;
      const delay = isStreaming ? 100 : 0;
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
        scrollThrottleRef.current = null;
      }
      const perform = () => {
        if (!messagesContainerRef.current) return;
        if (isStreaming && timeSinceLastScroll < delay) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        } else {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
        lastScrollTimeRef.current = Date.now();
      };
      if (timeSinceLastScroll >= delay) {
        requestAnimationFrame(perform);
      } else {
        scrollThrottleRef.current = setTimeout(
          () => requestAnimationFrame(perform),
          delay - timeSinceLastScroll
        );
      }
    },
    [shouldAutoScrollRef]
  );

  const handleSendMessage = useCallback(
    async (
      messageText: string,
      files: File[],
      selectedSuggestion?: string | null,
      isicUserChoice?: string[] | "all",
      documentIds?: Map<string, string>,
      tag?: string
    ) => {
      if (isSending || isSendingRef.current) return;

      isSendingRef.current = true;
      moduleRefs.isSending.current = true;
      setIsSending(true);
      isInSendingFlowRef.current = true;
      moduleRefs.isInSendingFlow.current = true;
      isStreamingRef.current = true;
      moduleRefs.isStreaming.current = true;

      if (id) {
        newlyCreatedConversationsRef.current.add(id);
        moduleRefs.newlyCreatedConversations.current.add(id);
      }

      const timestamp = Date.now();
      const sentMessageId = `sent-${timestamp}-${Math.random().toString(36).slice(2, 9)}`;
      const responseMessageId = `response-${timestamp}-${Math.random().toString(36).slice(2, 9)}`;

      const pdfFile = files.find((f) => f.type === "application/pdf");

      const isDocumentsAnalyzer = selectedSuggestion === "documentsAnalyzer";
      const letterResponse = selectedSuggestion === "letters";
      const initialToolUsed = isDocumentsAnalyzer
        ? "documents-analyzer"
        : selectedSuggestion === "stats"
          ? "stats"
          : selectedSuggestion === "benchmarking"
            ? "benchmarking"
            : letterResponse
              ? "letter_response"
              : selectedSuggestion === "deepSearch"
                ? "deep_search"
                : selectedSuggestion === "webSearch"
                  ? "web_search"
                  : "";

      initialToolUsedRef.current = initialToolUsed || "normale";

      // Only attach document list to assistant for letter_response (assistant attaches PDF).
      // For documents-analyzer, user files are shown on the user bubble only, not on assistant.
      const initialDocuments: DocumentWithId[] | undefined = letterResponse
        ? pdfFile
          ? [{ name: pdfFile.name, id: undefined }]
          : files.length > 0
            ? files.map((f) => ({ name: f.name, id: undefined }))
            : undefined
        : undefined;

      if (selectedSuggestion === "letters" && !pdfFile) {
        isSendingRef.current = false;
        moduleRefs.isSending.current = false;
        setIsSending(false);
        isInSendingFlowRef.current = false;
        moduleRefs.isInSendingFlow.current = false;
        isStreamingRef.current = false;
        moduleRefs.isStreaming.current = false;
        return;
      }

      const sentMessage: ChatMessage = {
        id: sentMessageId,
        text: messageText,
        isSent: true,
        timestamp: new Date(timestamp),
        files: files.length > 0 ? files : undefined,
      };

      const responseMessage: ChatMessage = {
        id: responseMessageId,
        text: "",
        isSent: false,
        streamingContent: "",
        isStreaming: true,
        isPendingRequest: true,
        isThinking: false,
        thinkingText: "",
        isThinkingCompleted: false,
        timestamp: new Date(timestamp + 1),
        response: {
          response: "",
          related: null,
          tool_used: initialToolUsed || "normale",
          sources_documents: [],
          documents: initialDocuments,
          related_questions: [],
          conversation_id: id || "",
          thread_id: "",
          agent_run_id: "",
          processing_time_seconds: 0,
          is_new_thread: false,
          debug_info: null,
        },
      };

      const messagesToAdd = [sentMessage, responseMessage];
      const apiMessages = messagesData?.pages
        ? messagesData.pages
            .flatMap((p) => p.messages)
            .map((m, i) => convertApiMessageToChatMessage(m, i))
        : [];
      const messageMap = new Map<string, ChatMessage>();
      apiMessages.forEach((msg) => {
        if (msg.id) messageMap.set(msg.id, msg);
      });
      newMessages.forEach((msg) => {
        if (msg.id) messageMap.set(msg.id, msg);
      });
      messagesToAdd.forEach((msg) => {
        if (msg.id) messageMap.set(msg.id, msg);
      });
      const updatedMessages = Array.from(messageMap.values()).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      thinkingTextAccumulatorRef.current = "";
      pendingMessagesRef.current = updatedMessages;
      stableMessagesRef.current = updatedMessages;
      moduleRefs.pendingMessages.current = updatedMessages;
      moduleRefs.stableMessages.current = updatedMessages;
      setNewMessages(updatedMessages);

      let conversationId = id;

      try {
        if (!conversationId) {
          const response = await createConversation.mutateAsync({
            name: messageText.slice(0, 50) || "محادثة جديدة",
          });
          conversationId = response.conversation_id;
          newlyCreatedConversationsRef.current.add(conversationId);
          moduleRefs.newlyCreatedConversations.current.add(conversationId);
          onConversationCreated?.(conversationId);
        }

        let lastUpdateTime = 0;
        const updateThrottle = 16;
        let pendingChunks: string[] = [];
        let updateTimeout: ReturnType<typeof setTimeout> | null = null;
        /** Full raw stream for final parse on completion; display during stream uses getStreamingDisplayContent only */
        let streamingRawAccumulator = "";

        // Same as super-agent-v1: finalFiles for finalDocuments order on completion
        const finalFiles = !isDocumentsAnalyzer ? files : [];
        const letterResponse = initialToolUsedRef.current === "letter_response";
        const finalSuggestionNormal =
          initialToolUsedRef.current === "normale" || initialToolUsedRef.current === "";

        const flushUpdates = () => {
          if (pendingChunks.length === 0) return;
          const chunksToProcess = [...pendingChunks];
          pendingChunks = [];
          updateTimeout = null;

          streamingRawAccumulator += chunksToProcess.join("");

          const source =
            moduleRefs.pendingMessages.current.length > 0
              ? moduleRefs.pendingMessages.current
              : moduleRefs.stableMessages.current.length > 0
                ? moduleRefs.stableMessages.current
                : pendingMessagesRef.current.length > 0
                  ? pendingMessagesRef.current
                  : stableMessagesRef.current;

          const updated = source.length > 0 ? [...source] : [];
          const idx = updated.findIndex((m) => m.id === responseMessageId);
          if (idx === -1) {
            lastUpdateTime = Date.now();
            return;
          }

          const current = updated[idx];
          const existingResponse = current.response;
          const currentToolUsed =
            existingResponse?.tool_used ||
            initialToolUsedRef.current ||
            "normale";
          // During streaming: show only main markdown body; hide related questions/documents until completed to avoid weird rerenders
          const displayContent = getStreamingDisplayContent(streamingRawAccumulator, currentToolUsed);

          updated[idx] = {
            ...current,
            streamingContent: displayContent,
            text: displayContent,
            isStreaming: true,
            isPendingRequest: false,
            response: {
              ...existingResponse!,
              response: displayContent,
              // Keep documents/related_questions empty during stream so UI doesn't show partial lists
              documents: existingResponse?.documents ?? [],
              related_questions: existingResponse?.related_questions ?? [],
            },
          };

          const newMessagesArray = updated.map((msg) => ({
            ...msg,
            streamingContent: msg.streamingContent !== undefined ? msg.streamingContent : (msg.text || ""),
            text: msg.text !== undefined ? msg.text : (msg.streamingContent || ""),
            isStreaming: msg.isStreaming !== undefined ? msg.isStreaming : false,
          }));

          pendingMessagesRef.current = newMessagesArray;
          stableMessagesRef.current = newMessagesArray;
          moduleRefs.pendingMessages.current = newMessagesArray;
          moduleRefs.stableMessages.current = newMessagesArray;
          moduleRefs.streamingUpdateKey.current += 1;
          setStreamingUpdateKey(moduleRefs.streamingUpdateKey.current);
          setNewMessages(newMessagesArray);
          smoothScrollToBottom(true);
          lastUpdateTime = Date.now();
        };

        const errorHandler = (error: Error | unknown) => {
          if (pendingChunks.length > 0) flushUpdates();
          const source =
            newMessages.length > 0
              ? newMessages
              : pendingMessagesRef.current.length > 0
                ? pendingMessagesRef.current
                : stableMessagesRef.current;
          const updated = [...source];
          const idx = updated.findIndex((m) => m.id === responseMessageId);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              hasError: true,
              isStreaming: false,
              isPendingRequest: false,
              isThinking: false,
              isThinkingCompleted: false,
              errorMessage:
                error instanceof Error ? error.message : ERROR_SENDING,
            };
            pendingMessagesRef.current = updated;
            stableMessagesRef.current = updated;
            moduleRefs.pendingMessages.current = updated;
            moduleRefs.stableMessages.current = updated;
            setNewMessages(updated);
          }
          isSendingRef.current = false;
          moduleRefs.isSending.current = false;
          isStreamingRef.current = false;
          moduleRefs.isStreaming.current = false;
          isInSendingFlowRef.current = false;
          moduleRefs.isInSendingFlow.current = false;
          setIsSending(false);
        };

        const handleStreamEvent = (event: StreamingEvent) => {
          const clearPending = () => {
            const source =
              pendingMessagesRef.current.length > 0
                ? pendingMessagesRef.current
                : stableMessagesRef.current;
            const updated = [...source];
            const idx = updated.findIndex((m) => m.id === responseMessageId);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                isPendingRequest: false,
              };
              pendingMessagesRef.current = updated;
              stableMessagesRef.current = updated;
              moduleRefs.pendingMessages.current = updated;
              moduleRefs.stableMessages.current = updated;
              setNewMessages(updated);
            }
          };

          clearPending();

          switch (event.event) {
            case "message_posted": {
              if (event.status === "processing") {
                setNewMessages((prev) => {
                  const src =
                    prev.length > 0
                      ? prev
                      : pendingMessagesRef.current.length > 0
                        ? pendingMessagesRef.current
                        : stableMessagesRef.current;
                  const up = [...src];
                  const i = up.findIndex((m) => m.id === responseMessageId);
                  if (i === -1) return prev;
                  up[i] = {
                    ...up[i],
                    isStreaming: true,
                    isThinking: true,
                    thinkingText: "",
                    isThinkingCompleted: false,
                  };
                  pendingMessagesRef.current = up;
                  stableMessagesRef.current = up;
                  moduleRefs.pendingMessages.current = up;
                  moduleRefs.stableMessages.current = up;
                  return up;
                });
              }
              break;
            }
            case "run_created":
            case "processing_tools":
            case "submitting_tools": {
              setNewMessages((prev) => {
                const src =
                  prev.length > 0
                    ? prev
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : stableMessagesRef.current;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                up[i] = {
                  ...cur,
                  isStreaming: true,
                  isThinking: true,
                  thinkingText: cur.thinkingText || "",
                  isThinkingCompleted: false,
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              break;
            }
            case "uploading_pdf":
            case "pdf_analyzed":
              break;
            case "pdf_uploaded": {
              // Only attach PDF to assistant for letter_response; for documents-analyzer the file stays on the user bubble
              if (event.pdf_url && initialToolUsed === "letter_response") {
                setNewMessages((prev) => {
                  const src =
                    prev.length > 0
                      ? prev
                      : pendingMessagesRef.current.length > 0
                        ? pendingMessagesRef.current
                        : stableMessagesRef.current;
                  const up = [...src];
                  const i = up.findIndex((m) => m.id === responseMessageId);
                  if (i === -1) return prev;
                  const cur = up[i];
                  const existingResponse = cur.response;
                  let updatedDocuments: DocumentWithId[] = [];
                  if (
                    existingResponse?.documents &&
                    existingResponse.documents.length > 0
                  ) {
                    updatedDocuments = existingResponse.documents.map(
                      (doc, index) => {
                        if (
                          index === 0 &&
                          pdfFile &&
                          doc.name === pdfFile.name
                        ) {
                          return { ...doc, url: event.pdf_url };
                        }
                        return doc;
                      }
                    );
                  } else if (pdfFile) {
                    updatedDocuments = [
                      { name: pdfFile.name, url: event.pdf_url },
                    ];
                  }
                  up[i] = {
                    ...cur,
                    response: {
                      ...existingResponse!,
                      documents:
                        updatedDocuments.length > 0
                          ? updatedDocuments
                          : existingResponse?.documents,
                    },
                  };
                  pendingMessagesRef.current = up;
                  stableMessagesRef.current = up;
                  moduleRefs.pendingMessages.current = up;
                  moduleRefs.stableMessages.current = up;
                  return up;
                });
              }
              break;
            }
            case "control":
              break;
            case "thinking": {
              const chunk =
                event.chunk || event.data || event.content || event.message || "";
              if (chunk) {
                thinkingTextAccumulatorRef.current += chunk;
              }
              const accumulated = thinkingTextAccumulatorRef.current;
              setNewMessages((prev) => {
                const src =
                  prev.length > 0
                    ? prev
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : stableMessagesRef.current;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                up[i] = {
                  ...cur,
                  isPendingRequest: false,
                  isThinking: true,
                  thinkingText: accumulated,
                  isThinkingCompleted: false,
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              break;
            }
            case "context": {
              const requestId =
                event.request_id ?? event.session_id ?? "";
              if (!requestId) break;
              setNewMessages((prev) => {
                const src =
                  prev.length > 0
                    ? prev
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : stableMessagesRef.current;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                const existingResponse: any = cur.response || {};
                const preservedDebug =
                  (existingResponse.debug_info as Record<string, unknown>) || {};
                const debug_info = {
                  ...preservedDebug,
                  request_id: requestId,
                  ...(event.message_id != null && event.message_id !== ""
                    ? { message_id: event.message_id }
                    : {}),
                };
                up[i] = {
                  ...cur,
                  response: {
                    ...existingResponse,
                    tool_used:
                      event.tool_used ?? existingResponse.tool_used ?? "",
                    has_chart_data:
                      event.has_chart_data ?? existingResponse.has_chart_data,
                    debug_info: debug_info,
                  },
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              break;
            }
            case "query_result": {
              const requestId =
                event.request_id ?? event.session_id ?? "";
              if (!requestId) break;
              setNewMessages((prev) => {
                const src =
                  prev.length > 0
                    ? prev
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : stableMessagesRef.current;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                const existingResponse: any = cur.response || {};
                const preservedDebug =
                  (existingResponse.debug_info as Record<string, unknown>) || {};
                const debug_info = {
                  ...preservedDebug,
                  request_id: requestId,
                  ...(event.message_id != null && event.message_id !== ""
                    ? { message_id: event.message_id }
                    : {}),
                };
                up[i] = {
                  ...cur,
                  response: {
                    ...existingResponse,
                    tool_used:
                      event.tool_used ?? existingResponse.tool_used ?? "",
                    has_chart_data:
                      event.has_chart_data ?? existingResponse.has_chart_data,
                    debug_info: debug_info,
                  },
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              break;
            }
            case "chunk":
            case "content_chunk":
            case "synthesis_chunk":
            case "summary_chunk": {
              const chunk = event.chunk || event.content || event.data || "";
              if (chunk) {
                pendingChunks.push(chunk);
                const now = Date.now();
                if (now - lastUpdateTime >= updateThrottle) {
                  if (updateTimeout) {
                    clearTimeout(updateTimeout);
                    updateTimeout = null;
                  }
                  flushUpdates();
                } else if (!updateTimeout) {
                  updateTimeout = setTimeout(flushUpdates, updateThrottle);
                }
              }
              break;
            }
            case "isic_choice_required": {
              const isicPayload = {
                options: event.options ?? [],
                ISIC_IDs: event.ISIC_IDs ?? [],
                user_search_term: event.user_search_term ?? "",
                MASTER_ACTIVITY_NAME: event.MASTER_ACTIVITY_NAME ?? "",
              };
              setNewMessages((prev) => {
                const src =
                  prev.length > 0
                    ? prev
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : stableMessagesRef.current;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                up[i] = {
                  ...cur,
                  isPendingRequest: false,
                  isicChoice: isicPayload,
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              break;
            }
            case "completed":
            case "done": {
              // When done with isic_choice_required, finalize streaming but preserve isicChoice
              if (event.isic_choice_required) {
                setNewMessages((prev) => {
                  const src =
                    moduleRefs.pendingMessages.current.length > 0
                      ? moduleRefs.pendingMessages.current
                      : pendingMessagesRef.current.length > 0
                        ? pendingMessagesRef.current
                        : moduleRefs.stableMessages.current.length > 0
                          ? moduleRefs.stableMessages.current
                          : stableMessagesRef.current.length > 0
                            ? stableMessagesRef.current
                            : prev;
                  const up = [...src];
                  const i = up.findIndex((m) => m.id === responseMessageId);
                  if (i === -1) return prev;
                  const cur = up[i];
                  const serverMessageId =
                    event.message_id && String(event.message_id).trim()
                      ? String(event.message_id).trim()
                      : null;
                  up[i] = {
                    ...cur,
                    id: serverMessageId ?? cur.id,
                    isStreaming: false,
                    isPendingRequest: false,
                    isThinking: false,
                    isThinkingCompleted: true,
                    thinkingText: cur.thinkingText || thinkingTextAccumulatorRef.current || "",
                    response: {
                      ...(cur.response || ({} as any)),
                      conversation_id: event.conversation_id || conversationId || "",
                      tool_used: cur.response?.tool_used || initialToolUsedRef.current || "stats",
                    },
                  };
                  pendingMessagesRef.current = up;
                  stableMessagesRef.current = up;
                  moduleRefs.pendingMessages.current = up;
                  moduleRefs.stableMessages.current = up;
                  return up;
                });
                isSendingRef.current = false;
                moduleRefs.isSending.current = false;
                isStreamingRef.current = false;
                moduleRefs.isStreaming.current = false;
                isInSendingFlowRef.current = false;
                moduleRefs.isInSendingFlow.current = false;
                setIsSending(false);
                break;
              }

              if (pendingChunks.length > 0) flushUpdates();
              setNewMessages((prev) => {
                // Use refs first so we have the latest streamingContent from flushUpdates (prev can be stale)
                const src =
                  moduleRefs.pendingMessages.current.length > 0
                    ? moduleRefs.pendingMessages.current
                    : pendingMessagesRef.current.length > 0
                      ? pendingMessagesRef.current
                      : moduleRefs.stableMessages.current.length > 0
                        ? moduleRefs.stableMessages.current
                        : stableMessagesRef.current.length > 0
                          ? stableMessagesRef.current
                          : prev;
                const up = [...src];
                const i = up.findIndex((m) => m.id === responseMessageId);
                if (i === -1) return prev;
                const cur = up[i];
                // Use full accumulated raw stream so related questions/documents are parsed and shown on completion
                const finalContent =
                  streamingRawAccumulator ||
                  cur.streamingContent ||
                  cur.text ||
                  (event.content ?? "");
                const existingResponse: any = cur.response || {};
                const toolUsed =
                  existingResponse?.tool_used ||
                  initialToolUsedRef.current ||
                  event.tool_used ||
                  (event.has_chart_data ? "stats" : "normale");
                const {
                  cleanContent,
                  documentNames,
                  documents: parsedDocuments,
                  relatedQuestions: parsedRelatedQuestions,
                } = parseStreamingContent(finalContent, toolUsed);
                // Same as super-agent-v1: event.sources_documents → splitConcatenatedUrls; same finalDocuments order
                const finalSources =
                  (event.sources_documents?.length ?? 0) > 0
                    ? splitConcatenatedUrls(event.sources_documents)
                    : (documentNames.length > 0 ? documentNames : (existingResponse.sources_documents ?? []));
                let finalDocuments: DocumentWithId[] =
                  (parsedDocuments?.length ?? 0) > 0 ? parsedDocuments : (existingResponse?.documents ?? []);
                if ((letterResponse || finalSuggestionNormal) && pdfFile && (!parsedDocuments || parsedDocuments.length === 0)) {
                  finalDocuments = [{ name: pdfFile.name, id: undefined }];
                } else if (finalSuggestionNormal && finalFiles.length > 0 && (!parsedDocuments || parsedDocuments.length === 0)) {
                  finalDocuments = finalFiles.map((f) => ({ name: f.name, id: undefined }));
                } else if (existingResponse?.documents && existingResponse.documents.length > 0) {
                  finalDocuments = existingResponse.documents as DocumentWithId[];
                }
                const finalRelatedQuestions =
                  (event.related_questions?.length ?? 0) > 0
                    ? event.related_questions
                    : (parsedRelatedQuestions?.length ?? 0) > 0
                      ? parsedRelatedQuestions
                      : existingResponse.related_questions ?? [];
                const preservedDebug =
                  (existingResponse.debug_info as Record<string, unknown>) || {};
                const debug_info = {
                  ...preservedDebug,
                  ...(event.request_id != null && event.request_id !== ""
                    ? { request_id: event.request_id }
                    : {}),
                  ...(event.message_id != null && event.message_id !== ""
                    ? { message_id: event.message_id }
                    : {}),
                };
                const serverMessageId =
                  event.message_id && String(event.message_id).trim()
                    ? String(event.message_id).trim()
                    : null;
                const finalId = serverMessageId ?? cur.id;
                up[i] = {
                  ...cur,
                  id: finalId,
                  isStreaming: false,
                  text: cleanContent,
                  streamingContent: cleanContent,
                  isPendingRequest: false,
                  isThinking: false,
                  isThinkingCompleted: true,
                  thinkingText: cur.thinkingText || "",
                  response: {
                    ...existingResponse,
                    response: cleanContent,
                    conversation_id:
                      event.conversation_id || conversationId || "",
                    thread_id: event.thread_id || "",
                    tool_used: toolUsed,
                    sources_documents: finalSources,
                    documents: finalDocuments.length > 0 ? finalDocuments : existingResponse?.documents,
                    related_questions: finalRelatedQuestions,
                    has_chart_data:
                      event.has_chart_data ?? existingResponse.has_chart_data ?? false,
                    debug_info:
                      Object.keys(debug_info).length > 0 ? debug_info : null,
                  },
                };
                pendingMessagesRef.current = up;
                stableMessagesRef.current = up;
                moduleRefs.pendingMessages.current = up;
                moduleRefs.stableMessages.current = up;
                return up;
              });
              isSendingRef.current = false;
              moduleRefs.isSending.current = false;
              isStreamingRef.current = false;
              moduleRefs.isStreaming.current = false;
              isInSendingFlowRef.current = false;
              moduleRefs.isInSendingFlow.current = false;
              setIsSending(false);
              break;
            }
            case "error":
              errorHandler(new Error(event.error || "Unknown error"));
              break;
            default:
              break;
          }
        };

        const hasFile = files.length > 0;
        const isLetters = selectedSuggestion === "letters";

        {
          // --- Standard legislator flow ---
          const request: SendMessageRequest = {
            query: messageText || undefined,
            deep_search: selectedSuggestion === "deepSearch" || undefined,
            web_search: selectedSuggestion === "webSearch" || undefined,
            letter_response: (isLetters && hasFile) || undefined,
            document_analyzer: isDocumentsAnalyzer || undefined,
            stats: selectedSuggestion === "stats" || undefined,
            benchmarking: selectedSuggestion === "benchmarking" || undefined,
            tag: tag || undefined,
          };
          if (files.length > 0) request.files = files;
          if (isicUserChoice !== undefined)
            request.isic_user_choice = isicUserChoice;
          // Pass pre-uploaded document IDs to the gateway
          if (documentIds && documentIds.size > 0) {
            request.document_ids = documentIds;
          }

          await sendLegislatorMessageStream(
            conversationId,
            request,
            handleStreamEvent,
            errorHandler
          );
        }
      } catch (err) {
        const source =
          newMessages.length > 0
            ? newMessages
            : pendingMessagesRef.current.length > 0
              ? pendingMessagesRef.current
              : stableMessagesRef.current;
        const updated = [...source];
        const idx = updated.findIndex((m) => m.id === responseMessageId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            hasError: true,
            isStreaming: false,
            isPendingRequest: false,
            errorMessage:
              err instanceof Error ? err.message : ERROR_SENDING,
          };
          setNewMessages(updated);
        }
        isSendingRef.current = false;
        moduleRefs.isSending.current = false;
        isStreamingRef.current = false;
        moduleRefs.isStreaming.current = false;
        isInSendingFlowRef.current = false;
        moduleRefs.isInSendingFlow.current = false;
        setIsSending(false);
      }
    },
    [
      id,
      isSending,
      isSendingRef,
      setIsSending,
      isInSendingFlowRef,
      isStreamingRef,
      pendingMessagesRef,
      stableMessagesRef,
      setNewMessages,
      setStreamingUpdateKey,
      newlyCreatedConversationsRef,
      messagesData,
      moduleRefs,
      createConversation,
      queryClient,
      smoothScrollToBottom,
      onConversationCreated,
    ]
  );

  return {
    handleSendMessage,
    messagesContainerRef,
  };
}
