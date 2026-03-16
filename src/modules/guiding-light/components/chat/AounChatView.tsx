import { useCallback, useRef, useState } from "react";
import { PanelRightOpen, Search, Bookmark, PenSquare } from "lucide-react";
import { useChatStore } from "@gl/stores/chat-store";
import { useUrlSync } from "@gl/hooks/useUrlSync";
import { useMessages } from "@gl/hooks/chat/useMessages";
import { useChatMessages } from "@gl/hooks/chat/useChatMessages";
import { useMessageStreaming } from "@gl/hooks/chat/useMessageStreaming";
import { useSendMessage } from "@gl/hooks/chat/useSendMessage";
import { useAutoScroll } from "@gl/hooks/chat/useAutoScroll";
import { resetChatState } from "@gl/hooks/chat/chatRefs";
import { UserMessageBubble } from "./UserMessageBubble";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { IsicChoiceCard } from "./IsicChoiceCard";
import { ChatErrorMessage } from "./ChatErrorMessage";
import { AounChatInput } from "./AounChatInput";
import { AounConversationList } from "./AounConversationList";
import { AounEmptyState } from "./AounEmptyState";
import { DocAnalyzerBar } from "./DocAnalyzerBar";
import { ChatMessagesSkeleton } from "@gl/components/skeletons/ChatSkeleton";
import type { ChatMessage, ChatMode } from "@gl/api/types";
import { uploadDocument, waitForDocumentReady } from "@gl/api/document-analyzer/client";

export type FileUploadStatus = "uploading" | "processing" | "ready" | "error";
export interface FileUploadState {
  documentId?: string;
  status: FileUploadStatus;
  error?: string;
}

type SidebarState = "open" | "closing" | "closed";

function AounChatView() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversationIdStore = useChatStore((s) => s.setActiveConversationId);
  const startNewChatStore = useChatStore((s) => s.startNewChat);
  const { setConversation } = useUrlSync();
  const [sidebarState, setSidebarState] = useState<SidebarState>("open");

  const handleCloseSidebar = useCallback(() => {
    setSidebarState("closing");
    setTimeout(() => setSidebarState("closed"), 300);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setSidebarState("open");
  }, []);

  const setActiveConversationId = useCallback(
    (id: string) => { setConversation(id); setActiveConversationIdStore(id); },
    [setConversation, setActiveConversationIdStore]
  );

  const handleNewChat = useCallback(() => {
    setConversation(undefined); startNewChatStore(); resetChatState();
  }, [setConversation, startNewChatStore]);

  const messagesQuery = useMessages(activeConversationId, 50, true);
  const messagesData = messagesQuery.data;

  const {
    newMessages, setNewMessages, isSending, setIsSending,
    streamingUpdateKey, setStreamingUpdateKey,
    isStreamingRef, pendingMessagesRef, stableMessagesRef,
    isSendingRef, isInSendingFlowRef, newlyCreatedConversationsRef,
    allMessages, getLatestMessageContent, moduleRefs,
  } = useChatMessages(activeConversationId, messagesData);

  const shouldAutoScrollRef = useRef(true);
  const { handleSendMessage, messagesContainerRef } = useMessageStreaming({
    id: activeConversationId,
    newMessages, setNewMessages, isSending, setIsSending,
    isSendingRef, isInSendingFlowRef, pendingMessagesRef, stableMessagesRef,
    isStreamingRef, setStreamingUpdateKey, newlyCreatedConversationsRef,
    messagesData, moduleRefs, shouldAutoScrollRef,
    onConversationCreated: (newId) => { setConversation(newId); setActiveConversationIdStore(newId); },
  });

  useAutoScroll({
    containerRef: messagesContainerRef as React.RefObject<HTMLDivElement>,
    isStreaming: isSending && (streamingUpdateKey > 0 || isStreamingRef.current),
    messageCount: allMessages.length,
    onScrollRequest: (should) => { shouldAutoScrollRef.current = should; },
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedMode, setSelectedMode] = useState<ChatMode>("normal");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileUploadStates, setFileUploadStates] = useState<Map<File, FileUploadState>>(new Map());

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[index];
      if (removed) {
        setFileUploadStates((states) => {
          const next = new Map(states);
          next.delete(removed);
          return next;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadFileImmediately = useCallback(async (file: File) => {
    setFileUploadStates((prev) => new Map(prev).set(file, { status: "uploading" }));
    try {
      const uploadRes = await uploadDocument(file);
      setFileUploadStates((prev) => new Map(prev).set(file, { status: "processing", documentId: uploadRes.document_id }));
      await waitForDocumentReady(uploadRes.document_id, (status) => {
        const stage = status.progress?.current_stage || status.status;
        if (stage === "ready") {
          setFileUploadStates((prev) => new Map(prev).set(file, { status: "ready", documentId: uploadRes.document_id }));
        }
      });
      setFileUploadStates((prev) => new Map(prev).set(file, { status: "ready", documentId: uploadRes.document_id }));
    } catch (err) {
      setFileUploadStates((prev) => new Map(prev).set(file, { status: "error", error: err instanceof Error ? err.message : "فشل رفع الملف" }));
    }
  }, []);

  const handleAttachFiles = useCallback((files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
    // In normal mode, upload immediately
    if (selectedMode === "normal" || !selectedMode) {
      files.forEach((f) => uploadFileImmediately(f));
    }
  }, [selectedMode, uploadFileImmediately]);

  const activeDocument = useChatStore((s) => s.activeDocument);
  const setActiveDocument = useChatStore((s) => s.setActiveDocument);

  // Wrap handleSendMessage to:
  // 1. Capture uploaded document_id and activate the doc analyzer bar
  // 2. Auto-inject active document_id into every subsequent message
  const wrappedHandleSendMessage = useCallback(
    async (
      messageText: string,
      files: File[],
      selectedSuggestion?: string | null,
      isicUserChoice?: string[] | "all",
      documentIds?: Map<string, string>
    ) => {
      // If there are new document IDs from this send, activate the first one
      if (documentIds && documentIds.size > 0) {
        const [fileName, docId] = documentIds.entries().next().value as [string, string];
        setActiveDocument({ documentId: docId, fileName });
      }

      // If doc analyzer is active and no new documentIds, inject the active one
      const activeDoc = useChatStore.getState().activeDocument;
      let mergedDocIds = documentIds;
      let isFollowup = false;
      if (activeDoc && (!documentIds || !Array.from(documentIds?.values?.() ?? []).includes(activeDoc.documentId))) {
        mergedDocIds = new Map(documentIds ?? []);
        mergedDocIds.set(activeDoc.fileName, activeDoc.documentId);
        // If activeDoc was already set before this send (no fresh documentIds), it's a followup
        isFollowup = !documentIds || documentIds.size === 0;
      }

      return handleSendMessage(messageText, files, selectedSuggestion, isicUserChoice, mergedDocIds, isFollowup ? "followup" : undefined);
    },
    [handleSendMessage, setActiveDocument]
  );

  const { handleSend, hasFilesStillUploading } = useSendMessage({
    inputValue, isStreaming: isSending, onSendMessage: wrappedHandleSendMessage,
    setInputValue, attachedFiles, setAttachedFiles,
    selectedSuggestion: selectedMode, messageCount: allMessages.length,
    fileUploadStates,
    setFileUploadStates,
  });

  const handleRegenerate = useCallback((messageIndex: number) => {
    const messagesUpTo = allMessages.slice(0, messageIndex);
    const lastUserMsg = [...messagesUpTo].reverse().find((m) => m.isSent);
    if (!lastUserMsg) return;
    wrappedHandleSendMessage(lastUserMsg.text, [], null);
  }, [allMessages, wrappedHandleSendMessage]);

  const handleIsicChoice = useCallback((choice: string[] | "all", displayText: string) => {
    wrappedHandleSendMessage(displayText, [], "stats", choice);
  }, [wrappedHandleSendMessage]);

  const renderMessage = (msg: ChatMessage, index: number) => {
    if (msg.isSent) return (
      <div key={msg.id} className="aoun-float-up" style={{ animationDelay: `${Math.min(index * 0.03, 0.15)}s` }}>
        <UserMessageBubble text={msg.text} files={msg.files} />
      </div>
    );
    if (msg.hasError) return (
      <div key={msg.id} className="aoun-float-up" style={{ animationDelay: "0.05s" }}>
        <ChatErrorMessage message={msg.errorMessage || "حدث خطأ"} />
      </div>
    );

    const latest = getLatestMessageContent(msg.id);
    const response = latest.response ?? msg.response;
    const effectiveText = latest.streamingContent || latest.text || msg.text || "";
    const showThinking = latest.isThinking || (latest.thinkingText?.length ?? 0) > 0;
    const hasContent = !!effectiveText.trim();
    const hasLetterDocs = response?.tool_used === "letter_response" && (response?.documents?.length ?? 0) > 0;
    const showBubble = hasContent || hasLetterDocs || latest.isPendingRequest || latest.isStreaming;

    return (
      <div key={msg.id} className="flex flex-col gap-3 aoun-float-up" style={{ animationDelay: `${Math.min(index * 0.03, 0.15)}s` }}>
        {showThinking && (
          <ThinkingIndicator
            thinkingText={latest.thinkingText ?? ""}
            isActive={latest.isThinking && !latest.isThinkingCompleted}
            isCompleted={latest.isThinkingCompleted ?? false}
          />
        )}
        {showBubble && (
          <AssistantMessageBubble
            content={effectiveText || " "}
            isStreaming={latest.isStreaming}
            isPendingRequest={latest.isPendingRequest}
            response={response}
            onRelatedQuestionClick={setInputValue}
            onRegenerate={() => handleRegenerate(index)}
          />
        )}
        {msg.isicChoice && (
          <IsicChoiceCard
            payload={msg.isicChoice}
            onSubmit={handleIsicChoice}
            disabled={isSending}
          />
        )}
      </div>
    );
  };

  const isLoadingMessages = messagesQuery.isLoading && !!activeConversationId;
  const showEmptyState = allMessages.length === 0 && !isSending && !isLoadingMessages;

  return (
    <div className="relative flex flex-1 min-h-0 h-full overflow-hidden" dir="rtl">
      {/* Main Chat Area — always full width */}
      <div className={`flex flex-1 min-h-0 overflow-hidden flex-col aoun-chat-bg transition-[padding] duration-300 ${sidebarState === "open" ? "pr-[336px]" : sidebarState === "closed" ? "pr-[72px]" : "pr-0"}`}>
        <div
          ref={messagesContainerRef as React.RefObject<HTMLDivElement>}
          className="flex-1 overflow-y-auto scrollbar-hide"
        >
          <div className="mx-auto max-w-3xl flex flex-col gap-5 px-5 py-6">
            {isLoadingMessages && <ChatMessagesSkeleton />}
            {showEmptyState && <AounEmptyState onSuggestionClick={setInputValue} />}
            {allMessages.map((msg, i) => renderMessage(msg, i))}
          </div>
        </div>

        <div className="shrink-0 px-5 pb-6 pt-2">
          <DocAnalyzerBar />
          <div className="mx-auto max-w-2xl">
            <AounChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={isSending || hasFilesStillUploading}
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
              attachedFiles={attachedFiles}
              onAttach={handleAttachFiles}
              onRemoveFile={handleRemoveFile}
              fileUploadStates={fileUploadStates}
            />
          </div>
        </div>
      </div>

      {/* Floating sidebar overlay */}
      {sidebarState === "open" && (
        <>
          <div
            className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px] z-10 md:hidden"
            onClick={handleCloseSidebar}
          />
          <div className="aoun-floating-sidebar aoun-sidebar-enter z-20">
            <AounConversationList
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewChat={handleNewChat}
              onCollapse={handleCloseSidebar}
            />
          </div>
        </>
      )}

      {sidebarState === "closing" && (
        <div className="aoun-floating-sidebar aoun-sidebar-exit z-20">
          <AounConversationList
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewChat={handleNewChat}
            onCollapse={() => {}}
          />
        </div>
      )}

      {/* Collapsed mini-bar */}
      {sidebarState === "closed" && (
        <div className="aoun-collapsed-bar sidebar-icons-enter-left z-20">
          <button
            onClick={handleOpenSidebar}
            className="size-10 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-primary/10 flex items-center justify-center transition-all duration-200"
            title="فتح المحادثات"
          >
            <PanelRightOpen className="size-[18px]" />
          </button>
          <button
            className="size-10 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-primary/10 flex items-center justify-center transition-all duration-200"
            title="بحث"
          >
            <Search className="size-[18px]" />
          </button>

          <div className="flex-1" />

          <button
            className="size-10 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-primary/10 flex items-center justify-center transition-all duration-200"
            title="الإجابات المحفوظة"
          >
            <Bookmark className="size-[18px]" />
          </button>
          <button
            onClick={handleNewChat}
            className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
            title="محادثة جديدة"
          >
            <PenSquare className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}

export { AounChatView };
