import React, { useMemo } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@sanad-ai/ui';
import { FormInput } from './FormInput';
import { FormDatePicker } from './FormDatePicker';
import { FormSelect } from './FormSelect';
import { FormSwitch } from './FormSwitch';
import { getTableErrorList } from '@shared/utils';

export interface FormTableColumn {
  id: string;
  header: string;
  width?: string;
  type?: 'text' | 'date' | 'select' | 'switch';
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  label?: boolean;
}

export interface FormTableRow {
  id: string;
  [key: string]: any;
}

export interface FormTableProps {
  title: string;
  required?: boolean;
  columns: FormTableColumn[];
  rows: FormTableRow[];
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onUpdateRow: (rowId: string, field: string, value: any) => void;
  addButtonLabel: string;
  errors?: Record<string, Record<string, string>>;
  touched?: Record<string, Record<string, boolean>>;
  errorMessage?: string; // Error message to display below table title
  maxHeight?: string; // Max height for table body scroll
  maxWidth?: string; // Max width for table container
  emptyStateMessage?: string; // Custom message when no rows
  showErrorList?: boolean; // Whether to show detailed error list
}

export const FormTable: React.FC<FormTableProps> = ({
  title,
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
  maxWidth = '1085px',
  emptyStateMessage = 'لا توجد بيانات',
  showErrorList = true,
}) => {
  // Check if table has errors when required and touched
  const hasRowErrors = Object.keys(errors).length > 0;
  const hasTableError =
  required &&
  (hasRowErrors || !!errorMessage);
  const tableErrorList = useMemo(
    () => showErrorList ? getTableErrorList(errors, rows) : {},
    [errors, rows, showErrorList]
  );
  // const rowHasError = !!errors[row.id];

  return (
    <div
      className="w-full flex flex-col gap-4 mx-auto"
      style={{ maxWidth }}
    >
      <div className="flex items-center gap-1">
        <h3 className="text-right text-[22px] font-bold text-[#101828]">
          {title}
        </h3>
        {required && <span className="text-red-500">*</span>}
      </div>

      <div className={cn(
        "w-full border rounded-lg overflow-hidden",
        hasTableError ? "border-[#D13C3C]" : "border-[#D0D5DD]"
      )}>
        <div className="w-full overflow-x-auto">
          <div className="min-w-max">
            {/* Table Header */}
            <div className="flex w-full bg-[#F9FAFB] border-b border-[#D0D5DD] min-w-max">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={cn(
                    "text-[14px] font-medium text-[#475467] flex items-center px-4 py-3 whitespace-nowrap",
                    column.width || "min-w-[180px]"
                  )}
                >
                  {column.header}
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div 
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
                    className={cn(
                      'flex w-full border-b border-[#EAECF0] min-w-max',
                      rowIndex === rows.length - 1 && 'border-b-0'
                    )}
                  >
                    {columns.map((column) => (
                      <div
                        key={column.id}
                        className={cn(
                          'flex items-center px-4 py-3',
                          column.width || 'flex-1'
                        )}
                      >
                        {column.id === 'action' ? (
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            className="flex items-center justify-center w-8 h-8 text-[#D13C3C] bg-[#FEF3F2] rounded-lg hover:w-9 hover:h-9 transition-colors"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : column.id === 'itemNumber' ? (
                          <span className="font-normal text-[16px] leading-[24px] text-[#344054] whitespace-nowrap">
                            {rowIndex + 1}
                          </span>
                        ) : column.type === 'date' ? (
                          <div className="w-full flex justify-end min-w-0">
                            <FormDatePicker
                              value={row[column.id] || ''}
                              onChange={(value) => onUpdateRow(row.id, column.id, value)}
                              placeholder={row[column.id] ? (column.placeholder || 'dd:mm:yyyy') : '-------'}
                              error={
                                !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id])
                              }
                              className="w-full"
                              fullWidth
                            />
                          </div>
                        ) : column.type === 'select' ? (
                          <div className="w-full flex justify-end">
                            <FormSelect
                              value={row[column.id] || ''}
                              onValueChange={(value) => onUpdateRow(row.id, column.id, value)}
                              options={column.selectOptions || []}
                              placeholder={column.placeholder || '-------'}
                              error={
                                !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id])
                              }
                              fullWidth
                            />
                          </div>
                        ) : column.type === 'switch' ? (
                          <div className="w-full flex justify-start">
                            <div className="flex items-center gap-2">
                              <FormSwitch
                                checked={row[column.id] || false}
                                onCheckedChange={(checked) => onUpdateRow(row.id, column.id, checked)}
                                label=""
                                className="!flex-row !items-center !gap-0"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex justify-end">
                            {(() => {
                              // Check if field should be disabled based on row.disabled field
                              const isDisabled = row.disabled === true;
                              const disabledFields = ['name', 'position', 'mobile', 'email'];
                              const shouldDisable = isDisabled && disabledFields.includes(column.id);
                              
                              // Determine display value
                              let displayValue = '';
                              
                              if (shouldDisable) {
                                if (column.id === 'name') {
                                  // For name field, show username if available, then name
                                  const nameValue = row.username || row.name;
                                  displayValue = (nameValue && nameValue.trim() !== '') ? nameValue : '';
                                } else {
                                  // For other fields, show the field value if available
                                  const fieldValue = row[column.id];
                                  displayValue = (fieldValue && String(fieldValue).trim() !== '') ? String(fieldValue) : '';
                                }
                              } else {
                                // For editable fields, use the actual field value
                                displayValue = row[column.id] || '';
                              }
                              
                              return (
                                <FormInput
                                  value={displayValue}
                                  onChange={(e) => {
                                    if (!shouldDisable) {
                                      onUpdateRow(row.id, column.id, e.target.value);
                                    }
                                  }}
                                  placeholder={column.placeholder || '-------'}
                                  disabled={shouldDisable}
                                  error={
                                    !!(touched[row.id]?.[column.id] && errors[row.id]?.[column.id])
                                  }
                                  fullWidth
                                />
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
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

      {/* Add Button */}
      <button
        type="button"
        onClick={onAddRow}
        className="flex items-center justify-center gap-2 self-start px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] transition-colors"
        style={{
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
        }}
      >
        <Plus className="w-4 h-4 text-[#008774] mt-[3px]" />
        <span className="font-medium text-[14px] leading-[20px] font-normal text-[#344054]">
          {addButtonLabel}
        </span>
      </button>
    </div>
  );
};

FormTable.displayName = 'FormTable';
