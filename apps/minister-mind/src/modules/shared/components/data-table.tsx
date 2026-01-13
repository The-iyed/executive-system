import React from 'react';

export interface TableColumn<T = any> {
  id: string;
  header: string;
  width?: string; // Use Tailwind width classes like 'w-48', 'w-64', etc.
  render?: (row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => any;
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
        {columns.map((column) => (
          <div
            key={column.id}
            className={`
              box-border
              flex flex-row justify-end items-center
              px-6 py-3
              gap-3
              bg-gray-50
              border-b border-gray-200
              ${column.width || 'flex-1'}
            `}
          >
            <span className="text-sm font-medium text-gray-600 leading-[18px] w-full text-right">
              {column.header}
            </span>
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="flex flex-col w-full">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-row w-full cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => onRowClick?.(row, rowIndex)}
          >
            {columns.map((column) => (
              <div
                key={column.id}
                className={`
                  box-border
                  flex flex-row justify-end items-center
                  px-6 py-4
                  gap-4
                  border-b border-gray-200
                  ${column.width || 'flex-1'}
                  w-full
                `}
              >
                <div className="w-full flex justify-end items-center">
                  {column.render ? (
                    column.render(row, rowIndex)
                  ) : column.accessor ? (
                    <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
                      {column.accessor(row)}
                    </span>
                  ) : (
                    <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
                      {row[column.id]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
