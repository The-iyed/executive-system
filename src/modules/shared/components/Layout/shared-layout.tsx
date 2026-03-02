import React, { useMemo, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/modules/auth';
import { useContainerScroll, useUserNavigation } from '@/modules/shared/hooks';
import { NavigationActions, NavItem } from '../navigation-actions';
import { UserAvatar } from '../user-avatar';
import { WelcomeSectionProps } from '../welcome-section';
import { type ContentBarFilterTab } from '../content-bar';
import { Logo } from '../logo';
import { Bell } from 'lucide-react';

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
  useContainerScroll(contentRef, 30);
  const isScrolled = true;

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
    <div className="h-screen flex flex-col relative w-full overflow-hidden bg-gray-50" dir="rtl">
      <div className={twMerge('relative flex flex-col flex-1 min-h-0 z-10', headerClassName)}>
        {/* ─── Navbar ─── */}
        <header
          className={twMerge(
            `
            sticky top-0 z-50
            flex items-center justify-between gap-6
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            `,
            isScrolled
              ? `
                top-3 mx-6
                h-14 px-5
                rounded-2xl
                bg-white/70
                backdrop-blur-2xl
                shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                border border-white/60
                scale-[0.99]
                `
              : `
                h-[72px] px-8
                bg-white
                border-b border-gray-100
                `
          )}
        >
          {/* Right: Logo */}
          <div className={twMerge(
            'transition-all duration-500 flex-shrink-0',
            isScrolled ? 'scale-[0.88]' : 'scale-100'
          )}>
            <Logo />
          </div>

          {/* Center: Navigation */}
          <nav className="flex-1 flex justify-center min-w-0">
            {isAuthenticated && (
              <NavigationActions
                items={finalNavigationItems}
                variant="pill"
              />
            )}
          </nav>

          {/* Left: Actions */}
          {isAuthenticated && (
            <div className={twMerge(
              'flex items-center gap-3 flex-shrink-0 transition-all duration-500',
              isScrolled ? 'scale-[0.88]' : 'scale-100'
            )}>
              {/* Notification bell */}
              <button
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 left-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-200" />

              {/* User avatar */}
              <UserAvatar compact />
            </div>
          )}
        </header>

        {/* ─── Content ─── */}
        <div
          ref={contentRef}
          className={twMerge(
            'flex-1 min-h-0 flex flex-col px-6 pb-6 pt-4 overflow-auto',
            contentContainerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
