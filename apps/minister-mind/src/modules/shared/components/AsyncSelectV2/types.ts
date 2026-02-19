import { ActionMeta } from 'react-select';

export type OptionType = {
  value: string;
  label: string;
  description?: string;
};

export interface SelectOption extends OptionType {
  [key: string]: any;
}

export interface PaginationMeta {
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface AdditionalOptions {
  page: number;
}

export interface AsyncSelectV2Props {
  value?: OptionType | null;
  onChange?: (value: OptionType | null, actionMeta?: ActionMeta<SelectOption>) => void;
  placeholder?: string;
  loadOptions: (search: string, skip: number, limit: number) => Promise<PaginatedResponse<SelectOption>>;
  isLoading?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  debounceTimeout?: number;
  limit?: number;
  error?: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  className?: string;
  fullWidth?: boolean;
  searchPlaceholder?: string;
  menuPortalTarget?: HTMLElement | null;
  /** When false, options are not loaded on menu open; user must type to search (e.g. for APIs that require q min length). Default true. */
  defaultOptions?: boolean;
  /** Called when the menu opens (first click). Use to mark touched and show errors. */
  onFocus?: () => void;
}
