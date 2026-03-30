/**
 * Shared Meeting Info feature types.
 * Used by MeetingInfoView to display meeting details in a clean, read-only layout.
 */

export interface MeetingInfoField {
  key: string;
  label: string;
  value: React.ReactNode;
  /** Span full width (2 columns) */
  fullWidth?: boolean;
  /** Always show even when value is empty */
  alwaysShow?: boolean;
  /** Optional icon React node to display inside the field */
  icon?: React.ReactNode;
}

export interface MeetingInfoSection {
  title?: string;
  fields: MeetingInfoField[];
}

export interface AgendaItem {
  id?: string;
  agenda_item?: string;
  minister_support_type?: string;
  presentation_duration_minutes?: number | string;
  minister_support_other?: string;
}

export interface MeetingInfoViewData {
  sections: MeetingInfoSection[];
  agenda?: AgendaItem[];
}

export interface MeetingInfoViewProps {
  data: MeetingInfoViewData;
  className?: string;
  title?: string;
  description?: string;
}
