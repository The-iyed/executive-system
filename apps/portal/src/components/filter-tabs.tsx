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
    <div className="relative w-full h-[52px] flex items-center justify-end">
      {/* Tabs */}
      <div className="flex items-center justify-end gap-0 relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center justify-center gap-1 px-4 py-4 rounded
                transition-colors relative
                ${isActive 
                  ? 'text-[#00a79d] font-bold' 
                  : 'text-[#384250] font-normal'
                }
              `}
            >
              <span className="text-sm leading-5" dir="rtl">{tab.label}</span>
              {Icon && <Icon className="w-4 h-4" />}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a79d] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Divider */}
      <div className="absolute bottom-[2px] left-0 right-0 h-[3px] bg-[#d2d6db] rounded-full z-0" />
    </div>
  );
};

