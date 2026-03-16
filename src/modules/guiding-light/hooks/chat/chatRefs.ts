import type { ChatMessage } from "@gl/api/types";

export const modulePendingMessagesRef = { current: [] as ChatMessage[] };
export const moduleStableMessagesRef = { current: [] as ChatMessage[] };
export const moduleIsSendingRef = { current: false };
export const moduleIsInSendingFlowRef = { current: false };
export const moduleNewlyCreatedConversationsRef = { current: new Set<string>() };
export const moduleIsStreamingRef = { current: false };
export const moduleStreamingUpdateKeyRef = { current: 0 };

export function resetChatState() {
  modulePendingMessagesRef.current = [];
  moduleStableMessagesRef.current = [];
  moduleIsSendingRef.current = false;
  moduleIsInSendingFlowRef.current = false;
  moduleNewlyCreatedConversationsRef.current.clear();
  moduleIsStreamingRef.current = false;
  moduleStreamingUpdateKeyRef.current = 0;
}
