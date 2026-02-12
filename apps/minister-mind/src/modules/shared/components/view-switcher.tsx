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
        p-1 gap-2
        w-[44px] h-[88px]
        bg-white
        rounded-full
        shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]
        border border-gray-200/80
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
          p-2 gap-1.5
          w-[36px] h-[36px]
          rounded-full
          transition-all
          ${view === 'table'
            ? 'bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
            : 'bg-transparent hover:bg-gray-50'}
        `}
        style={{
          transform: 'rotate(-90deg)',
        }}
        aria-label="Table view"
      >
        <img
          src={ListIcon}
          alt=""
          className="w-4 h-4"
          aria-hidden
        />
      </button>

      {/* Cards/Grid Button */}
      <button
        onClick={() => onViewChange('cards')}
        className={`
          flex flex-row justify-center items-center
          p-2 gap-1.5
          w-[36px] h-[36px]
          rounded-full
          transition-all
          ${view === 'cards'
            ? 'bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
            : 'bg-transparent hover:bg-gray-50'}
        `}
        style={{
          transform: 'rotate(90deg)',
        }}
        aria-label="Cards view"
      >
        <img
          src={CardIcon}
          alt=""
          className="w-4 h-4"
          aria-hidden
        />
      </button>
    </div>
  );
};
