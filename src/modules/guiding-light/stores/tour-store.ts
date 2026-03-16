import { create } from "zustand";

interface TourStore {
  openTour: (() => void) | null;
  setOpenTour: (fn: (() => void) | null) => void;
}

const useTourStore = create<TourStore>((set) => ({
  openTour: null,
  setOpenTour: (fn) => set({ openTour: fn }),
}));

export { useTourStore };
