import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SharedLayout } from '@shared';
// Using the same icons as UC01 for now - can be replaced with UC02-specific icons later
import { PATH } from '../routes/paths';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  // Show button only on directives page
  const isDirectivesPage = pathname === PATH.DIRECTIVES;
  
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'مراجعة الجدولة',
        description: 'مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.',
        breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }],
        actions: isDirectivesPage ? [
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

