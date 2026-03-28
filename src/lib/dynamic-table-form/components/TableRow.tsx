import React, { memo, useState } from "react";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmDialog } from "@/modules/shared/components/confirm-dialog";
import { TableRow as TableRowType, RowErrors, SearchOption, ColumnConfig, SearchFn } from "../types";
import {
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue,
  Input,
  Button,
  Switch,
  cn,
} from "@/lib/ui";
import { TableEmailSearch } from "./TableEmailSearch";

interface TableRowProps {
  row: TableRowType;
  rowIndex: number;
  columns: ColumnConfig[];
  errors: RowErrors;
  onUpdate: (rowIndex: number, fieldName: string, value: unknown) => void;
  onRemove: (index: number) => void;
  onSelectUser: (index: number, option: SearchOption) => void;
  onSwitchToExternal: (index: number, preserveValue?: string) => void;
  readOnly: boolean;
  canRemove: boolean;
  isTouched: (rowIndex: number, fieldName: string) => boolean;
  isNew?: boolean;
  searchFn: SearchFn;
  hasError?: boolean;
}

function FieldCell({
  error,
  showError,
  children,
}: {
  error?: string | null;
  showError: boolean;
  children: React.ReactNode;
}) {
  return (
    <td className="px-2.5 py-2 align-top">
      <div className="flex flex-col gap-0.5">
        {children}
        <div className="h-4 overflow-hidden">
          {showError && error ? (
            <motion.span
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-destructive leading-tight block truncate"
              title={error}
            >
              {error}
            </motion.span>
          ) : null}
        </div>
      </div>
    </td>
  );
}

const INPUT_CLASS =
  "h-9 text-sm rounded-lg border-border/60 focus:border-primary/50 transition-colors";
const INPUT_ERROR_CLASS =
  "h-9 text-sm rounded-lg border-destructive focus:border-destructive transition-colors";

function ReadOnlyValue({ value, isEmpty }: { value: React.ReactNode; isEmpty?: boolean }) {
  if (isEmpty) {
    return <span className="text-muted-foreground/40 select-none">—</span>;
  }
  return <span className="text-foreground line-clamp-2 break-words" title={typeof value === 'string' ? value : undefined}>{value}</span>;
}
  
function renderReadOnlyCell(row: TableRowType, col: ColumnConfig) {
  const cellClass = cn("px-3 py-3.5 text-sm", col.minWidth, col.maxWidth);

  if (col.renderView) {
    return (
      <td className={cellClass} key={col.key}>
        {col.renderView(row[col.key], row)}
      </td>
    );
  }

  const value = row[col.key];
  const isEmpty = value === undefined || value === null || value === "";

  if (col.type === "checkbox") {
    const checked = !!value;
    return (
      <td className={cn(cellClass, "text-center")} key={col.key}>
        <div className="flex items-center justify-center">
          <Switch checked={checked} disabled className="pointer-events-none" />
        </div>
      </td>
    );
  }

  if (col.type === "select" && col.options) {
    const matched = col.options.find((o) => o.value === String(value || ""));
    return (
      <td className={cellClass} key={col.key}>
        <ReadOnlyValue value={matched?.label} isEmpty={!matched} />
      </td>
    );
  }

  return (
    <td className={cellClass} key={col.key}>
      <ReadOnlyValue value={String(value)} isEmpty={isEmpty} />
    </td>
  );
}

function renderEditableCell(
  row: TableRowType,
  col: ColumnConfig,
  rowIndex: number,
  errors: RowErrors,
  onUpdate: (rowIndex: number, fieldName: string, value: unknown) => void,
  onSelectUser: (index: number, option: SearchOption) => void,
  onSwitchToExternal: (index: number, preserveValue?: string) => void,
  isFieldDisabled: (name: string) => boolean,
  showErr: (name: string) => boolean,
  searchFn: SearchFn,
) {
  const value = row[col.key];

  if (col.searchable) {
    // If row was explicitly switched to manual entry, show plain input
    if (row._manualEntry && !row.object_guid) {
      const hasErr = showErr(col.key) && !!errors[col.key];
      return (
        <FieldCell error={errors[col.key]} showError={showErr(col.key)} key={col.key}>
          <Input
            value={String(value || "")}
            onChange={(e) => onUpdate(rowIndex, col.key, e.target.value)}
            placeholder={col.placeholder || "أدخل البريد الإلكتروني"}
            disabled={isFieldDisabled(col.key)}
            className={hasErr ? INPUT_ERROR_CLASS : INPUT_CLASS}
            dir="ltr"
            type="email"
          />
        </FieldCell>
      );
    }

    return (
      <td className="px-2.5 py-2 align-top" key={col.key}>
        <TableEmailSearch
          value={String(value || "")}
          onChange={(v) => onUpdate(rowIndex, col.key, v)}
          onSelectUser={(opt) => onSelectUser(rowIndex, opt)}
          onSwitchToExternal={(preserveValue) => onSwitchToExternal(rowIndex, preserveValue)}
          disabled={isFieldDisabled(col.key)}
          isExternal={row.isExternal !== false}
          hasObjectGuid={!!row.object_guid}
          searchFn={searchFn}
          error={errors[col.key]}
          showError={showErr(col.key)}
          hasFieldError={showErr(col.key) && !!errors[col.key]}
          placeholder={col.placeholder}
        />
      </td>
    );
  }

  if (col.type === "checkbox") {
    return (
      <td className="px-2.5 py-2 align-top" key={col.key}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-center h-9">
            <Switch
              checked={!!value}
              onCheckedChange={(v) => onUpdate(rowIndex, col.key, !!v)}
              disabled={isFieldDisabled(col.key)}
            />
          </div>
          <div className="h-4" />
        </div>
      </td>
    );
  }

  const hasErr = showErr(col.key) && !!errors[col.key];
  const inputClass = hasErr ? INPUT_ERROR_CLASS : INPUT_CLASS;

  if (col.type === "select" && col.options) {
    return (
      <FieldCell error={errors[col.key]} showError={showErr(col.key)} key={col.key}>
        <Select
          value={String(value || "")}
          onValueChange={(v) => onUpdate(rowIndex, col.key, v)}
          disabled={isFieldDisabled(col.key)}
        >
          <SelectTrigger className={cn(inputClass, "w-full")}>
            <SelectValue placeholder={col.placeholder || col.label} />
          </SelectTrigger>
          <SelectContent>
            {col.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldCell>
    );
  }

  return (
    <FieldCell error={errors[col.key]} showError={showErr(col.key)} key={col.key}>
      <Input
        value={String(value || "")}
        onChange={(e) => onUpdate(rowIndex, col.key, e.target.value)}
        placeholder={col.placeholder || col.label}
        disabled={isFieldDisabled(col.key)}
        className={inputClass}
        dir={col.type === "phone" ? "ltr" : undefined}
        type={col.type === "phone" ? "tel" : "text"}
      />
    </FieldCell>
  );
}

const errorShake = {
  x: [0, -4, 4, -3, 3, -1, 1, 0],
  transition: { duration: 0.5 },
};

const TableRowInner: React.FC<TableRowProps> = ({
  row,
  rowIndex,
  columns,
  errors,
  onUpdate,
  onRemove,
  onSelectUser,
  onSwitchToExternal,
  readOnly,
  canRemove,
  isTouched,
  isNew,
  searchFn,
  hasError,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const disabled = row._disabledFields || [];
  const isFieldDisabled = (name: string) => readOnly || disabled.includes(name);
  const showErr = (name: string) => isTouched(rowIndex, name);

  if (readOnly) {
    return (
      <tr className="border-b border-table-border">
        <td className="px-2.5 py-3 text-right text-sm text-muted-foreground w-10">
          {rowIndex + 1}
        </td>
        {columns.map((col) => renderReadOnlyCell(row, col))}
      </tr>
    );
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -12, scale: 0.99 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        backgroundColor: hasError
          ? "hsl(var(--destructive) / 0.06)"
          : isNew
          ? "hsl(var(--primary) / 0.04)"
          : "transparent",
        ...(hasError ? errorShake : {}),
        transition: {
          duration: 0.3,
          backgroundColor: { duration: hasError ? 0.3 : 1.5, ease: "easeOut" },
        },
      }}
      exit={{ opacity: 0, x: 40, scale: 0.98, transition: { duration: 0.2 } }}
      className={cn(
        "border-b border-table-border hover:bg-table-row-hover transition-colors group",
        hasError && "border-destructive/20"
      )}
    >
      <td className="px-2.5 py-2 text-center text-sm text-muted-foreground font-semibold w-10 align-top">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-center h-9">{rowIndex + 1}</div>
          <div className="h-4" />
        </div>
      </td>

      {columns.map((col) =>
        renderEditableCell(
          row, col, rowIndex, errors,
          onUpdate, onSelectUser, onSwitchToExternal,
          isFieldDisabled, showErr, searchFn
        )
      )}

      {canRemove && (
        <td className="px-2 py-2 w-12 align-top relative">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center h-9 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmingDelete(true)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-4" />
          </div>
          <AnimatePresence>
            {confirmingDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                onClick={() => setConfirmingDelete(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-card border rounded-xl shadow-lg p-5 w-80 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center mb-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">حذف المدعو</h3>
                  <p className="text-sm text-muted-foreground mb-4">هل أنت متأكد من حذف هذا المدعو من القائمة؟</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(false)}
                      className="min-w-20"
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setConfirmingDelete(false);
                        onRemove(rowIndex);
                      }}
                      className="min-w-20"
                    >
                      حذف
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      )}
    </motion.tr>
  );
};

export const DynamicTableRow = memo(TableRowInner);
