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
  /** 'pill' = gradient pill (default), 'underline' = text with bottom border for active */
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  className = '',
  variant = 'pill',
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
        style={{ fontFamily: "var(--font-family-ping-ar)" }}
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
      className={`
        box-border
        flex flex-row
        justify-center items-center
        p-[6px]
        w-auto h-[46px]
        bg-white
        border border-[#E7E7E7]
        rounded-[64px]
        ${className}
      `}
      style={{ fontFamily: "var(--font-family-ping-ar)" }}
    >
        {items.map((item) => {
        const isActive = defaultActive === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`
              flex flex-row items-center
              px-3 py-2
              gap-2
              h-[34px]
              rounded-[85px]
              transition-all duration-300 ease-in-out
              ${isActive 
                ? '' 
                : 'bg-transparent'
              }
            `}
            style={
              isActive
                ? {
                    background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)',
                  }
                : undefined
            }
          >
            {/* Content */}
            <div className="flex flex-row justify-end items-center gap-3">
              {/* Text */}
              <span
                className={`
                  font-bold text-base leading-6 text-center whitespace-nowrap
                  ${isActive ? 'text-white' : 'text-[#585858]'}
                `}
                style={{
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                }}
              >
                {item.label}
              </span>

              {/* Badge - hidden for now as per design */}
              {item.badge && (
                <div className="flex flex-row items-center px-2 py-0.5 bg-[#F2F4F7] rounded-2xl">
                  <span className="text-xs">{item.badge}</span>
                </div>
              )}

              {/* Dot - hidden for now as per design */}
              {item.dot && (
                <div className="w-2.5 h-2.5 rounded-full bg-current" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

