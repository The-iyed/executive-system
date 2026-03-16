import { create } from "zustand";

type HeaderTab = "calendar" | "assistant" | "request" | "aoun" | "agents";

interface AppState {
  activeHeaderTab: HeaderTab;
  setActiveHeaderTab: (tab: HeaderTab) => void;
}

const useAppStore = create<AppState>((set) => ({
  activeHeaderTab: "calendar",
  setActiveHeaderTab: (tab) => set({ activeHeaderTab: tab }),
}));

export { useAppStore };
export type { HeaderTab };
