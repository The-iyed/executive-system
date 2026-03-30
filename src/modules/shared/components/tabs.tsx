import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
  dot?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  className = '',
  variant = 'underline',
}) => {
  const defaultActive = activeTab || items[0]?.id;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  if (variant === 'underline') {
    return (
      <div
        className={`flex flex-row items-center justify-center gap-2.5 ${className}`}
        dir="rtl"
        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
      >
        {items.map((item) => {
          const isActive = defaultActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`
                flex flex-row justify-center items-center py-2 px-2.5
                whitespace-nowrap transition-colors box-border text-sm
                ${isActive
                  ? 'text-[#00A79D] font-bold border-b border-[#00A79D] border-b-[1px]'
                  : 'text-[#000000] font-normal'}
              `}
              style={{ lineHeight: '1.4' }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-row items-center gap-0 rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ backgroundColor: 'white', padding: '5px', fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
    >
      {items.map((item) => {
        const isActive = defaultActive === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(item.id)}
            className="flex items-center justify-center py-2.5 px-5 rounded-full transition-colors min-w-[110px]"
            style={{
              backgroundColor: isActive ? '#00A79D' : 'transparent',
              color: isActive ? '#fff' : '#374151',
            }}
          >
            <span className="text-sm font-bold">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-1.5 text-xs opacity-90">{item.badge}</span>
            )}
            {item.dot && <span className="ml-1 w-2 h-2 rounded-full bg-current opacity-80" />}
          </button>
        );
      })}
    </div>
  );
};

