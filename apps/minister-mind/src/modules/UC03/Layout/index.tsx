import React from 'react';
import { SharedLayout } from '@shared';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'طلبات الاستشارات',
        description: 'يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها',
        breadcrumbs: [{ label: 'طلبات الاستشارات', onClick: () => {} }],
      }}
      useDynamicNavigation={true}
    />
  );
};

