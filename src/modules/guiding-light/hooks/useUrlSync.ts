import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore, type HeaderTab } from "@gl/stores/app-store";
import { useChatStore } from "@gl/stores/chat-store";

const TAB_PARAM = "tab";
const CONVERSATION_PARAM = "conversation";
const ASSISTANT_SUBTAB_PARAM = "assistant";

const VALID_TABS: HeaderTab[] = ["calendar", "assistant", "request", "aoun", "agents"];
const DEFAULT_TAB: HeaderTab = "calendar";

const VALID_ASSISTANT_SUBTABS = ["voice", "written", "aoun"] as const;
const DEFAULT_ASSISTANT_SUBTAB = "aoun";

export type AssistantSubtab = (typeof VALID_ASSISTANT_SUBTABS)[number];

function parseTab(value: string | null): HeaderTab {
  if (value && VALID_TABS.includes(value as HeaderTab)) return value as HeaderTab;
  return DEFAULT_TAB;
}

function parseAssistantSubtab(value: string | null): AssistantSubtab {
  if (value && VALID_ASSISTANT_SUBTABS.includes(value as AssistantSubtab))
    return value as AssistantSubtab;
  return DEFAULT_ASSISTANT_SUBTAB;
}

/**
 * Syncs URL search params (?tab, ?conversation, ?assistant) with app and chat stores.
 * Call once in AppLayout. Also updates URL when params are missing (defaults).
 */
export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const setActiveHeaderTab = useAppStore((s) => s.setActiveHeaderTab);
  const setActiveConversationId = useChatStore((s) => s.setActiveConversationId);
  const startNewChat = useChatStore((s) => s.startNewChat);

  // URL -> stores (on mount and when user navigates back/forward)
  useEffect(() => {
    const tabParam = searchParams.get(TAB_PARAM);
    const conversationParam = searchParams.get(CONVERSATION_PARAM);
    const tab = parseTab(tabParam);

    setActiveHeaderTab(tab);

    // Apply conversation from search params for both aoun and assistant tabs
    if (tab === "assistant" || tab === "aoun") {
      if (conversationParam?.trim()) {
        setActiveConversationId(conversationParam.trim());
      } else {
        startNewChat();
      }
    }
  }, [searchParams, setActiveHeaderTab, setActiveConversationId, startNewChat]);

  return {
    searchParams,
    setSearchParams,
    tabParam: searchParams.get(TAB_PARAM),
    conversationParam: searchParams.get(CONVERSATION_PARAM),
    assistantSubtabParam: searchParams.get(ASSISTANT_SUBTAB_PARAM),
    setTab: (tab: HeaderTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(TAB_PARAM, tab);
        // Only clear conversation when leaving aoun/assistant (tabs that use it)
        if (tab !== "assistant" && tab !== "aoun") next.delete(CONVERSATION_PARAM);
        return next;
      });
    },
    setConversation: (id: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set(CONVERSATION_PARAM, id);
        else next.delete(CONVERSATION_PARAM);
        return next;
      });
    },
    setAssistantSubtab: (subtab: AssistantSubtab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(ASSISTANT_SUBTAB_PARAM, subtab);
        return next;
      });
    },
    getAssistantSubtab: () =>
      parseAssistantSubtab(searchParams.get(ASSISTANT_SUBTAB_PARAM)),
  };
}

export {
  TAB_PARAM,
  CONVERSATION_PARAM,
  ASSISTANT_SUBTAB_PARAM,
  DEFAULT_TAB,
  DEFAULT_ASSISTANT_SUBTAB,
  VALID_ASSISTANT_SUBTABS,
};
