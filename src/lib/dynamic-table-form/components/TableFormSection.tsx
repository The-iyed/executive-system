import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { DynamicTableForm } from "../DynamicTableForm";
import type {
  TableRow,
  InputTableRow,
  ColumnConfig,
  TableValidation,
  DynamicTableFormHandle,
  FormMode,
  SearchFn,
  AiGenerateFn,
  MapSearchResultToRowFn,
} from "../types";
import { ReactNode } from "react";

export interface TableFormSectionProps {
  title: string;
  entityKey: string;
  columns: ColumnConfig[];
  mode?: FormMode;
  value?: InputTableRow[];
  onChange?: (rows: TableRow[]) => void;
  tableValidation?: TableValidation;
  searchFn?: SearchFn;
  mapSearchResultToRow?: MapSearchResultToRowFn;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  addButtonLabel?: string;
  maxRows?: number;
  maxHeight?: string;
  icon?: ReactNode;
  className?: string;
  aiGenerateFn?: AiGenerateFn;
  aiGenerateLabel?: string;
}

const TableFormSection = forwardRef<DynamicTableFormHandle, TableFormSectionProps>(
  ({ mode = "create", ...tableProps }, ref) => {
    const innerRef = useRef<DynamicTableFormHandle>(null);

    useImperativeHandle(ref, () => ({
      validateAndGetPayload: () => innerRef.current?.validateAndGetPayload() ?? null,
      getRows: () => innerRef.current?.getRows() ?? [],
    }));

    return <DynamicTableForm {...tableProps} mode={mode} formRef={innerRef} />;
  }
);

TableFormSection.displayName = "TableFormSection";

export default TableFormSection;
