import React, { useMemo, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@auth';
import { useContainerScroll, useUserNavigation } from '@shared/hooks';
import { NavigationActions, NavItem } from '../navigation-actions';
import { UserAvatar } from '../user-avatar';
import { WelcomeSectionProps } from '../welcome-section';
import { type ContentBarFilterTab } from '../content-bar';
import { Logo } from '../logo';

export interface SharedLayoutProps {
  children: React.ReactNode;
  headerClassName?: string;
  bgHeaderClassName?: string;
  welcomeSection?: WelcomeSectionProps;
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

  const contentRef = useRef<HTMLDivElement | null>(null);
  const isScrolled = useContainerScroll(contentRef, 30);

  const finalNavigationItems = useMemo(() => {
    if (useDynamicNavigation || !navigationItems) {
      return dynamicNavItems;
    }

    const useCases = user?.use_cases ?? [];
    return navigationItems?.filter((item) => {
        if (!item?.requiresUseCase) return true;
        return useCases.includes(item?.requiresUseCase);
      })
      .map(({ requiresUseCase, ...item }) => item);
  }, [navigationItems, dynamicNavItems, useDynamicNavigation, user?.use_cases]);

  return (
    <div className="h-screen flex flex-col relative w-full overflow-hidden" dir="rtl">
      <div className={twMerge('relative flex flex-col flex-1 min-h-0 z-10', headerClassName)}>
         <header
          className={twMerge(
            `
            sticky top-4 z-50
            flex items-center justify-between gap-4
            px-10
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            `,
            isScrolled
              ? `
                py-3
                rounded-full
                bg-white/50
                backdrop-blur-3xl
                shadow-[0_10px_40px_rgba(0,0,0,0.12)]
                border border-white/30
                scale-[0.98]
                `
              : `
                py-6
                rounded-t-[14px]
                bg-transparent
                `
          )}
        >
          <div
            className={twMerge(
              'transition-all duration-500',
              isScrolled ? 'scale-90' : 'scale-100'
            )}
          >
            <Logo />
          </div>

          <div
            className="flex flex-row-reverse items-center gap-4 flex-1 justify-center min-w-0"
          >
            {isAuthenticated && (
              <NavigationActions 
                items={finalNavigationItems} 
                variant="pill" 
              />
            )}
          </div>

          {isAuthenticated && (
                <div
                 className={twMerge(
                   'transition-all duration-500',
                   isScrolled ? 'scale-90' : 'scale-100'
                 )}
               >            
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 p-0.5">
                <UserAvatar compact />
              </div>
         
            </div>
          )}
        </header>
        <div
          ref={contentRef}
          className={twMerge(
            `
            flex-1 min-h-0
            flex flex-col
            rounded-t-[31px]
            px-6 pb-6
            overflow-auto
            `,
            contentContainerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};