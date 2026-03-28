/**
 * Shared Content Info feature types.
 * Used by ContentInfoView to display meeting content (files, notes, summaries).
 */

export interface ContentFileItem {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  blob_url: string | null;
  /** e.g. presentation sequence number */
  sequence?: number;
  /** e.g. "نسخة 2" */
  badge?: string | null;
}

export interface ContentInfoSection {
  key: string;
  title: string;
  icon: 'presentation' | 'attachment' | 'summary' | 'notes';
  type: 'files' | 'text';
  /** For type='files' */
  files?: ContentFileItem[];
  /** Grid layout for files: 1 or 2 columns */
  fileColumns?: 1 | 2;
  /** For type='text' */
  text?: string | null;
  /** Secondary text block (e.g. content officer notes) */
  secondaryLabel?: string;
  secondaryText?: string | null;
  /** Empty state messages */
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface ContentInfoViewData {
  sections: ContentInfoSection[];
}

export interface ContentInfoViewProps {
  data: ContentInfoViewData;
  className?: string;
  /** Called when user clicks preview/eye on a file */
  onViewFile?: (file: ContentFileItem) => void;
  /** Called when user clicks download on a file */
  onDownloadFile?: (file: ContentFileItem) => void;
  /** Extra actions rendered per presentation file (e.g. AI buttons) */
  renderFileActions?: (file: ContentFileItem, sectionKey: string) => React.ReactNode;
}
