import React from 'react';
import { SharedLayout } from '@/modules/shared';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      useDynamicNavigation={true}
    />
  );
};

