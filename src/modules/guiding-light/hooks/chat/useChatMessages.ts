import {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import type { ChatMessage } from "@gl/api/types";
import type { InfiniteData } from "@tanstack/react-query";
import type { MessagesResponse } from "@gl/api/types";
import { convertApiMessageToChatMessage } from "@gl/lib/messageParsing";
import {
  modulePendingMessagesRef,
  moduleStableMessagesRef,
  moduleIsSendingRef,
  moduleIsInSendingFlowRef,
  moduleNewlyCreatedConversationsRef,
  moduleIsStreamingRef,
  moduleStreamingUpdateKeyRef,
} from "./chatRefs";

export function useChatMessages(
  id: string | undefined,
  messagesData: InfiniteData<MessagesResponse> | undefined
) {
  const [newMessages, setNewMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [streamingUpdateKey, setStreamingUpdateKey] = useState(
    moduleStreamingUpdateKeyRef.current
  );

  const isStreamingRef = useRef(moduleIsStreamingRef.current);
  const pendingMessagesRef = useRef<ChatMessage[]>(
    modulePendingMessagesRef.current
  );
  const stableMessagesRef = useRef<ChatMessage[]>(
    moduleStableMessagesRef.current
  );
  const isSendingRef = useRef(moduleIsSendingRef.current);
  const isInSendingFlowRef = useRef(moduleIsInSendingFlowRef.current);
  const newlyCreatedConversationsRef = useRef<Set<string>>(
    new Set(moduleNewlyCreatedConversationsRef.current)
  );

  // Same as super-agent-v1: restore streaming state from module ref after remount
  if (!isStreamingRef.current && moduleIsStreamingRef.current) {
    isStreamingRef.current = moduleIsStreamingRef.current;
  }

  // Restore streamingUpdateKey from module ref after remount if streaming is active
  useEffect(() => {
    if (
      moduleIsStreamingRef.current &&
      moduleStreamingUpdateKeyRef.current > 0 &&
      streamingUpdateKey === 0
    ) {
      setStreamingUpdateKey(moduleStreamingUpdateKeyRef.current);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setNewMessages([]);
      setIsSending(false);
      setStreamingUpdateKey(0);
      pendingMessagesRef.current = [];
      stableMessagesRef.current = [];
      isSendingRef.current = false;
      isInSendingFlowRef.current = false;
      newlyCreatedConversationsRef.current.clear();
      isStreamingRef.current = false;
    }
  }, [id]);

  // Same as super-agent-v1: keep module streaming key in sync
  useEffect(() => {
    if (streamingUpdateKey > 0) {
      moduleStreamingUpdateKeyRef.current = streamingUpdateKey;
    }
  }, [streamingUpdateKey]);

  // Same as super-agent-v1: update stable ref when messages set; restore from ref when state empty but sending
  useEffect(() => {
    if (newMessages.length > 0) {
      stableMessagesRef.current = newMessages;
      moduleStableMessagesRef.current = newMessages;
    } else if (isSendingRef.current || isInSendingFlowRef.current) {
      if (
        moduleStableMessagesRef.current.length > 0 &&
        newMessages.length === 0
      ) {
        stableMessagesRef.current = [...moduleStableMessagesRef.current];
        setNewMessages([...moduleStableMessagesRef.current]);
      } else if (
        stableMessagesRef.current.length > 0 &&
        newMessages.length === 0
      ) {
        setNewMessages([...stableMessagesRef.current]);
      }
    }
  }, [newMessages.length, isSending]);

  const allMessages = useMemo(() => {
    // Same as super-agent-v1: only include API messages when we have a valid id
    const apiMessages =
      id && messagesData?.pages
        ? messagesData.pages
            .flatMap((page) => page.messages)
            .map((msg, i) => convertApiMessageToChatMessage(msg, i))
        : [];

    let messagesToUse = newMessages;

    // Same as super-agent-v1: effectiveStreamingKey and isStreaming
    const effectiveStreamingKey =
      streamingUpdateKey > 0
        ? streamingUpdateKey
        : isStreamingRef.current
          ? moduleStreamingUpdateKeyRef.current
          : 0;
    const isStreaming =
      effectiveStreamingKey > 0 ||
      isStreamingRef.current ||
      moduleIsStreamingRef.current;

    if (isStreaming) {
      // Same as super-agent-v1: for streaming, use refs (check module pending first, then stable, etc.)
      let sourceRef: ChatMessage[] = [];

      if (modulePendingMessagesRef.current.length > 0) {
        const hasStreamingMessage = modulePendingMessagesRef.current.some((m) =>
          m.id?.includes("response")
        );
        if (hasStreamingMessage) sourceRef = modulePendingMessagesRef.current;
      }
      if (!sourceRef.length && moduleStableMessagesRef.current.length > 0) {
        const hasStreamingMessage = moduleStableMessagesRef.current.some((m) =>
          m.id?.includes("response")
        );
        if (hasStreamingMessage) sourceRef = moduleStableMessagesRef.current;
      }
      if (!sourceRef.length && pendingMessagesRef.current.length > 0) {
        const hasStreamingMessage = pendingMessagesRef.current.some((m) =>
          m.id?.includes("response")
        );
        if (hasStreamingMessage) sourceRef = pendingMessagesRef.current;
      }
      if (!sourceRef.length && stableMessagesRef.current.length > 0) {
        const hasStreamingMessage = stableMessagesRef.current.some((m) =>
          m.id?.includes("response")
        );
        if (hasStreamingMessage) sourceRef = stableMessagesRef.current;
      }

      if (sourceRef.length > 0) {
        messagesToUse = sourceRef.map((msg) => {
          const hasStreamingContent = "streamingContent" in msg;
          const streamingContentValue = hasStreamingContent
            ? (msg.streamingContent !== undefined ? msg.streamingContent : "")
            : (msg.text ?? "");
          const textValue =
            "text" in msg && msg.text !== undefined
              ? msg.text
              : hasStreamingContent && msg.streamingContent
                ? msg.streamingContent
                : "";
          return {
            ...msg,
            streamingContent: streamingContentValue,
            text: textValue,
            isStreaming: msg.isStreaming !== undefined ? msg.isStreaming : false,
          };
        });
      } else if (newMessages.length > 0) {
        messagesToUse = newMessages;
      }
    } else if (
      isSendingRef.current ||
      isInSendingFlowRef.current ||
      (newMessages.length === 0 &&
        (pendingMessagesRef.current.length > 0 ||
          stableMessagesRef.current.length > 0 ||
          modulePendingMessagesRef.current.length > 0 ||
          moduleStableMessagesRef.current.length > 0))
    ) {
      const sourceRef =
        pendingMessagesRef.current.length > 0
          ? pendingMessagesRef.current
          : modulePendingMessagesRef.current.length > 0
            ? modulePendingMessagesRef.current
            : stableMessagesRef.current.length > 0
              ? stableMessagesRef.current
              : moduleStableMessagesRef.current;
      if (sourceRef.length > 0) {
        messagesToUse = sourceRef.map((msg) => ({
          ...msg,
          streamingContent:
            msg.streamingContent !== undefined ? msg.streamingContent : (msg.text ?? ""),
          text: msg.text !== undefined ? msg.text : (msg.streamingContent ?? ""),
          isStreaming: msg.isStreaming !== undefined ? msg.isStreaming : false,
        }));
      }
    }

    // Same as super-agent-v1: merge API first, then messagesToUse (only dedupe sent by content)
    const messageMap = new Map<string, ChatMessage>();
    apiMessages.forEach((msg) => {
      if (msg.id) messageMap.set(msg.id, msg);
    });

    const apiSentContents = new Set(
      apiMessages
        .filter((msg) => msg.isSent)
        .map((msg) => msg.text?.trim())
        .filter(Boolean)
    );

    messagesToUse.forEach((msg) => {
      if (
        msg.isSent &&
        msg.id?.startsWith("sent-") &&
        msg.text &&
        apiSentContents.has(msg.text.trim())
      ) {
        return;
      }
      if (msg.id) messageMap.set(msg.id, msg);
    });

    return Array.from(messageMap.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [id, messagesData, newMessages, streamingUpdateKey]);

  const getLatestMessageContent = useCallback(
    (
      messageId: string
    ): {
      streamingContent: string;
      text: string;
      isStreaming: boolean;
      isPendingRequest?: boolean;
      isThinking?: boolean;
      thinkingText?: string;
      isThinkingCompleted?: boolean;
      response?: import("@gl/api/types").MessageResponse;
    } => {
      const checkRef = (ref: ChatMessage[]) => {
        const msg = ref.find((m) => m.id === messageId);
        if (msg)
          return {
            streamingContent:
              msg.streamingContent ?? msg.text ?? "",
            text: msg.text ?? msg.streamingContent ?? "",
            isStreaming: msg.isStreaming ?? false,
            isPendingRequest: msg.isPendingRequest ?? false,
            isThinking: msg.isThinking ?? false,
            thinkingText: msg.thinkingText ?? "",
            isThinkingCompleted: msg.isThinkingCompleted ?? false,
            response: msg.response,
          };
        return null;
      };

      const sources = [
        modulePendingMessagesRef.current,
        moduleStableMessagesRef.current,
        pendingMessagesRef.current,
        stableMessagesRef.current,
      ];
      for (const ref of sources) {
        const result = checkRef(ref);
        if (
          result &&
          (result.streamingContent ||
            result.text ||
            result.isStreaming ||
            result.isThinking ||
            result.isThinkingCompleted ||
            result.response)
        )
          return result;
      }
      const stateMsg = checkRef(newMessages);
      if (stateMsg) return stateMsg;
      return {
        streamingContent: "",
        text: "",
        isStreaming: false,
        isThinking: false,
        thinkingText: "",
        isThinkingCompleted: false,
        response: undefined,
      };
    },
    [newMessages]
  );

  return {
    newMessages,
    setNewMessages,
    isSending,
    setIsSending,
    streamingUpdateKey,
    setStreamingUpdateKey,
    isStreamingRef,
    pendingMessagesRef,
    stableMessagesRef,
    isSendingRef,
    isInSendingFlowRef,
    newlyCreatedConversationsRef,
    allMessages,
    getLatestMessageContent,
    moduleRefs: {
      pendingMessages: modulePendingMessagesRef,
      stableMessages: moduleStableMessagesRef,
      isSending: moduleIsSendingRef,
      isInSendingFlow: moduleIsInSendingFlowRef,
      newlyCreatedConversations: moduleNewlyCreatedConversationsRef,
      isStreaming: moduleIsStreamingRef,
      streamingUpdateKey: moduleStreamingUpdateKeyRef,
    },
  };
}
