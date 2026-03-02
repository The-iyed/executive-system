import React from 'react';

export interface TableColumn<T = any> {
  id: string;
  header: string;
  width?: string; // Use Tailwind width classes like 'w-48', 'w-64', etc.
  render?: (row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => any;
  align?: 'start' | 'center' | 'end';
}

export interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  rowPadding?: 'py-2' | 'py-3' | 'py-4';
  /** Card-style rows: each row is a rounded card with shadow (like design image) */
  variant?: 'default' | 'cards';
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className = '',
  rowPadding = 'py-4',
  variant = 'cards',
}: DataTableProps<T>) => {
  const getJustifyClass = (align: TableColumn['align']) => {
    if (align === 'center') return 'justify-center';
    if (align === 'start') return 'justify-start';
    return 'justify-end';
  };

  const getTextAlignClass = (align: TableColumn['align']) => {
    if (align === 'center') return 'text-center';
    if (align === 'start') return 'text-left';
    return 'text-right';
  };

  const isCards = variant === 'cards';

  return (
    <div
      className={`
        box-border flex flex-col w-full overflow-hidden
        ${isCards ? ' rounded-xl p-4' : ' border border-gray-200 rounded-xl shadow-[0px_1px_3px_rgba(16,24,40,0.1),0px_1px_2px_rgba(16,24,40,0.06)]'}
        ${className}
      `}
      dir="rtl"
    >
      {/* Table Header - slightly darker grey, bold, thin divider below */}
      <div
        className={`
          flex flex-row w-full rounded-lg
          ${isCards ? 'bg-[#F9FAFB] border-b border-gray-200' : 'bg-[#F9FAFB] border-b border-gray-200'}
        `}
      >
        {columns.map((column) => {
          const align = column.align ?? 'end';
          return (
            <div
              key={column.id}
              className={`
                box-border flex flex-row items-center ${getJustifyClass(align)}
                px-5 py-3.5 gap-3 min-w-0
                ${column.width || 'flex-1'}
              `}
            >
              <span
                className={`
                  text-sm font-bold text-gray-700 leading-[18px]
                  ${getTextAlignClass(align)}
                  block truncate w-full
                `}
              >
                {column.header}
              </span>
            </div>
          );
        })}
      </div>

      {/* Table Body - card rows with gap and shadow, or classic rows */}
      <div className={isCards ? 'flex flex-col gap-3 mt-0 pt-3' : 'flex flex-col w-full'}>
        {data.length === 0 ? (
          <div className="flex flex-row w-full">
            <div className="box-border flex flex-row items-center justify-center px-6 py-2 w-full rounded-lg bg-white/80">
              <span className="text-sm font-normal text-gray-500 leading-5">لا توجد بيانات لعرضها</span>
            </div>
          </div>
        ) : (
          data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              onClick={() => onRowClick?.(row, rowIndex)}
              className={`
                flex flex-row w-full transition-colors
                ${isCards
                  ? 'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] cursor-pointer h-[50px]'
                  : 'cursor-pointer h-[50px] hover:bg-gray-50 border-b border-gray-200'}
              `}
            >
              {columns.map((column) => {
                const align = column.align ?? 'end';
                return (
                  <div
                    key={column.id}
                    className={`
                      box-border flex flex-row items-center ${getJustifyClass(align)}
                      px-5 ${rowPadding} gap-4 min-w-0 max-h-[50px]!
                      ${column.width || 'flex-1'}
                      ${isCards ? 'first:rounded-r-2xl last:rounded-l-2xl' : ''}
                    `}
                  >
                    {column.render ? (
                      <div className="w-full min-w-0 overflow-hidden">
                        {column.render(row, rowIndex)}
                      </div>
                    ) : (
                      <div className={`w-full min-w-0 overflow-hidden ${getTextAlignClass(align)}`}>
                        {column.accessor ? (
                          <span
                            className={`text-[15px] font-normal text-gray-700 leading-5 ${getTextAlignClass(align)} block truncate`}
                          >
                            {column.accessor(row)}
                          </span>
                        ) : (
                          <span
                            className={`text-[15px] font-normal text-gray-700 leading-5 ${getTextAlignClass(align)} block truncate`}
                          >
                            {row[column.id]}
                          </span>
                        )}
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
  );
};
