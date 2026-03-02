/**
 * Shared FormTable column width constants for consistent alignment across UC01, UC02, and other modules.
 * Use these when defining FormTableColumn[] so all tables have the same look and column behavior.
 */
export const FORM_TABLE_WIDTH = {
  /** Index / row number column (e.g. #) */
  INDEX: 'min-w-[72px] w-[72px]',
  /** Standard data column (text, select, date) */
  DATA: 'min-w-[180px]',
  /** Wide data column (e.g. long text) */
  DATA_WIDE: 'min-w-[240px]',
  /** Action column (delete button) */
  ACTION: 'w-[72px] min-w-[72px]',
} as const;

/** Default width when column has no width specified */
export const FORM_TABLE_DEFAULT_WIDTH = 'min-w-[180px]';
