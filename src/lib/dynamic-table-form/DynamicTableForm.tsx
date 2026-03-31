import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { DynamicTableFormProps, DynamicTableFormHandle, SearchOption } from "./types";
import { useTableForm, normalizeRows } from "./hooks/useTableForm";
import { DynamicTableRow } from "./components/TableRow";
import { AddRowButton } from "./components/AddRowButton";
import { AiGenerateButton } from "./components/AiGenerateButton";
import { TableError } from "./components/TableError";
import { EmptyState } from "./components/EmptyState";
import { Send, Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn, Button, useToast } from "@/lib/ui";
import { mapAllRowsToPayload } from "./payload-mapper";
import { validateAllRows, hasErrors } from "./validation";

export const DynamicTableForm: React.FC<DynamicTableFormProps> = ({
  title,
  columns,
  mode = "create",
  value,
  onChange,
  tableValidation,
  searchFn,
  mapSearchResultToRow,
  emptyStateTitle = "لا يوجد عناصر بعد",
  emptyStateDescription = "ابدأ بإضافة عنصر جديد",
  addButtonLabel = "إضافة جديد",
  maxRows,
  className,
  icon,
  submitLabel = "حفظ",
  onSubmit,
  maxHeight,
  showSubmitButton = false,
  formRef,
  aiGenerateFn,
  aiGenerateLabel,
}) => {
  const { toast } = useToast();
  const form = useTableForm({
    initialRows: value || [],
    mode,
    onChange,
    maxRows,
    tableValidation,
    columns,
    mapSearchResultToRow,
  });

  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const prevRowCountRef = useRef(form.rowCount);

  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(form.rows)) {
      form.setRows(normalizeRows(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (form.rowCount > prevRowCountRef.current && form.rows.length > 0) {
      const newId = form.rows[form.rows.length - 1]._id;
      setNewRowIds((prev) => new Set(prev).add(newId));
      setTimeout(() => {
        setNewRowIds((prev) => {
          const next = new Set(prev);
          next.delete(newId);
          return next;
        });
      }, 1500);
      // Auto-scroll to the new row at the bottom
      requestAnimationFrame(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
        }
      });
    }
    prevRowCountRef.current = form.rowCount;
  }, [form.rowCount, form.rows]);

  const handleSelectUserInRow = useCallback(
    (rowIndex: number, option: SearchOption) => {
      form.fillRowFromSearch(rowIndex, option);
    },
    [form]
  );

  const [errorRowIds, setErrorRowIds] = useState<Set<string>>(new Set());

  const doValidateAndGetPayload = useCallback((): Record<string, unknown>[] | null => {
    const isValid = form.validate();
    if (!isValid) {
      const allErrors = validateAllRows(form.rows, columns);
      const newErrorIds = new Set<string>();
      form.rows.forEach((row, index) => {
        const rowErrs = allErrors[index];
        if (rowErrs && Object.values(rowErrs).some(Boolean)) {
          newErrorIds.add(row._id);
        }
      });
      setErrorRowIds(newErrorIds);
      setTimeout(() => setErrorRowIds(new Set()), 2000);
      return null;
    }
    return mapAllRowsToPayload(form.rows, columns);
  }, [form, columns]);

  const handleSubmit = useCallback(() => {
    const payload = doValidateAndGetPayload();
    if (payload) {
      onSubmit?.(payload);
    }
  }, [doValidateAndGetPayload, onSubmit]);

  const handleAiGenerate = useCallback(async (count: number) => {
    if (!aiGenerateFn) return;
    try {
      const newRows = await aiGenerateFn(count);
      if (!newRows || newRows.length === 0) {
        toast({
          title: "لا توجد توصيات متاحة حالياً بناءً على بيانات الاجتماع",
          description: "يرجى التأكد من إدخال تفاصيل الاجتماع بشكل كافٍ والمحاولة مرة أخرى",
        });
        return;
      }
      const normalized = normalizeRows(newRows);
      const updated = [...normalized, ...form.rows];
      form.setRows(updated);
      onChange?.(updated);
      toast({title:`تم إضافة ${newRows.length} مقترح بالذكاء الاصطناعي`});
    } catch {
      toast({
        title: "حدث خطأ أثناء توليد قائمة المدعوين",
        description: "يرجى المحاولة مرة أخرى لاحقاً",
        variant: "destructive",
      });
    }
  }, [aiGenerateFn, form, onChange]);

  useImperativeHandle(formRef, () => ({
    validateAndGetPayload: doValidateAndGetPayload,
    getRows: () => form.rows,
  }), [doValidateAndGetPayload, form.rows]);

  return (
    <div className={cn("w-full space-y-4", className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            {icon || <Users className="h-4.5 w-4.5 text-primary" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {title}
              {tableValidation?.required && !form.isReadOnly && (
                <span className="text-destructive mr-1">*</span>
              )}
            </h3>
            {form.rowCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {form.rowCount} عنصر مضاف
              </p>
            )}
          </div>
        </div>

      </div>

      <TableError error={form.tableError} />

      {/* Read-only empty */}
      {form.rowCount === 0 && form.isReadOnly ? (
      <EmptyState
        title={emptyStateTitle}
        description="لم تتم إضافة أي مدعوين لهذا الاجتماع"
        />
      ) : (
        <>
          {/* Table */}
          {form.rowCount > 0 && (
            <div
              className={cn(
                "rounded-2xl border bg-card shadow-sm transition-all duration-300",
                form.tableError
                  ? "border-destructive/30 shadow-destructive/5"
                  : "border-table-border"
              )}
            >
              <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto rounded-[15px]" style={maxHeight ? { maxHeight } : undefined}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-table-border sticky top-0 z-10">
                      <th className="px-2.5 py-3.5 text-right text-xs font-semibold text-muted-foreground tracking-wide w-10 text-center">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={cn(
                            "px-2.5 py-3.5 text-right text-xs font-semibold text-muted-foreground tracking-wide",
                            col.minWidth || "min-w-[120px]",
                            col.maxWidth,
                            col.type === "checkbox" && "w-16 text-center"
                          )}
                        >
                          {col.label}
                        </th>
                      ))}
                      {form.canAddRemove && <th className="px-2 py-3.5 w-12" />}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {form.rows.map((row, index) => (
                        <DynamicTableRow
                          key={row._id}
                          row={row}
                          rowIndex={index}
                          columns={columns}
                          errors={form.errors[index] || {}}
                          onUpdate={form.updateField}
                          onRemove={form.removeRow}
                          onSelectUser={handleSelectUserInRow}
                          onSwitchToExternal={form.switchToExternal}
                          readOnly={form.isReadOnly}
                          canRemove={form.canAddRemove}
                          isTouched={form.isTouched}
                          isNew={newRowIds.has(row._id)}
                          searchFn={searchFn!}
                          hasError={errorRowIds.has(row._id)}
                        />
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons below table */}
          {form.canAddRemove && form.rowCount > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <AddRowButton
                onAdd={form.addRow}
                label={addButtonLabel}
                canAdd={form.canAdd}
              />
              {aiGenerateFn && !form.isReadOnly && (
                <AiGenerateButton
                  onGenerate={handleAiGenerate}
                  label={aiGenerateLabel}
                  disabled={form.isReadOnly}
                />
              )}
            </div>
          )}

          {/* Empty editable state */}
          {form.rowCount === 0 && !form.isReadOnly && (
            <EmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
              icon={icon}
              onAdd={form.canAdd ? form.addRow : undefined}
              addLabel={addButtonLabel}
              aiGenerateFn={aiGenerateFn ? handleAiGenerate : undefined}
              aiGenerateLabel={aiGenerateLabel}
            />
          )}
        </>
      )}

      {/* Submit */}
      {onSubmit && showSubmitButton && !form.isReadOnly && form.rowCount > 0 && (
        <div className="flex items-center justify-end pt-2">
          <Button
            onClick={handleSubmit}
            className="gap-2.5 h-11 px-6 rounded-xl font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Send className="h-4 w-4" />
            {submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
