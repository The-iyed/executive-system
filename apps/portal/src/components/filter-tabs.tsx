import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface FilterTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="relative w-full h-[52px] flex items-center justify-start overflow-x-auto" dir="rtl" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}>
      {/* Tabs Container - Scrollable on mobile */}
      <div className="flex items-center gap-0 relative z-10 h-12 min-w-max" dir="rtl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center justify-center gap-1 px-3 sm:px-4 py-4 rounded whitespace-nowrap
                transition-colors relative h-12 flex-shrink-0
                ${isActive 
                  ? 'text-[#00A79D] font-bold' 
                  : 'text-[#384250] font-normal'
                }
              `}
              style={{ fontSize: '14px', lineHeight: '20px', textAlign: 'right' }}
              dir="rtl"
            >
              <span className="text-right" style={{ textAlign: 'right' }}>{tab.label}</span>
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#00A79D' : '#384250', marginRight: '4px' }} />}
              
              {/* Active indicator - 3px height */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00A79D] rounded-full z-10" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Divider - 3px height, #D2D6DB */}
      <div className="absolute bottom-[2px] left-0 right-0 h-[3px] bg-[#D2D6DB] rounded-full z-0" />
    </div>
  );
};

