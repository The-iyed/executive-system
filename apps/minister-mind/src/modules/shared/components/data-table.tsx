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
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className = '',
}: DataTableProps<T>) => {
  // Don't reverse - columns should be in the order they're defined
  // The RTL direction on the container will handle the layout

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

  return (
    <div
      className={`
        box-border
        flex flex-col
        bg-white
        border border-gray-200
        rounded-xl
        w-full
        overflow-hidden
        shadow-[0px_1px_3px_rgba(16,24,40,0.1),0px_1px_2px_rgba(16,24,40,0.06)]
        ${className}
      `}
      dir="rtl"
    >
      {/* Table Header */}
      <div className="flex flex-row w-full">
        {columns.map((column) => {
          const align = column.align ?? 'end';
          return (
            <div
              key={column.id}
              className={`
                box-border
                flex flex-row items-center
                ${getJustifyClass(align)}
                px-6 py-3
                gap-3
                bg-gray-50
                border-b border-gray-200
                ${column.width || 'flex-1'}
                min-w-0
              `}
            >
              <span
                className={`
                  text-sm font-medium text-gray-600 leading-[18px]
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

      {/* Table Body */}
      <div className="flex flex-col w-full">
        {data.length === 0 ? (
          <div className="flex flex-row w-full">
            <div
              className={`
                box-border
                flex flex-row items-center justify-center
                px-6 py-6
                gap-4
                border-b border-gray-200
                w-full
              `}
            >
              <span className="text-sm font-normal text-gray-500 leading-5">
                لا توجد بيانات لعرضها
              </span>
            </div>
          </div>
        ) : (
          data.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-row w-full cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column) => {
                const align = column.align ?? 'end';
                return (
                  <div
                    key={column.id}
                    className={`
                      box-border
                      flex flex-row items-center
                      ${getJustifyClass(align)}
                      px-6 py-4
                      gap-4
                      border-b border-gray-200
                      ${column.width || 'flex-1'}
                      min-w-0
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
                            className={`
                              text-base font-normal text-gray-600 leading-5
                              ${getTextAlignClass(align)}
                              block truncate
                            `}
                          >
                            {column.accessor(row)}
                          </span>
                        ) : (
                          <span
                            className={`
                              text-base font-normal text-gray-600 leading-5
                              ${getTextAlignClass(align)}
                              block truncate
                            `}
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
