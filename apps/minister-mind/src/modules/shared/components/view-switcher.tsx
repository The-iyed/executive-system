import React from 'react';
import ListIcon from '../assets/listIcon.svg';
import CardIcon from '../assets/cardIcon.svg';

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
    <div 
      className={`
        flex flex-col justify-center items-center
        p-1
        gap-2
        w-[44px] h-[88px]
        bg-[#ECEFF3]
        rounded-[100px]
        ${className}
      `}
      style={{
        transform: 'rotate(90deg)',
      }}
    >
      {/* Table/List Button */}
      <button
        onClick={() => onViewChange('table')}
        className={`
          flex flex-row justify-center items-center
          p-2
          gap-1.5
          w-[36px] h-[36px]
          rounded-[100px]
          transition-all
          ${view === 'table' 
            ? 'bg-[#F8FAFB] shadow-[0px_1px_3px_rgba(16,24,40,0.1),0px_1px_2px_rgba(16,24,40,0.06)]' 
            : 'bg-transparent'
          }
        `}
        style={{
          transform: 'rotate(-90deg)',
        }}
        aria-label="Table view"
      >
        <img 
          src={ListIcon} 
          alt="List view" 
          className="w-4 h-4"
        />
      </button>

      {/* Cards/Grid Button */}
      <button
        onClick={() => onViewChange('cards')}
        className={`
          flex flex-row justify-center items-center
          p-2
          gap-1.5
          w-[36px] h-[36px]
          rounded-[100px]
          transition-all
          ${view === 'cards' 
            ? 'bg-[#F8FAFB] shadow-[0px_1px_3px_rgba(16,24,40,0.1),0px_1px_2px_rgba(16,24,40,0.06)]' 
            : 'bg-transparent'
          }
        `}
        style={{
          transform: 'rotate(90deg)',
        }}
        aria-label="Cards view"
      >
        <img 
          src={CardIcon} 
          alt="Card view" 
          className="w-4 h-4"
        />
      </button>
    </div>
  );
};
