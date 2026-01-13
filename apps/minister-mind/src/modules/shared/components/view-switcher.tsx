import React from 'react';
import { Table2, Grid3x3 } from 'lucide-react';

export type ViewType = 'table' | 'cards';

export interface ViewSwitcherProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  view,
  onViewChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-row items-center gap-2 ${className}`}>
      <button
        onClick={() => onViewChange('table')}
        className={`
          flex items-center justify-center
          w-10 h-10
          rounded-lg
          transition-colors
          ${view === 'table' 
            ? 'bg-[#F6F6F6] text-[#475467]' 
            : 'bg-transparent text-gray-400 hover:bg-gray-100'
          }
        `}
        aria-label="Table view"
      >
        <Table2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange('cards')}
        className={`
          flex items-center justify-center
          w-10 h-10
          rounded-lg
          transition-colors
          ${view === 'cards' 
            ? 'bg-[#F6F6F6] text-[#475467]' 
            : 'bg-transparent text-gray-400 hover:bg-gray-100'
          }
        `}
        aria-label="Cards view"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
    </div>
  );
};

