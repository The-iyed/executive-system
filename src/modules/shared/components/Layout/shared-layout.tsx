import React, { useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { useAuth } from '@/modules/auth';
import { useContainerScroll, useUserNavigation } from '@/modules/shared/hooks';
import { NavigationActions, NavItem } from '../navigation-actions';
import { UserAvatar } from '../user-avatar';
import { WelcomeSectionProps } from '../welcome-section';
import { type ContentBarFilterTab } from '../content-bar';
import { Logo } from '../logo';
import { Bell, Bug } from 'lucide-react';
import { MobileNavDrawer, MobileMenuTrigger } from '../mobile-nav-drawer';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  useContainerScroll(contentRef, 30);

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
          className="
            sticky top-2 z-50 mx-3 md:mx-4
            flex items-center justify-between
            h-[56px] md:h-[64px] px-4 md:px-5
            rounded-2xl md:rounded-3xl
            bg-white/95 backdrop-blur-sm
            shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]
            border border-gray-100
          "
        >
          {/* Right: Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Center: Navigation (hidden on mobile) */}
          <nav className="flex-1 flex justify-center min-w-0 mx-2">
            {isAuthenticated && (
              <NavigationActions
                items={finalNavigationItems}
                variant="pill"
              />
            )}
          </nav>

          {/* Left: Actions */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* Mobile menu trigger */}
              <MobileMenuTrigger onClick={() => setMobileMenuOpen(true)} />

              {/* TEMPORARY: Sentry test button */}
              <button
                onClick={() => { throw new Error('Sentry Test Error — safe to ignore'); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Test Sentry"
              >
                <Bug className="w-[18px] h-[18px]" />
              </button>

              {/* Notification bell */}
              <button
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                aria-label="الإشعارات"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Divider - hidden on mobile */}
              <div className="hidden md:block w-px h-7 bg-gray-200" />

              {/* User avatar */}
              <UserAvatar compact />
            </div>
          )}
        </header>

        {/* Mobile drawer */}
        {isAuthenticated && (
          <MobileNavDrawer
            items={finalNavigationItems ?? []}
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
          />
        )}

        {/* ─── Content ─── */}
        <div
          ref={contentRef}
          className={twMerge(
            'flex-1 min-h-0 flex flex-col px-3 md:px-6 pb-6 pt-4 overflow-auto',
            contentContainerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
