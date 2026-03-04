import React from 'react';
import { TooltipProvider } from '@/lib/ui';
import { SharedLayout } from '@/modules/shared';
import { LayoutProps } from './types';
import MeetingFormDrawer from '../features/MeetingForm/components/MeetingFormDrawer/MeetingFormDrawer';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <TooltipProvider>
      <SharedLayout
        children={children}
        useDynamicNavigation={true}
      />

      <MeetingFormDrawer />
    </TooltipProvider>
  );
};