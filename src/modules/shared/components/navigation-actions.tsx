import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/lib/ui';
import { ActionButton } from './welcome-section';

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
  actions?: ActionButton[];
  requiresUseCase?: string;
  /** If set, hide this item when the user has any of these role codes */
  excludeRoleCodes?: string[];
}

export interface NavigationActionsProps {
  className?: string;
  defaultActive?: string;
  onNavChange?: (id: string) => void;
  items?: NavItem[];
  variant?: 'default' | 'pill';
}

const isRouteActive = (itemPath?: string, pathname?: string) => {
  if (!itemPath || !pathname) return false;
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export const NavigationActions: React.FC<NavigationActionsProps> = ({
  className = '',
  defaultActive = 'calendar',
  onNavChange,
  items,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeId, setActiveId] = useState<string>(defaultActive);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const isUc08 = location.pathname.startsWith('/uc08');
    const currentItem = isUc08
      ? items.find(item => item.id === 'directives')
      : items.find(item => isRouteActive(item.path, location.pathname));
    if (currentItem && currentItem.id !== activeId) {
      setActiveId(currentItem.id);
    }
  }, [location.pathname, items, activeId]);

  const handleClick = (id: string, path?: string) => {
    onNavChange?.(id);
    if (path && location.pathname !== path) {
      navigate(path);
    }
  };

  if (variant === 'pill') {
    return (
      <TooltipProvider>
        {items && items.length > 0 && (
          <div className="relative hidden md:block">
            <div
              className={`flex items-center gap-1 ${className}`}
              dir="rtl"
            >
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleClick(item.id, item.path)}
                        className={`
                          flex items-center justify-center gap-2 h-9 rounded-xl text-[13px] font-medium
                          transition-all duration-200 whitespace-nowrap cursor-pointer flex-shrink-0
                          ${isActive
                            ? 'bg-[var(--color-primary-700)] text-white px-4'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 w-9 xl:w-auto xl:px-4'
                          }
                        `}
                        aria-label={item.label}
                        aria-pressed={isActive}
                      >
                        {item.icon && (
                          <Icon
                            icon={item.icon}
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                          />
                        )}
                        {isActive ? (
                          <span>{item.label}</span>
                        ) : (
                          <span className="hidden xl:inline">{item.label}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="xl:hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </TooltipProvider>
    );
  }

  // Default variant (kept for backward compatibility)
  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <TooltipProvider>
        {items && items.length > 0 && (
          <div
            className={`flex flex-col items-start p-[10px] gap-[10px] w-auto h-[60px] rounded-[73px] bg-[rgba(255,255,255,0.08)] ${className}`}
          >
            <div className="flex flex-row items-center gap-[6px] w-auto h-[40px]">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item.id, item.path)}
                    className={`relative flex items-center py-2 px-3 gap-2 h-[40px] rounded-[85px] overflow-hidden ${isActive ? 'w-auto' : 'min-w-[48px] w-auto bg-transparent'}`}
                    style={{ transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    aria-label={item.label}
                    aria-pressed={isActive}
                  >
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-[85px]"
                        style={{
                          background: 'linear-gradient(135deg, #3C6FD1 0%, #048F86 50%, #6DCDCD 100%)',
                          backgroundSize: '200% 200%',
                          animation: 'gradientShift 4s ease infinite',
                        }}
                      />
                    )}
                    <div className="relative z-10 flex flex-row justify-end items-center gap-3 w-auto">
                      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                        {item.icon && (
                          <Icon
                            icon={item.icon}
                            width={24}
                            height={24}
                            style={{ color: isActive ? 'white' : 'rgba(255, 255, 255, 0.9)' }}
                          />
                        )}
                      </div>
                      {isActive && (
                        <span className="w-auto h-5 text-base font-bold leading-6 text-white whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </TooltipProvider>
    </>
  );
};
