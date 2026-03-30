/**
 * Shared request-notes feature types.
 */

export type NoteVariant = 'content' | 'scheduling' | 'general' | 'refusal' | 'cancellation';

export interface NoteItem {
  key: string;
  title: string;
  text: string;
  variant: NoteVariant;
}

export interface RequestNotesViewData {
  notes: NoteItem[];
}

export interface RequestNotesViewProps {
  data: RequestNotesViewData;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}
