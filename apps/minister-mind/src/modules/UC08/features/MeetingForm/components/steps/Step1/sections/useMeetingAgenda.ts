import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { nanoid } from 'nanoid';

export interface MeetingAgendaRow {
  id: string;
  agenda_item?: string;
  presentation_duration_minutes?: string;
  minister_support_type?: string;
  minister_support_other?: string;
}

export interface UseMeetingAgendaProps {
  value: MeetingAgendaRow[] | undefined;
  onChange: (rows: MeetingAgendaRow[]) => void;
  tableErrors: Record<string, Record<string, string>>;
  setTableErrors: Dispatch<SetStateAction<Record<string, Record<string, string>>>>;
  tableTouched: Record<string, Record<string, boolean>>;
  setTableTouched: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>;
}

const defaultRow = (): MeetingAgendaRow => ({
  id: nanoid(),
  agenda_item: '',
  presentation_duration_minutes: '',
  minister_support_type: '',
  minister_support_other: '',
});

/**
 * Hook for أجندة الاجتماع (Meeting Agenda): add, update, remove with error/touched handling.
 * Mirrors UC01 Step1 agenda behavior in a clean, self-contained way.
 */
export function useMeetingAgenda({
  value,
  onChange,
  tableErrors,
  setTableErrors,
  tableTouched,
  setTableTouched,
}: UseMeetingAgendaProps) {
  const rows = value ?? [];

  const handleAdd = useCallback(() => {
    const newRow = defaultRow();
    onChange([newRow, ...rows]);
  }, [rows, onChange]);

  const handleDelete = useCallback(
    (id: string) => {
      onChange(rows.filter((r) => r.id !== id));
      setTableErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTableTouched((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [rows, onChange, setTableErrors, setTableTouched]
  );

  const handleUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      onChange(
        rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
      if (value != null && value !== '') {
        setTableErrors((prev) => {
          const next = { ...prev };
          if (next[id]) {
            const rowErrors = { ...next[id] };
            delete rowErrors[field];
            if (Object.keys(rowErrors).length === 0) {
              delete next[id];
            } else {
              next[id] = rowErrors;
            }
          }
          return next;
        });
      }
    },
    [rows, onChange, setTableErrors]
  );

  return {
    rows,
    handleAdd,
    handleDelete,
    handleUpdate,
    tableErrors,
    tableTouched,
  };
}
