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
        title: 'طلبات تقديم توجيه',
        description: 'يمكنك الاطلاع على الطلبات التي تتطلب تقديم توجيه',
        breadcrumbs: [
          { label: 'طلبات تقديم توجيه', onClick: () => {} }
          ],
      }}
      useDynamicNavigation={true}
    />
  );
};

