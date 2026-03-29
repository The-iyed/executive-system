import React from 'react';
import { SharedLayout, WelcomeSectionProps } from '@/modules/shared';
import { PATH } from '../routes/paths';

export interface LayoutProps {
  children: React.ReactNode;
}

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
