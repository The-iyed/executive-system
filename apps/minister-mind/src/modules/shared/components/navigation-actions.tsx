import React, { useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';
import HomeIcon from '../assets/home-02.svg';
import CalendarIcon from '../assets/calendar-minus-01.svg';

export interface NavItem {
  id: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    icon: HomeIcon,
    label: 'الصفحة الرئيسية'
  },
  {
    id: 'calendar',
    icon: CalendarIcon,
    label: 'الاجتماعات'
  }
];

export interface NavigationActionsProps {
  className?: string;
  defaultActive?: string;
  onNavChange?: (id: string) => void;
}

export const NavigationActions: React.FC<NavigationActionsProps> = ({ 
  className = '',
  defaultActive = 'home',
  onNavChange
}) => {
  const [activeId, setActiveId] = useState<string>(defaultActive);

  const handleClick = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    onNavChange?.(id);
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
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
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
                          className="w-auto h-5 text-base font-bold leading-6 text-white whitespace-nowrap cursor-default"
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
    </TooltipProvider>
    </>
  );
};
