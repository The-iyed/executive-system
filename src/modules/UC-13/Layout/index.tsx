import React from 'react';
import { SharedLayout, WelcomeSectionProps } from '@/modules/shared';

export interface LayoutProps {
  children: React.ReactNode;
}

/** Shared shell for UC-13 host pages (e.g. directives) — same pattern as UC-19 minister directives. */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const getWelcomeConfig = (): WelcomeSectionProps => ({
    title: 'التوجيهات الوزارية',
    description: 'إدارة ومتابعة التوجيهات الوزارية',
    breadcrumbs: undefined,
    actions: undefined,
  });

  return (
    <SharedLayout
      children={children}
      welcomeSection={getWelcomeConfig()}
      useDynamicNavigation
      hideContentBar
    />
  );
};

export default Layout;
