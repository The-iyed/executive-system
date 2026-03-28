import React from 'react';
import { TooltipProvider } from '@/lib/ui';
import { SharedLayout } from '@/modules/shared';
import { LayoutProps } from './types';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <TooltipProvider>
      <SharedLayout
        children={children}
        useDynamicNavigation={true}
      />
    </TooltipProvider>
  );
};