import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';


import { ActionButton } from './welcome-section';

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
  actions?: ActionButton[];
  requiresUseCase?: string; // Optional: Only show this item if user has the specified use case
}

export interface NavigationActionsProps {
  className?: string;
  defaultActive?: string;
  onNavChange?: (id: string) => void;
  items?: NavItem[];
}

const isRouteActive = (itemPath?: string, pathname?: string) => {
  if (!itemPath || !pathname) return false;
  if (itemPath === '/') return pathname === '/';

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export const NavigationActions: React.FC<NavigationActionsProps> = ({ 
  className = '',
  defaultActive = 'home',
  onNavChange,
  items
}) => {
  const navigate = useNavigate();
  const location = useLocation();  
  const [activeId, setActiveId] = useState<string>(defaultActive);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const currentItem = items.find(item =>
      isRouteActive(item.path, location.pathname)
    );
  
    if (currentItem && currentItem.id !== activeId) {
      setActiveId(currentItem.id);
    }
  }, [location.pathname, items]);

  const handleClick = (id: string, path?: string) => {
    onNavChange?.(id);
  
    if (path && location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes fadeInSlide {
          0% {
            opacity: 0;
            transform: translateX(-12px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <TooltipProvider>
    {items && items?.length > 0 && (
    <div 
        className={`
          flex flex-col items-start
          p-[10px]
          gap-[10px]
          w-auto h-[60px]
          rounded-[73px]
          bg-[rgba(255,255,255,0.08)]
          ${className}
        `}
      >
        <div 
          className="
            flex flex-row items-center
            gap-[6px]
            w-auto h-[40px]
          "
        >
          {items?.map((item) => {
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id, item.path)}
                className={`
                  relative
                  flex items-center
                  py-2 px-3
                  gap-2
                  h-[40px]
                  rounded-[85px]
                  overflow-hidden
                  ${isActive 
                    ? 'w-auto' 
                    : 'min-w-[48px] w-auto bg-transparent'
                  }
                `}
                style={{
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-label={item.label}
                aria-pressed={isActive}
              >
                {/* Morphing gradient background with smooth reveal */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-[85px]"
                    style={{
                      background: 'linear-gradient(135deg, #3C6FD1 0%, #048F86 50%, #6DCDCD 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 4s ease infinite',
                      clipPath: 'inset(0 0 0 0)',
                      transition: 'clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                )}
                
                {/* Content layer */}
                <div 
                  className="relative z-10 flex flex-row justify-end items-center gap-3 w-auto"
                  style={{
                    transition: 'gap 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Icon with smooth bounce */}
                  <div
                    style={{
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <img 
                      src={item.icon} 
                      alt={item.label}
                      className="w-6 h-6 flex-none"
                    />
                  </div>
                  
                  {/* Label with smooth reveal */}
                  {isActive && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span 
                          className="w-auto h-5 text-base font-bold leading-6 text-white whitespace-nowrap cursor-pointer"
                          style={{
                            animation: 'fadeInSlide 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                            opacity: 0,
                          }}
                        >
                          {item.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
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
