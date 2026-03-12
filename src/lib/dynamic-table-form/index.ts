export { DynamicTableForm } from "./DynamicTableForm";
export { default as TableFormSection } from "./components/TableFormSection";
export type { TableFormSectionProps } from "./components/TableFormSection";
export { useTableForm, normalizeRows } from "./hooks/useTableForm";
export { mapRowToPayload, mapAllRowsToPayload } from "./payload-mapper";
export { validateRow, validateAllRows, validateTable, hasErrors } from "./validation";
export type {
  ColumnConfig,
  ColumnType,
  FormMode,
  SelectOption,
  TableRow,
  InputTableRow,
  RowErrors,
  SearchApiUser,
  SearchOption,
  SearchFn,
  MapSearchResultToRowFn,
  TableValidation,
  DynamicTableFormProps,
  DynamicTableFormHandle,
  AiGenerateFn,
  AiSuggestion,
} from "./types";
