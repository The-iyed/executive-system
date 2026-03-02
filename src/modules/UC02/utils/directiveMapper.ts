import { MeetingCardData } from '@/modules/shared/components/meeting-card';
import { formatDateArabic } from '@/modules/shared/utils';
import { Directive, PreviousDirectiveItem } from '../data/meetingsApi';
import { MeetingStatus } from '@/modules/shared/types';

/**
 * Map directive to MeetingCardData for table/card display (current directives)
 */
export const mapDirectiveToCardData = (directive: Directive): MeetingCardData => {
  return {
    id: directive.id,
    title: directive.title,
    date: formatDateArabic(directive.due_date),
    coordinator: directive.assignees || undefined,
    coordinatorAvatar: undefined,
    status: directive.status as MeetingStatus,
    statusLabel: directive.status === 'CURRENT' ? 'جاري' : directive.status,
    location: directive.due_date ? formatDateArabic(directive.due_date) : undefined,
  };
};

const DIRECTIVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  CLOSED: 'مغلق',
  CURRENT: 'جاري',
  CANCELLED: 'ملغي',
  COMPLETED: 'مكتمل',
};

/**
 * Map previous directive API item to MeetingCardData for table/card display
 */
export const mapPreviousDirectiveToCardData = (item: PreviousDirectiveItem): MeetingCardData => {
  const coordinator = Array.isArray(item.assignees) && item.assignees.length
    ? item.assignees.filter(Boolean).join('، ')
    : undefined;
  return {
    id: item.id,
    title: item.title,
    date: formatDateArabic(item.due_date),
    coordinator: coordinator ?? undefined,
    coordinatorAvatar: undefined,
    status: (item.status as MeetingStatus) ?? undefined,
    statusLabel: DIRECTIVE_STATUS_LABELS[item.status] ?? item.status ?? '—',
    location: item.due_date ? formatDateArabic(item.due_date) : undefined,
  };
};

