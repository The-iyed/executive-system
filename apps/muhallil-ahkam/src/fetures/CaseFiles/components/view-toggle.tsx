import React from 'react';
import { Grid3x3, Table2 } from 'lucide-react';
import type { ViewMode } from '../types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewChange,
}) => {
  return (
    <div className="flex items-center gap-2 border border-[#EAECF0] rounded-[8px] p-1">
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center justify-center w-8 h-8 rounded-[6px] transition-all ${
          viewMode === 'table'
            ? 'bg-[#00A79D] text-white'
            : 'bg-transparent text-[#666] hover:bg-gray-100'
        }`}
        aria-label="عرض الجدول"
      >
        <Table2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        className={`flex items-center justify-center w-8 h-8 rounded-[6px] transition-all ${
          viewMode === 'grid'
            ? 'bg-[#00A79D] text-white'
            : 'bg-transparent text-[#666] hover:bg-gray-100'
        }`}
        aria-label="عرض الشبكة"
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
    </div>
  );
};
