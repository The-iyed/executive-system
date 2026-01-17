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
        title: 'تقييم المحتوى وإضافة التوجيهات',
        description: 'يمكنك تقييم المحتوى وإضافة التوجيهات',
        breadcrumbs: [{ label: 'تقييم المحتوى وإضافة التوجيهات', onClick: () => {} }],
      }}
      useDynamicNavigation={true}
    />
  );
};

