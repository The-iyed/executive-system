import { create } from "zustand";

type ViewMode = "daily" | "weekly" | "monthly";

interface ScheduleState {
  selectedDate: Date;
  viewMode: ViewMode;

  setSelectedDate: (date: Date) => void;
  setMonth: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
}

const useScheduleStore = create<ScheduleState>((set) => ({
  selectedDate: new Date(),
  viewMode: "daily",

  setSelectedDate: (date) => set({ selectedDate: date }),
  setMonth: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));

export { useScheduleStore };
export type { ViewMode };
