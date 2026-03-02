import React from 'react';
import { SharedLayout } from '@/modules/shared';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'تقديم استشارة المحتوى',
        description: 'يمكنك تقييم المحتوى وتقديم استشارة',
        breadcrumbs: [{ label: 'تقديم استشارة المحتوى', onClick: () => {} }],
      }}
      useDynamicNavigation={true}
    />
  );
};

