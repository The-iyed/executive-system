import { create } from "zustand";

interface ModalDataMap {
  delegation: { meetingId: string; aiRecommendation?: string };
  search: Record<string, never>;
  "meeting-request": Record<string, never>;
}

type ModalName = keyof ModalDataMap;

interface ModalState {
  activeModal: ModalName | null;
  modalData: ModalDataMap[ModalName] | null;
  openModal: <T extends ModalName>(name: T, data: ModalDataMap[T]) => void;
  closeModal: () => void;
}

const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (name, data) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

function useModalData<T extends ModalName>(name: T) {
  return useModalStore((s) =>
    s.activeModal === name ? (s.modalData as ModalDataMap[T]) : null,
  );
}

export { useModalStore, useModalData };
export type { ModalName, ModalDataMap };
