import React, { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@auth';
import { Logo } from './logo';
import { LanguageSwitch } from './language-switch';
import { SearchInput } from './search-input';
import { UserAvatar } from './user-avatar';
import { NavigationActions, NavItem } from './navigation-actions';
import { WeatherCard } from './weather-card';
import { WelcomeSection, WelcomeSectionProps } from './welcome-section';
import { useUserNavigation } from '../hooks/useUserNavigation';

export interface SharedLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
  bgHeaderClassName?: string;
  welcomeSection: WelcomeSectionProps;
  navigationItems?: NavItem[]; // If not provided, will use dynamic navigation based on user's use cases
  useDynamicNavigation?: boolean; // If true, always use dynamic navigation even if navigationItems is provided
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ 
  children, 
  headerClassName, 
  bgHeaderClassName, 
  welcomeSection, 
  navigationItems,
  useDynamicNavigation = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { navigationItems: dynamicNavItems } = useUserNavigation();

  // Use dynamic navigation if explicitly requested or if navigationItems is not provided
  const finalNavigationItems = useMemo(() => {
    if (useDynamicNavigation || !navigationItems) {
      return dynamicNavItems;
    }
    return navigationItems;
  }, [navigationItems, dynamicNavItems, useDynamicNavigation]);
  return (
    <div className="min-h-screen relative w-full overflow-hidden">
      <div
        className={twMerge('absolute z-0 bg-cover bg-center bg-no-repeat pointer-events-none', bgHeaderClassName)}
        style={{
          width: 'calc(100% - 24px)',
          height: '398px',
          left: '12px',
          top: '12px',
          borderRadius: '14px',
          // backgroundImage: `url(${BgSvg})`
           backgroundImage: `url(/assets/bg.svg)`
        }}
      />
      <div 
        className={twMerge('relative h-[280px] z-10 my-[50px] mx-[60px]', headerClassName)}
      >
        <header className="flex items-center justify-between" style={{ zIndex: 2 }}>
          <div className='flex items-center gap-4'>
            <Logo />
          {isAuthenticated && <NavigationActions items={finalNavigationItems} />}
          </div>

        {isAuthenticated && (
          <div className='flex items-center gap-4'>
            <SearchInput />
            <LanguageSwitch />
            <UserAvatar />
          </div>
        )}
        </header>

        {/* whether component */}
        <WeatherCard />
        {/* welcom component */}
        <WelcomeSection {...welcomeSection} />
        <div 
          className="children-container fixed bottom-0 left-1/2 -translate-x-1/2 rounded-t-[31px] bg-[#FFF] h-[calc(100vh-340px)]"
          style={{
            width: 'calc(100% - 54px)',
          }}
        >
          {children}
        </div>
      </div>
        <div 
          className="children-background fixed bottom-[12px] left-1/2 -translate-x-1/2 rounded-[14px] bg-[#F0F0F0] h-[calc(100vh-432px)]"
          style={{
            width: 'calc(100% - 24px)',
          }}
        />
    </div>
  );
};