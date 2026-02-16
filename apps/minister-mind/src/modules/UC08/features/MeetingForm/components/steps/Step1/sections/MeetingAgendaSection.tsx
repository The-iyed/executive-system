import { type Dispatch, type SetStateAction } from 'react';
import { FormTable } from '@shared';
import { MEETING_AGENDA_COLUMNS } from '../../../../constants/step1.constants';
import { useMeetingAgenda, type MeetingAgendaRow } from './useMeetingAgenda';

export interface MeetingAgendaSectionProps {
  /** Current agenda rows (from form state) */
  value: MeetingAgendaRow[] | undefined;
  /** Called when agenda rows change */
  onChange: (rows: MeetingAgendaRow[]) => void;
  tableErrors: Record<string, Record<string, string>>;
  setTableErrors: Dispatch<SetStateAction<Record<string, Record<string, string>>>>;
  tableTouched: Record<string, Record<string, boolean>>;
  setTableTouched: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>;
  /** Form-level error for meetingAgenda (e.g. "يجب إضافة عنصر أجندة واحد على الأقل") */
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * أجندة الاجتماع (Meeting Agenda) – clean section like UC01 Step1.
 * Uses useMeetingAgenda for add, update, remove and error/touched handling.
 */
export function MeetingAgendaSection({
  value,
  onChange,
  tableErrors,
  setTableErrors,
  tableTouched,
  setTableTouched,
  errorMessage,
  required = false,
  disabled = false,
}: MeetingAgendaSectionProps) {
  const {
    rows,
    handleAdd,
    handleDelete,
    handleUpdate,
    tableErrors: agendaErrors,
    tableTouched: agendaTouched,
  } = useMeetingAgenda({
    value,
    onChange,
    tableErrors,
    setTableErrors,
    tableTouched,
    setTableTouched,
  });

  return (
    <FormTable
      title="أجندة الاجتماع"
      required={required}
      columns={MEETING_AGENDA_COLUMNS}
      rows={rows}
      onAddRow={handleAdd}
      onDeleteRow={handleDelete}
      onUpdateRow={handleUpdate}
      addButtonLabel="إضافة أجندة"
      errors={agendaErrors}
      touched={agendaTouched}
      errorMessage={errorMessage}
      disabled={disabled}
    />
  );
}
