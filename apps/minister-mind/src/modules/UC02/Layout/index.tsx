import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SharedLayout } from '@shared';
import { PATH } from '../routes/paths';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Show button on both schedule-review and directives pages
  const showCreateMeetingButton = pathname === PATH.SCHEDULE_REVIEW || pathname === PATH.DIRECTIVES;
  
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'مراجعة الجدولة',
        description: 'مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.',
        breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }],
        actions: showCreateMeetingButton ? [
          {
            label: 'إنشاء اجتماع مباشر',
            variant: 'primary',
            onClick: () => {
              navigate('/uc08/meetings/new');
            }
          }
        ] : undefined
      }}
      useDynamicNavigation={true}
    />
  );
};

