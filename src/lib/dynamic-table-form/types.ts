import { ReactNode, Ref } from "react";

// ─── Column & Field Types ────────────────────────────────────────
export type ColumnType = "text" | "email" | "phone" | "select" | "checkbox";
export type FormMode = "create" | "edit" | "view";

export interface SelectOption {
  label: string;
  value: string;
}

export interface ColumnConfig {
  /** Field key in the row data */
  key: string;
  /** Header label */
  label: string;
  /** Column type — determines the rendered input */
  type: ColumnType;
  /** Placeholder text */
  placeholder?: string;
  /** Min width tailwind class */
  minWidth?: string;
  /** Max width tailwind class */
  maxWidth?: string;
  /** Is this field required for validation */
  required?: boolean;
  /** Options for select type */
  options?: SelectOption[];
  /** Custom validation regex */
  validationRegex?: RegExp;
  /** Custom validation error message */
  validationMessage?: string;
  /** Whether this field gets auto-filled from user search (disabled after fill) */
  autoFillFromSearch?: boolean;
  /** Default value for new rows */
  defaultValue?: unknown;
  /** Custom render for read-only view */
  renderView?: (value: unknown, row: TableRow) => ReactNode;
  /** Whether this column triggers inline search (replaces hardcoded email-only search) */
  searchable?: boolean;
}

// ─── Row Types ───────────────────────────────────────────────────

/** What consumers pass in — no internal fields required */
export interface InputTableRow {
  [key: string]: unknown;
}

/** Internal row with guaranteed _id — used inside the component */
export interface TableRow {
  _id: string;
  [key: string]: unknown;
  isExternal?: boolean;
  object_guid?: string;
  _disabledFields?: string[];
  _manualEntry?: boolean;
}

// ─── Search Types ────────────────────────────────────────────────
export interface SearchApiUser {
  mail: string;
  objectGUID: string;
  givenName: string;
  mobile: string | null;
  is_disabled?: number;
  // Extended fields from the full API response
  manager?: string | null;
  displayName?: string | null;
  displayNameAR?: string | null;
  displayNameEN?: string | null;
  cn?: string | null;
  sn?: string | null;
  title?: string | null;
  department?: string | null;
  company?: string | null;
  physicalDeliveryOfficeName?: string | null;
  userAccountControl?: number;
  idNumber?: string | null;
}

export interface SearchOption {
  label: string;
  value: string;
  raw: SearchApiUser;
}

/** A custom async search function the consumer can pass instead of using the built-in fetch. */
export type SearchFn = (query: string) => Promise<SearchOption[]>;

/** Maps a search API result to partial row fields — consumer controls the mapping. */
export type MapSearchResultToRowFn = (result: SearchApiUser) => Partial<InputTableRow>;

// ─── Validation ──────────────────────────────────────────────────
export interface TableValidation {
  required?: boolean;
  minItems?: number;
  errorMessage?: string;
}

export interface RowErrors {
  [fieldName: string]: string | null;
}

// ─── Imperative Handle ───────────────────────────────────────────
export interface DynamicTableFormHandle {
  /** Validate all rows and return the payload if valid, or null if invalid */
  validateAndGetPayload: () => Record<string, unknown>[] | null;
  /** Return the current raw TableRow[] without validation */
  getRows: () => TableRow[];
}

// ─── AI Suggestions ──────────────────────────────────────────────
export interface AiSuggestion {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_description: string;
  position_name: string;
  department_name: string;
  department_type: string;
  suggestion_reason: string;
  importance_level: string;
}

/** A custom async AI generate function the consumer can pass. */
export type AiGenerateFn = (count: number) => Promise<InputTableRow[]>;

// ─── Component Props ─────────────────────────────────────────────
export interface DynamicTableFormProps {
  /** Table title */
  title: string;
  /** Unique entity key */
  entityKey: string;
  /** Column definitions — makes the table fully flexible */
  columns: ColumnConfig[];
  /** Form mode */
  mode?: FormMode;
  /** Controlled value — consumers pass plain objects, _id is auto-generated */
  value?: InputTableRow[];
  /** Change handler — returns internal rows with _id */
  onChange?: (rows: TableRow[]) => void;
  /** Submit handler — shows save button when provided */
  onSubmit?: (payload: Record<string, unknown>[]) => void;
  /** Table-level validation */
  tableValidation?: TableValidation;
  /** Custom async search function — required when columns have searchable: true */
  searchFn?: SearchFn;
  /** Maps search result to row fields — required when using search */
  mapSearchResultToRow?: MapSearchResultToRowFn;
  /** Empty state texts */
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  /** Add button label */
  addButtonLabel?: string;
  /** Maximum number of rows */
  maxRows?: number;
  /** Additional class name */
  className?: string;
  /** Custom icon for table header */
  icon?: ReactNode;
  /** Submit button label */
  submitLabel?: string;
  /** Max height for table body scroll (e.g. "380px") */
  maxHeight?: string;
  /** Show the built-in submit button (default: false) */
  showSubmitButton?: boolean;
  /** Ref to access imperative methods like validateAndGetPayload */
  formRef?: Ref<DynamicTableFormHandle>;
  /** AI generate function — when provided, shows AI generate button */
  aiGenerateFn?: AiGenerateFn;
  /** AI generate button label */
  aiGenerateLabel?: string;
}
