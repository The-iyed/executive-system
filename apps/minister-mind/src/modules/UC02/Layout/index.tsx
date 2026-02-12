import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SharedLayout, WelcomeSectionProps } from '@shared';
import { USE_CASE_CONFIGS } from '@shared';
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
  
  // Configure welcome section based on path
  const getWelcomeConfig = (): WelcomeSectionProps => {
    if (pathname === PATH.SCHEDULED_MEETINGS) {
      return {
        title: 'الاجتماعات السابقة',
        description: 'الاطلاع على الاجتماعات السابقة',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
    if (pathname === PATH.WORK_BASKET) {
      return {
        title: 'الطلبات الحالية',
        description: 'الاطلاع على الطلبات الحالية',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
    if (pathname === PATH.WAITING_LIST) {
      return {
        title: 'قائمة الانتظار',
        description: 'الاطلاع على طلبات قائمة الانتظار',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
    if (pathname === PATH.CALENDAR) {
      return {
        title: 'التقويم',
        description: 'عرض الجدول الزمني للاجتماعات',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
    // Default for schedule-review and directives
    return {
      title: 'مراجعة الجدولة',
      description: 'مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.',
      breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }],
      actions: showCreateMeetingButton ? [
        {
          label: 'إنشاء اجتماع مباشر',
          variant: 'primary',
          onClick: () => {
            navigate('/uc08/meetings?form=create');
          }
        }
      ] : undefined,
    };
  };
  
  const hideContentBarFilterTabs = pathname === PATH.WORK_BASKET || pathname === PATH.SCHEDULE_REVIEW;
  const isMeetingDetail = pathname.startsWith('/meeting/') && pathname.split('/').filter(Boolean).length >= 2;

  return (
    <SharedLayout
      children={children}
      welcomeSection={getWelcomeConfig()}
      navigationItems={USE_CASE_CONFIGS['UC-02'].navigationItems}
      useDynamicNavigation={false}
      contentBarFilterTabs={hideContentBarFilterTabs ? [] : undefined}
      hideContentBar={isMeetingDetail}
      contentContainerClassName={isMeetingDetail ? 'bg-transparent' : undefined}
    />
  );
};

