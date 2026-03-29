import { useState, useCallback, useMemo, useRef } from "react";
import { TableRow, InputTableRow, RowErrors, SearchOption, TableValidation, ColumnConfig, MapSearchResultToRowFn } from "../types";
import { validateAllRows, hasErrors, validateTable } from "../validation";

let globalIdCounter = 0;

/** Normalize input rows to internal TableRow with guaranteed _id */
export function normalizeRows(rows: InputTableRow[]): TableRow[] {
  return rows.map((row) => ({
    ...row,
    _id: typeof row._id === "string" && row._id ? row._id : `row_${Date.now()}_${globalIdCounter++}_${Math.random().toString(36).slice(2, 6)}`,
    isExternal: typeof row.isExternal === "boolean" ? row.isExternal : true,
  } as TableRow));
}

interface UseTableFormOptions {
  initialRows?: InputTableRow[];
  mode?: "create" | "edit" | "view";
  onChange?: (rows: TableRow[]) => void;
  maxRows?: number;
  tableValidation?: TableValidation;
  columns: ColumnConfig[];
  mapSearchResultToRow?: MapSearchResultToRowFn;
}

export function useTableForm({
  initialRows = [],
  mode = "create",
  onChange,
  maxRows,
  tableValidation,
  columns,
  mapSearchResultToRow,
}: UseTableFormOptions) {
  const [rows, setRows] = useState<TableRow[]>(() => normalizeRows(initialRows));
  const [errors, setErrors] = useState<RowErrors[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [tableError, setTableError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const idCounter = useRef(0);

  const createEmptyRow = useCallback((): TableRow => {
    const row: TableRow = {
      _id: `row_${Date.now()}_${idCounter.current++}`,
      isExternal: true,
    };
    for (const col of columns) {
      if (col.defaultValue !== undefined) {
        row[col.key] = col.defaultValue;
      } else if (col.type === "checkbox") {
        row[col.key] = false;
      } else {
        row[col.key] = "";
      }
    }
    return row;
  }, [columns]);

  const updateRows = useCallback((updated: TableRow[]) => {
    setRows(updated);
    onChange?.(updated);
    if (submitted) {
      setTableError(validateTable(updated, tableValidation));
    }
  }, [onChange, submitted, tableValidation]);

  const addRow = useCallback(() => {
    if (maxRows && rows.length >= maxRows) return;
    const updated = [...rows, createEmptyRow()];
    setErrors((prev) => [...prev, {}]);
    updateRows(updated);
  }, [rows, createEmptyRow, maxRows, updateRows]);

  const fillRowFromSearch = useCallback((rowIndex: number, option: SearchOption) => {
    const raw = option.raw;
    const disabledFields = columns
      .filter((c) => c.autoFillFromSearch)
      .map((c) => c.key);

    // Use consumer-provided mapper — it should return ALL fields needed (visible + hidden)
    const mapped = mapSearchResultToRow
      ? mapSearchResultToRow(raw)
      : {
          name: raw.givenName || "",
          mobile: raw.mobile || "",
          email: raw.mail || "",
        };

    const updated = rows.map((row, i) => {
      if (i !== rowIndex) return row;
      return {
        ...row,
        ...mapped,
        isExternal: false,
        _disabledFields: disabledFields,
      };
    });

    // Clear errors for the filled row
    setErrors((prev) => {
      if (!prev[rowIndex]) return prev;
      const newErrors = [...prev];
      newErrors[rowIndex] = {};
      return newErrors;
    });

    updateRows(updated);
  }, [rows, updateRows, columns, mapSearchResultToRow]);

  const removeRow = useCallback((index: number) => {
    const updated = rows.filter((_, i) => i !== index);
    setErrors((prev) => prev.filter((_, i) => i !== index));
    updateRows(updated);
  }, [rows, updateRows]);

  const updateField = useCallback((rowIndex: number, fieldName: string, value: unknown) => {
    const updated = rows.map((row, i) =>
      i === rowIndex ? { ...row, [fieldName]: value } : row
    );
    setRows(updated);
    setTouched((prev) => new Set(prev).add(`${rowIndex}_${fieldName}`));

    // Clear error for this field when user provides a value
    setErrors((prev) => {
      if (!prev[rowIndex] || !prev[rowIndex][fieldName]) return prev;
      const newErrors = [...prev];
      newErrors[rowIndex] = { ...newErrors[rowIndex], [fieldName]: null };
      return newErrors;
    });

    onChange?.(updated);
  }, [rows, onChange]);

  const switchToExternal = useCallback((rowIndex: number, preserveValue?: string) => {
    const updated = rows.map((row, i) => {
      if (i !== rowIndex) return row;
      const cleared: Record<string, unknown> = {};
      const searchableKey = columns.find((c) => c.searchable)?.key;
      for (const col of columns) {
        if (col.autoFillFromSearch) {
          // If this is the searchable field and we have a value to preserve, keep it
          if (col.key === searchableKey && preserveValue) {
            cleared[col.key] = preserveValue;
          } else {
            cleared[col.key] = col.defaultValue !== undefined ? col.defaultValue : (col.type === "checkbox" ? false : "");
          }
        }
      }
      return {
        ...row,
        ...cleared,
        isExternal: true,
        object_guid: undefined,
        _manualEntry: true,
        _disabledFields: undefined,
      };
    });
    updateRows(updated);
  }, [rows, columns, updateRows]);

  const validate = useCallback((): boolean => {
    setSubmitted(true);
    const tblErr = validateTable(rows, tableValidation);
    setTableError(tblErr);

    const allErrors = validateAllRows(rows, columns);
    setErrors(allErrors);

    const allTouched = new Set<string>();
    rows.forEach((_, ri) => {
      columns.forEach((col) => allTouched.add(`${ri}_${col.key}`));
    });
    setTouched(allTouched);

    return !tblErr && !hasErrors(allErrors);
  }, [rows, tableValidation, columns]);

  const isTouched = useCallback(
    (rowIndex: number, fieldName: string) => touched.has(`${rowIndex}_${fieldName}`),
    [touched]
  );

  const isReadOnly = mode === "view";
  const canAddRemove = mode !== "view";
  const canAdd = !maxRows || rows.length < maxRows;

  return useMemo(() => ({
    rows,
    errors,
    tableError,
    addRow,
    fillRowFromSearch,
    removeRow,
    updateField,
    switchToExternal,
    validate,
    isTouched,
    isReadOnly,
    canAddRemove,
    canAdd,
    rowCount: rows.length,
    setRows,
  }), [rows, errors, tableError, addRow, fillRowFromSearch, removeRow, updateField, switchToExternal, validate, isTouched, isReadOnly, canAddRemove, canAdd]);
}
