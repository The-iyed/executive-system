import React from 'react';
import PlusIcon from '../assets/plus.svg';
import HomeIcon from '../assets/home-02.svg';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface ActionButton {
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface WelcomeSectionProps {
  className?: string;
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  className = '',
  title='مرحباً بك،',
  description='لوحة التحكم الرئيسية - المنصة التنفيذية لجدولة الاجتماعات',
  breadcrumbs,
  actions, 
}) => {
  return (
    <div className={`absolute bottom-0 right-0 ${className}`}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex flex-row items-center p-0 gap-2 w-auto h-7">
            <button className="flex items-start p-1 w-7 h-7 rounded-[6px] transition-all duration-300 ease-in-out hover:scale-110 hover:bg-[rgba(255,255,255,0.1)] active:scale-95">
              <img
                src={HomeIcon}
                alt="Home"
                className="w-5 h-5 transition-all duration-300 hover:brightness-110"
              />
            </button>
            <div className="w-4 h-4 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-white -scale-x-100"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <button
              onClick={breadcrumbs[0]?.onClick}
              className="flex flex-row justify-center items-center px-2 py-1 w-auto h-7 bg-[rgba(255,255,255,0.15)] rounded-[6px] transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[rgba(255,255,255,0.25)] hover:shadow-lg active:scale-95 active:bg-[rgba(255,255,255,0.2)]"
            >
              <span className="text-white font-medium text-sm leading-5 whitespace-nowrap transition-all duration-300">
                {breadcrumbs[0].label}
              </span>
            </button>
          </div>
        )}
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-[42px] font-extrabold text-[#FAFAFA] mb-2 leading-[67px] text-right">
        {title}
        </h1>
        <p className="text-base text-white leading-6">
          {description}
        </p>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          {actions.map((action, index) => {
            const isPrimary = action.variant === 'primary' || !action.variant;
            
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  group
                  flex items-center gap-2 py-[10px] rounded-lg h-10 text-sm text-white leading-5 shadow-sm
                  transition-all duration-300 ease-in-out
                  transform-gpu
                  hover:scale-105 hover:shadow-xl
                  active:scale-95 active:shadow-md
                  ${isPrimary 
                    ? 'px-12 font-semibold bg-gradient-to-r from-[#048F86] to-[#6DCDCD] hover:brightness-110 hover:from-[#059a8f] hover:to-[#7ddddd]' 
                    : 'px-8 font-bold border-2 border-white bg-transparent hover:bg-[rgba(255,255,255,0.1)] hover:border-opacity-80 active:bg-[rgba(255,255,255,0.05)]'
                  }
                `}
                style={
                  isPrimary
                    ? {
                        background: 'linear-gradient(90deg, #048F86 -7%, #6DCDCD 100%)',
                      }
                    : undefined
                }
              >
                {isPrimary && (
                  <>
                    {action.icon ? (
                      <span className="w-5 h-5 flex items-center justify-center transition-transform duration-300 group-hover:rotate-90">{action.icon}</span>
                    ) : (
                      <img 
                        src={PlusIcon} 
                        alt="Plus" 
                        className="w-5 h-5 transition-transform duration-300 hover:rotate-90 active:rotate-180" 
                      />
                    )}
                  </>
                )}
                <span className="transition-all duration-300">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};