import { ReactNode } from 'react';

/** Generic paginated API response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

/** Filter config for dropdowns */
export interface MeetingFilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select';
  options: { value: string; label: string }[];
  defaultValue?: string;
}

/** Card action config */
export interface MeetingCardAction<T> {
  id: string;
  label: string | ((item: T) => string);
  icon?: ReactNode;
  variant?: 'primary' | 'danger' | 'ghost';
  onClick: (item: T) => void;
  hidden?: (item: T) => boolean;
  loading?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
}

/** Props for the MeetingListLayout orchestrator */
export interface MeetingListLayoutProps<T> {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Header icon (Iconify icon name) */
  headerIcon?: string;
  /** Right slot in header (e.g. add button) */
  headerRight?: ReactNode;
  /** React Query key */
  queryKey: string[];
  /** API function that returns paginated response */
  queryFn: (params: Record<string, any>) => Promise<PaginatedResponse<T>>;
  /** Fixed params always sent to queryFn (e.g. status, owner_type) */
  fixedParams?: Record<string, any>;
  /** Map API item to MeetingCardData */
  mapToCard: (item: T) => import('@/modules/shared/components/meeting-card').MeetingCardData;
  /** Card actions */
  cardActions?: MeetingCardAction<T>[];
  /** Filter config */
  filtersConfig?: MeetingFilterConfig[];
  /** Items per page */
  pageSize?: number;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Additional class */
  className?: string;
  /** Callback on card click */
  onCardClick?: (item: T) => void;
  /** Extra content rendered below the header */
  children?: ReactNode;
}
