import React, { useMemo, useRef } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/ui';
import { FormInput } from './FormInput';
import { FormDatePicker } from './FormDatePicker';
import { FormSelect } from './FormSelect';
import { FormSwitch } from './FormSwitch';
import { getTableErrorList } from '@/modules/shared/utils';

export type FormTableSelectOption = { value: string; label: string };

export interface FormTableColumn {
  id: string;
  header: string;
  width?: string;
  type?: 'text' | 'date' | 'select' | 'switch';
  selectOptions?: FormTableSelectOption[] | ((rowIndex: number, row: FormTableRow, rows: FormTableRow[]) => FormTableSelectOption[]);
  placeholder?: string;
  label?: boolean;
  showWhen?: { field: string; value: string };
}

export interface FormTableRow {
  id: string;
  [key: string]: any;
}

export interface CustomCellRenderParams {
  row: FormTableRow;
  rowId: string;
  columnId: string;
  value: any;
  onUpdateRow: (field: string, value: any) => void;
  disabled: boolean;
  error?: boolean;
  placeholder?: string;
}

export interface FormTableProps {
  title: string;
  description?: string;
  required?: boolean;
  columns: FormTableColumn[];
  rows: FormTableRow[];
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: string, value: any) => void;
  addButtonLabel: string;
  errors?: Record<string, Record<string, string>>;
  touched?: Record<string, Record<string, boolean>>;
  errorMessage?: string;
  maxHeight?: string;
  maxWidth?: string;
  emptyStateMessage?: string;
  showErrorList?: boolean;
  disabled?: boolean;
  nonDeletableRowIds?: string[];
  hideAddButton?: boolean;
  customCellRender?: Record<string, (params: CustomCellRenderParams) => React.ReactNode>;
}

export const FormTable: React.FC<FormTableProps> = ({
  title,
  description,
  required = false,
  columns,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
  addButtonLabel,
  errors = {},
  touched = {},
  errorMessage,
  maxHeight = '220px',
  maxWidth = '1200px',
  emptyStateMessage = 'لا توجد بيانات',
  showErrorList = true,
  disabled = false,
  nonDeletableRowIds = [],
  hideAddButton = false,
  customCellRender,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const nonDeletableSet = useMemo(
    () => new Set(nonDeletableRowIds),
    [nonDeletableRowIds]
  );
  const hasRowErrors = Object.keys(errors).length > 0;
  const hasTableError =
  required &&
  (hasRowErrors || !!errorMessage);
  const tableErrorList = useMemo(
    () => showErrorList ? getTableErrorList(errors, rows) : {},
    [errors, rows, showErrorList]
  );

  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (col) =>
          !col.showWhen || rows.some((row) => row[col.showWhen!.field] === col.showWhen!.value)
      ),
    [columns, rows]
  );

  const cellWidth = (col: typeof visibleColumns[0]) => col.width || 'min-w-[180px]';

  return (
    <div
      className={cn(
        'w-full flex flex-col gap-3 mx-auto',
        disabled && 'pointer-events-none select-none'
      )}
      style={{ maxWidth }}
    >
      <div className="flex items-center gap-1">
        <h3 className="text-right text-[22px] font-bold text-[#101828]">
          {title}
        </h3>
        {required && <span className="text-red-500">*</span>}
      </div>
      <div>
        {description && (
          <p className="text-sm text-[#667085]">{description}</p>
        )}
      </div>

      <div className={cn(
        "w-full border rounded-lg overflow-hidden",
        hasTableError ? "border-[#D13C3C]" : "border-[#D0D5DD]"
      )}>
        <div className="w-full overflow-x-auto">
          <div className="min-w-max">
            {/* Table Header - same width classes as body cells for alignment */}
            <div className="flex w-full bg-[#F9FAFB] border-b border-[#D0D5DD] min-w-max">
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className={cn(
                    "text-[14px] font-medium text-[#475467] flex items-center justify-end px-4 py-3 whitespace-nowrap",
                    cellWidth(column)
                  )}
                >
                  {column.header}
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div
              ref={bodyRef}
              className="flex flex-col bg-white overflow-y-auto"
              style={{ maxHeight }}
            >
              {rows.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-[#667085]">
                  {emptyStateMessage}
                </div>
              ) : (
                rows.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    data-row-id={row.id}
                    className={cn(
                      'flex w-full border-b border-[#EAECF0] min-w-max',
                      rowIndex === rows.length - 1 && 'border-b-0'
                    )}
                  >
                    {visibleColumns.map((column) => {
                      const showCell = !column.showWhen || row[column.showWhen.field] === column.showWhen.value;
                      const customRender = customCellRender?.[column.id];
                      return (
                        <div
                          key={column.id}
                          className={cn(
                            'flex items-center px-4 py-3',
                            cellWidth(column)
                          )}
                        >
                          {!showCell ? (
                            <span className="text-[14px] text-[#98A2B3]">—</span>
                          ) : customRender ? (
                            <div className="w-full flex justify-end min-w-0">
                              {customRender({
                                row,
                                rowId: row.id,
                                columnId: column.id,
                                value: row[column.id],
                                onUpdateRow: (field, value) => {
                                  if (disabled) return;
                                  onUpdateRow(row.id, field, value);
                                },
                                disabled,
                                error: !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id]),
                                placeholder: column.placeholder,
                              })}
                            </div>
                          ) : column.id === 'action' ? (
                            nonDeletableSet.has(row.id) ? (
                              <span className="text-[14px] text-[#98A2B3]">—</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (disabled) return;
                                  onDeleteRow(row.id);
                                }}
                                disabled={disabled}
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 text-[#D13C3C] bg-[#FEF3F2] rounded-lg transition-colors",
                                  disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:w-9 hover:h-9"
                                )}
                                aria-label="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          ) : column.id === 'itemNumber' ? (
                            <span className="font-normal text-[16px] leading-[24px] text-[#344054] whitespace-nowrap mx-auto">
                              {rowIndex + 1}
                            </span>
                          ) : column.type === 'date' ? (
                            <div className="w-full flex justify-end min-w-0">
                              <FormDatePicker
                                value={row[column.id] || ''}
                                onChange={(value) => {
                                  if (disabled) return;
                                  onUpdateRow(row.id, column.id, value);
                                }}
                                placeholder={row[column.id] ? (column.placeholder || 'dd/mm/yyyy') : '-------'}
                                error={
                                  !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id])
                                }
                                className="w-full"
                                fullWidth
                                disabled={disabled}
                              />
                            </div>
                          ) : column.type === 'select' ? (
                            <div className="w-full flex justify-end">
                              <FormSelect
                                value={row[column.id] || ''}
                                onValueChange={(value) => {
                                  if (disabled) return;
                                  onUpdateRow(row.id, column.id, value);
                                }}
                                options={
                                  typeof column.selectOptions === 'function'
                                    ? column.selectOptions(rowIndex, row, rows)
                                    : (column.selectOptions || [])
                                }
                                placeholder={column.placeholder || '-------'}
                                error={
                                  !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id])
                                }
                                fullWidth
                                disabled={disabled}
                              />
                            </div>
                          ) : column.type === 'switch' ? (
                            <div className="w-full flex justify-start">
                              <div className="flex items-center gap-2 mx-auto">
                                <FormSwitch
                                  checked={row[column.id] || false}
                                  onCheckedChange={(checked) => {
                                    if (disabled) return;
                                    onUpdateRow(row.id, column.id, checked);
                                  }}
                                  label=""
                                  className="!flex-row !items-center !gap-0"
                                  disabled={disabled}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full flex justify-end">
                              {(() => {
                                const isDisabled = row.disabled === true;
                                const disabledFields = ['name', 'position', 'mobile', 'email', 'full_name', 'position_title', 'mobile_number'];
                                const shouldDisable = (disabled || (isDisabled && disabledFields.includes(column.id)));
                                let displayValue = '';
                                if (shouldDisable) {
                                  if (column.id === 'name' || column.id === 'full_name') {
                                    const nameValue = row.username || row.name || row.full_name;
                                    displayValue = (nameValue && nameValue.trim() !== '') ? nameValue : '';
                                  } else {
                                    const fieldValue = row[column.id];
                                    displayValue = (fieldValue && String(fieldValue).trim() !== '') ? String(fieldValue) : '';
                                  }
                                } else {
                                  displayValue = row[column.id] || '';
                                }
                                const cellError = touched[row.id]?.[column.id] && errors[row.id]?.[column.id];
                                return (
                                  <div className="w-full flex flex-col gap-0.5 items-end">
                                    <FormInput
                                      value={displayValue}
                                      onChange={(e) => {
                                        if (shouldDisable || disabled) return;
                                        onUpdateRow(row.id, column.id, e.target.value);
                                      }}
                                      placeholder={column.placeholder || '-------'}
                                      disabled={shouldDisable}
                                      error={!!cellError}
                                      fullWidth
                                    />
                                    {cellError && (
                                      <span className="text-[12px] text-[#D13C3C] text-right">
                                        {cellError}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        {errorMessage && (
          <p className="text-right text-[14px] text-[#D13C3C] -mt-[10px]">
            {errorMessage}
          </p>
        )}
        {showErrorList && Object.keys(tableErrorList).length > 0 && (
          <ul className="text-right text-[14px] text-[#D13C3C] space-y-1">
            {Object.entries(tableErrorList).map(([message, rowNumbers]) => (
              <li key={message}>
                {message} ({rowNumbers.join(', ')})
              </li>
            ))}
          </ul>
        )}
      </div>

      {!hideAddButton && (
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            onAddRow();
            requestAnimationFrame(() => {
              if (bodyRef.current) {
                bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
              }
            });
          }}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center gap-2 self-start px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg transition-colors",
            disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:bg-[#F9FAFB]"
          )}
          style={{
            boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
          }}
        >
          <Plus className="w-4 h-4 text-[#008774] mt-[3px]" />
          <span className="font-medium text-[14px] leading-[20px] font-normal text-[#344054]">
            {addButtonLabel}
          </span>
        </button>
      )}
    </div>
  );
};

FormTable.displayName = 'FormTable';
