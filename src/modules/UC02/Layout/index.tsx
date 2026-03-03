import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SharedLayout, WelcomeSectionProps } from '@/modules/shared';
import { USE_CASE_CONFIGS } from '@/modules/shared';
import { PATH } from '../routes/paths';
import { prefetchOutlookTimelineWeeksAround } from '../data/calendarApi';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();

  // Prefetch calendar timeline for first week + previous + next so /calendar loads fast
  useEffect(() => {
    prefetchOutlookTimelineWeeksAround(queryClient, new Date(), { weeksBack: 1, weeksAhead: 1 }).catch(() => {
      // ignore prefetch errors
    });
  }, [queryClient]);
  const getWelcomeConfig = (): WelcomeSectionProps => {
    if (pathname === PATH.DASHBOARD) {
      return {
        title: 'الرئيسية',
        description: 'لوحة المعلومات والإحصائيات',
        breadcrumbs: undefined,
        actions: undefined,
      };
    }
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
    return {
      title: 'مراجعة الجدولة',
      description: 'مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.',
      breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }],
    };
  };
  
  const hideContentBarFilterTabs = pathname === PATH.WORK_BASKET || pathname === PATH.WAITING_LIST || pathname === PATH.SCHEDULED_MEETINGS;
  const isMeetingDetail = pathname.startsWith('/meeting/') && pathname.split('/').filter(Boolean).length >= 2;
  const isCalendar = pathname === PATH.CALENDAR;
  const isDashboard = pathname === PATH.DASHBOARD;
  const isWaitingList = pathname === PATH.WAITING_LIST;
  const isScheduledMeetings = pathname === PATH.SCHEDULED_MEETINGS;

  return (
      <SharedLayout
        children={children}
        welcomeSection={getWelcomeConfig()}
        navigationItems={USE_CASE_CONFIGS['UC-02'].navigationItems}
        useDynamicNavigation={false}
        contentBarFilterTabs={hideContentBarFilterTabs ? [] : undefined}
        hideContentBar={isMeetingDetail || isCalendar || isDashboard || isWaitingList || isScheduledMeetings}
        contentContainerClassName={isMeetingDetail ? 'bg-transparent' : undefined}
      />
  );
};