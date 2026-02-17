import { MeetingCardData } from '@shared/components/meeting-card';
import { Directive } from '../data/meetingsApi';
import { MeetingStatus } from '@shared/types';

/**
 * Format date to Arabic format
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Format as: "الاثنين، 23 شعبان 1447 هـ"
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic',
      numberingSystem: 'arab',
    };
    
    const formatted = new Intl.DateTimeFormat('ar-SA', options).format(date);
    return formatted;
  } catch (error) {
    // Fallback to simple date format
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  }
};

/**
 * Map directive to MeetingCardData for table/card display
 */
export const mapDirectiveToCardData = (directive: Directive): MeetingCardData => {
  return {
    id: directive.id,
    title: directive.title,
    date: formatDate(directive.due_date),
    coordinator: directive.assignees || undefined,
    coordinatorAvatar: undefined,
    status: directive.status as MeetingStatus,
    statusLabel: directive.status === 'CURRENT' ? 'جاري' : directive.status,
    location: directive.due_date ? formatDate(directive.due_date) : undefined,
  };
};

