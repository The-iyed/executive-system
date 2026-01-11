import React from 'react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInput,
  Button,
  useSidebar,
} from '@sanad-ai/ui';

import AvatarImage from '../assets/Avatar.png';
import AnalyseIcon from '../assets/analyse 1.svg';
import LayoutIcon from '../assets/layout-alt-02.svg';
import SearchLgIcon from '../assets/search-lg.svg';
import ChevronDownIcon from '../assets/chevron-down.svg';
import EditeIcon from '../assets/edit-05.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import { PATH } from '../routes/path';

// Constants
const SIDEBAR_STYLES = {
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.20) 100%), #055859',
} as const;

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

// Reusable Sidebar Toggle Button Component
export interface SidebarToggleButtonProps {
  className?: string;
  size?: 'default' | 'small' | 'large';
}

export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  className = '',
  size = 'default',
}) => {
  const { toggleSidebar } = useSidebar();

  const sizeClasses = {
    default: 'w-[46px] h-[46px]',
    small: 'w-[36px] h-[36px]',
    large: 'w-[56px] h-[56px]',
  };

  const iconSizeClasses = {
    default: 'w-5 h-5',
    small: 'w-4 h-4',
    large: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleSidebar}
      className={`group flex ${sizeClasses[size]} p-[13px] justify-center items-center aspect-square rounded-[8px] bg-[#00A79D] hover:bg-[#00A79D]/90 active:bg-[#00A79D]/80 hover:scale-105 active:scale-95 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-md flex-shrink-0 ${className}`}
      aria-label="Toggle Sidebar"
    >
      <img 
        src={LayoutIcon} 
        alt="القائمة" 
        className={`${iconSizeClasses[size]} transition-transform duration-200 group-hover:rotate-90`}
      />
    </button>
  );
};

const SidebarHeader: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <div 
        className="flex w-[46px] h-[46px] justify-center items-center flex-shrink-0"
        style={{
          borderRadius: '23.004px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img src={AnalyseIcon} alt="مُحلِّل الأحكام" className="w-[21px] h-[21px]" />
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between gap-3 mb-[41px]">
      <div 
        className="flex w-[46px] h-[46px] justify-center items-center flex-shrink-0"
        style={{
          borderRadius: '23.004px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img src={AnalyseIcon} alt="تحليل" className="w-[21px] h-[21px]" />
      </div>

      <h1
        className="flex-1 text-right text-[#F8F8F8] text-[24px] font-bold leading-[30.428px]"
        style={{ fontFamily: FONT_FAMILY }}
      >
        مُحلِّل الأحكام
      </h1>

      <SidebarToggleButton />
    </div>
  );
};


// Search Input Component
const SearchInput: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-full relative">
      <img
        src={SearchLgIcon}
        alt="بحث"
        className="absolute right-[13px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none z-10"
      />
      <SidebarInput
        type="text"
        placeholder="بحث..."
        className="w-full h-[46px] pr-[38px] pl-[13px] rounded-[8px] border-[0.2px] border-[#D8D8D8] bg-white text-right text-[16px] font-bold leading-[30.428px] placeholder:text-[#BBB] focus-visible:ring-0 focus-visible:outline-none flex items-center"
        style={{
          fontFamily: FONT_FAMILY,
          boxShadow: '0 4px 14.8px 0 rgba(0, 0, 0, 0.10)',
        }}
      />
    </div>
  );
};

// Icon Button Component (for collapsed state)
const IconButton: React.FC<{
  icon: string;
  alt: string;
  onClick?: () => void;
  bgColor?: string;
  shape?: 'square' | 'circle' | 'rectangle';
  isActive?: boolean;
}> = ({ icon, alt, onClick, bgColor = '#4A8C8C', shape = 'square', isActive = false }) => {
  const shapeClasses = {
    square: 'rounded-[8px]',
    circle: 'rounded-full',
    rectangle: 'rounded-[8px]',
  };

  return (
    <button
      onClick={onClick}
      className={`group flex w-[46px] h-[46px] justify-center items-center transition-all duration-200 ease-in-out flex-shrink-0 ${shapeClasses[shape]} ${
        isActive 
          ? 'scale-95 shadow-inner ring-2 ring-white/30' 
          : 'hover:scale-110 active:scale-95 hover:shadow-lg active:shadow-md shadow-md'
      }`}
      style={{ 
        backgroundColor: isActive ? `${bgColor}CC` : bgColor,
      }}
      aria-label={alt}
    >
      <img 
        src={icon} 
        alt={alt} 
        className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-90' : 'group-hover:scale-110'}`}
      />
    </button>
  );
};

// New Analysis Button Component
const NewAnalysisButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isActive = location.pathname === PATH.ROOT;

  const handleNewAnalysis = () => {
    navigate(PATH.ROOT);
  };

  if (isCollapsed) {
    return (
      <IconButton
        icon={EditeIcon}
        alt="تحليل جديد"
        bgColor="#00A79D"
        shape="square"
        onClick={handleNewAnalysis}
        isActive={isActive}
      />
    );
  }

  return (
    <Button
      className={`group w-full h-[46px] flex items-center gap-3 pl-[13px] rounded-[8px] text-white text-right text-[16px] font-bold leading-[30.428px] justify-start transition-all duration-200 ease-in-out shadow-md ${
        isActive
          ? 'bg-[#00A79D]/80 scale-[0.98] shadow-inner ring-2 ring-white/20'
          : 'bg-[#00A79D] hover:bg-[#00A79D]/90 active:bg-[#00A79D]/80 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg active:shadow-md'
      }`}
      style={{
        fontFamily: FONT_FAMILY,
        background: isActive 
          ? 'linear-gradient(0deg, rgba(0, 167, 157, 0.8) 0%, rgba(0, 167, 157, 0.8) 100%), #F8F8F8'
          : 'linear-gradient(0deg, #00A79D 0%, #00A79D 100%), #F8F8F8',
      }}
      onClick={handleNewAnalysis}
    >
      <img 
        src={EditeIcon} 
        alt="تحليل جديد" 
        className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:rotate-12 group-hover:scale-110'}`}
      />
      <span className="transition-all duration-200">تحليل جديد</span>
    </Button>
  );
};

// Cases Item Component
const CasesItem: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isActive = location.pathname === PATH.CASES;

  const handleCases = () => {
    navigate(PATH.CASES);
  };

  if (isCollapsed) {
    return (
      <IconButton
        icon={AnalyseIcon}
        alt="القضايا"
        bgColor="#00A79D"
        shape="rectangle"
        onClick={handleCases}
        isActive={isActive}
      />
    );
  }

  return (
    <Button 
      className={`group w-full h-[46px] flex items-center pl-[10px] pr-[12px] rounded-[8px] border-[0.4px] border-white transition-all duration-200 ease-in-out ${
        isActive 
          ? 'bg-white/10 scale-[0.98] shadow-inner' 
          : 'hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99] hover:shadow-md active:shadow-sm'
      }`}
      onClick={handleCases}
    >
      <div className="flex w-full h-full items-center justify-between">
        {/* Label and Icon Block */}
        <div className="flex w-[84px] justify-between items-center flex-shrink-0">
          <img 
            src={AnalyseIcon} 
            alt="القضايا" 
            className={`w-[21px] h-[21px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
          />
          <h2
            className={`text-right text-white text-[16px] font-bold leading-[30.428px] transition-all duration-200 ${
              isActive ? 'text-white' : ''
            }`}
            style={{ fontFamily: FONT_FAMILY }}
          >
            القضايا
          </h2>
        </div>

        <div
          className={`p-1.5 rounded transition-all duration-200 flex-shrink-0 ${
            isActive
              ? 'bg-white/20 scale-95'
              : 'hover:bg-white/10 hover:scale-110 active:scale-95'
          }`}
          aria-label="القائمة"
        >
          <img
            src={ChevronDownIcon}
            alt="القائمة"
            className={`transition-transform duration-200 ${isActive ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
          />
        </div>
      </div>
    </Button>
  );
};

// Search Icon Button (for collapsed state)
const SearchIconButton: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <IconButton
        icon={SearchLgIcon}
        alt="بحث"
        bgColor="#FFFFFF"
        shape="square"
        onClick={() => {}}
        isActive={false}
      />
    );
  }

  return null;
};

// User Profile Component
const UserProfile: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
      <div className="relative flex-shrink-0">
        <img
          src={AvatarImage}
          alt="سارة عبد الرحمن"
          className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
        />
      </div>
      {!isCollapsed && (
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-white font-medium text-sm truncate">
            سارة عبد الرحمن
          </span>
          <span className="text-white/70 text-xs truncate">
            Sarra.abd@exemple.com
          </span>
        </div>
      )}
    </div>
  );
};

// Main Sidebar Component
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <ShadcnSidebar
      side="right"
      variant="floating"
      collapsible="icon"
      className={`fixed top-[13px] right-[13px] h-[calc(100vh-26px)] rounded-[15px] border-0 transition-all duration-300 ${
        isCollapsed ? 'w-[73px]' : 'w-[346px]'
      }`}
      style={SIDEBAR_STYLES}
      dir="rtl"
    >
      <SidebarContent
        className={`flex flex-col overflow-y-auto h-full ${
          isCollapsed 
            ? 'items-center gap-[41px]' 
            : 'gap-3 p-4'
        }`}
        style={isCollapsed ? {
          padding: '15px',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
        } : {}}
      >
        <SidebarHeader />

        <div className="w-full flex flex-col gap-3">
        {!isCollapsed ? (
          <>
            <SearchInput />
            <NewAnalysisButton />
            <CasesItem />
          </>
        ) : (
          <>
            <SidebarToggleButton className='mb-[40px]'  />
            <SearchIconButton />
            <NewAnalysisButton />
            <CasesItem />
          </>
        )}
        </div>
      </SidebarContent>

      <SidebarFooter className={`w-full pb-4 ${isCollapsed ? 'px-0' : 'px-4'}`}>
        <UserProfile />
      </SidebarFooter>
    </ShadcnSidebar>
  );
};