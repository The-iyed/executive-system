import { create } from "zustand";

interface ActiveDocument {
  documentId: string;
  fileName: string;
}

interface ChatState {
  activeConversationId: string | undefined;
  setActiveConversationId: (id: string | undefined) => void;
  startNewChat: () => void;
  activeDocument: ActiveDocument | null;
  setActiveDocument: (doc: ActiveDocument | null) => void;
  clearActiveDocument: () => void;
}

const useChatStore = create<ChatState>((set) => ({
  activeConversationId: undefined,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  startNewChat: () => set({ activeConversationId: undefined, activeDocument: null }),
  activeDocument: null,
  setActiveDocument: (doc) => set({ activeDocument: doc }),
  clearActiveDocument: () => set({ activeDocument: null }),
}));

export { useChatStore };
export type { ActiveDocument };
