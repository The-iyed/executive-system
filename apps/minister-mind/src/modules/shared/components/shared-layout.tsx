import React from 'react';
import BgSvg from '../assets/bg.svg';
import { Logo } from './logo';
import { LanguageSwitch } from './language-switch';
import { SearchInput } from './search-input';
import { UserAvatar } from './user-avatar';
import { NavigationActions, NavItem } from './navigation-actions';
import { WeatherCard } from './weather-card';
import { WelcomeSection, WelcomeSectionProps } from './welcome-section';

export interface SharedLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
  bgHeaderClassName?: string;
  welcomeSection: WelcomeSectionProps;
  authenticated?: boolean;
  navigationItems?: NavItem[];
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children, headerClassName, bgHeaderClassName, welcomeSection, authenticated, navigationItems }) => {
  return (
    <div className="min-h-screen relative w-full overflow-hidden">
      <div
        className={`absolute z-0 bg-cover bg-center bg-no-repeat pointer-events-none ${bgHeaderClassName}`}
        style={{
          width: 'calc(100% - 24px)',
          height: '398px',
          left: '12px',
          top: '12px',
          borderRadius: '14px',
          backgroundImage: `url(${BgSvg})`
        }}
      />
      <div 
        className={`relative h-[310px] z-10 my-[50px] mx-[60px] ${headerClassName}`}
      >
        <header className="flex items-center justify-between" style={{ zIndex: 2 }}>
          <div className='flex items-center gap-4'>
            <Logo />
          {authenticated && <NavigationActions items={navigationItems} />}
          </div>

        {authenticated && (<div className='flex items-center gap-4'>
            <SearchInput />
            <LanguageSwitch />
            <UserAvatar />
          </div>)}
        </header>

        {/* whether component */}
        <WeatherCard />
        {/* welcom component */}
        <WelcomeSection {...welcomeSection} />
        <div 
          className="children-container fixed bottom-0 left-1/2 -translate-x-1/2 rounded-t-[31px] bg-[#FFF] h-[calc(100vh-365px)]"
          style={{
            width: 'calc(100% - 54px)',
          }}
        >
          {children}
        </div>
      </div>
        <div 
          className="children-background fixed bottom-0 left-1/2 -translate-x-1/2 rounded-t-[14px] bg-[#F0F0F0] h-[calc(100vh-420px)]"
          style={{
            width: 'calc(100% - 24px)',
          }}
        />
    </div>
  );
};