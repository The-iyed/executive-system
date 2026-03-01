import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Step1FormData } from '../schemas/step1.schema';

export const DEFAULT_AGENDA_ROW = {
  id: '',
  agenda_item: '',
  presentation_duration_minutes: '',
  minister_support_type: '',
  minister_support_other: '',
} as const;

function createNewAgendaRow() {
  return {
    id: nanoid(),
    agenda_item: '',
    presentation_duration_minutes: '',
    minister_support_type: '',
    minister_support_other: '',
  };
}

export interface UseMeetingAgendaParams {
  agenda: NonNullable<Step1FormData['meetingAgenda']>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Step1FormData>>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof Step1FormData, string>>>>;
  setTableErrors: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string>>>
  >;
}

export interface UseMeetingAgendaReturn {
  /** Adds a new agenda row and returns its id (for scrolling into view). */
  handleAddAgenda: () => string;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: unknown) => void;
}

export function useMeetingAgenda({
  agenda,
  setFormData,
  setErrors,
  setTableErrors,
}: UseMeetingAgendaParams): UseMeetingAgendaReturn {
  const handleAddAgenda = useCallback((): string => {
    const newRow = createNewAgendaRow();
    const updatedAgenda = [...(agenda || []), newRow];

    setFormData((prev) => ({
      ...prev,
      meetingAgenda: updatedAgenda,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.meetingAgenda;
      return next;
    });

    setTableErrors((prev) => {
      const next = { ...prev };
      updatedAgenda.forEach((row) => {
        delete next[row.id];
      });
      return next;
    });

    return newRow.id;
  }, [agenda, setFormData, setErrors, setTableErrors]);

  const handleDeleteAgenda = useCallback(
    (id: string) => {
      setFormData((prev) => ({
        ...prev,
        meetingAgenda: (prev.meetingAgenda || []).filter((a) => a.id !== id),
      }));
    },
    [setFormData]
  );

  const handleUpdateAgenda = useCallback(
    (id: string, field: string, value: unknown) => {
      setFormData((prev) => ({
        ...prev,
        meetingAgenda: (prev.meetingAgenda || []).map((a) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));

      if (value !== undefined && value !== null && value !== '') {
        setTableErrors((prev) => {
          const next = { ...prev };
          if (next[id]) {
            delete next[id][field];
            if (Object.keys(next[id]).length === 0) delete next[id];
          }
          return next;
        });
      }
    },
    [setFormData, setTableErrors]
  );

  return {
    handleAddAgenda,
    handleDeleteAgenda,
    handleUpdateAgenda,
  };
}
