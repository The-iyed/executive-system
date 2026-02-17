import React, { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@auth';
import { Icon } from '@iconify/react';
import { NavigationActions, NavItem } from './navigation-actions';
import { UserAvatar } from './user-avatar';
import { WelcomeSectionProps } from './welcome-section';
import { type ContentBarFilterTab } from './content-bar';
import { useUserNavigation } from '../hooks/useUserNavigation';
import { Logo } from './logo';

export interface SharedLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
  bgHeaderClassName?: string;
  welcomeSection: WelcomeSectionProps;
  navigationItems?: NavItem[];
  useDynamicNavigation?: boolean;
  contentBarFilterTabs?: ContentBarFilterTab[];
  hideContentBar?: boolean;
  contentContainerClassName?: string;
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({
  children,
  headerClassName,
  navigationItems,
  useDynamicNavigation = false,
  contentContainerClassName,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { navigationItems: dynamicNavItems } = useUserNavigation();

  const finalNavigationItems = useMemo(() => {
    if (useDynamicNavigation || !navigationItems) {
      return dynamicNavItems;
    }

    const useCases = user?.use_cases ?? [];
    return navigationItems
      .filter((item) => {
        if (!item.requiresUseCase) return true;
        return useCases.includes(item.requiresUseCase);
      })
      .map(({ requiresUseCase, ...item }) => item);
  }, [navigationItems, dynamicNavItems, useDynamicNavigation, user?.use_cases]);

  return (
    <div className="h-screen flex flex-col relative w-full overflow-hidden" dir="rtl">
      <div className={twMerge('relative flex flex-col flex-1 min-h-0 z-10 my-0', headerClassName)}>
        <header
          className="flex flex-row items-center justify-between gap-4 p-10 rounded-t-[14px]"
        >
          <Logo />
          <div
            className="flex flex-row-reverse items-center gap-4 flex-1 justify-center min-w-0"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
         
            {isAuthenticated && (
              <NavigationActions items={finalNavigationItems} variant="pill" className="flex-shrink-0" />
            )}
          </div>

          {isAuthenticated && (
            <div className="flex flex-row items-center gap-2 flex-shrink-0">
            
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-gray-200 p-0.5">
                <UserAvatar compact />
              </div>
         
            </div>
          )}
        </header>
        <div className={twMerge('children-container flex-1 min-h-0 flex flex-col rounded-t-[31px] pl-5', contentContainerClassName)} >
          {children}
        </div>
      </div>
    </div>
  );
};
