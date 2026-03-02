/**
 * Sum of presentation_duration_minutes across agenda rows.
 * Used by MeetingAgendaTable for duration summary and validation (UC01/UC02).
 */
export function getAgendaTotalDurationMinutes(
  agenda: Array<Record<string, unknown>> | undefined
): number {
  if (!agenda?.length) return 0;
  return agenda.reduce((sum, item) => {
    const n = parseInt(String(item.presentation_duration_minutes ?? ''), 10);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);
}
