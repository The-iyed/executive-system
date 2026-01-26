import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SharedLayout, WelcomeSectionProps } from '@shared';
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
        title: 'الاجتماعات المجدولة',
        description: 'الاطلاع على الاجتماعات المجدولة',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
    if (pathname === PATH.WORK_BASKET) {
      return {
        title: 'سلة العمل - طلبات قيد المراجعة',
        description: 'الاطلاع على الطلبات قيد المراجعة',
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
            navigate('/uc08/meetings/new');
          }
        }
      ] : undefined,
    };
  };
  
  return (
    <SharedLayout
      children={children}
      welcomeSection={getWelcomeConfig()}
      useDynamicNavigation={true}
    />
  );
};

