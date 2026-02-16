import React from 'react';
import { useLocation } from 'react-router-dom';
import { SharedLayout } from '@shared';
import { LayoutProps, WelcomeConfig } from './types';
import { PATH } from '../routes/paths';
import { MeetingFormDrawer } from '../features/MeetingForm/components/MeetingFormDrawer';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const { pathname } = useLocation();

  const welcomeByPath: Record<string, WelcomeConfig> = {
    [PATH.MEETINGS]: {
      title: 'الاجتماعات',
      description: 'إدارة الاجتماعات',
    },
    [PATH.NEW_MEETING]: {
      title: 'طلب اجتماع',
      description: 'أدخل البيانات اللازمة بعناية لإضافة اجتماع جديد.',
      breadcrumbs: [{ label: 'إضافة اجتماع', onClick: () => {} }],
    },
  };

  const welcome = welcomeByPath[pathname];

  return (
    <>
      <SharedLayout
        useDynamicNavigation={true}
        welcomeSection={{
          title: welcome?.title ?? 'مرحباً بك',
          description: welcome?.description,
          breadcrumbs: welcome?.breadcrumbs,
          actions: welcome?.actions,
        }}
      >
        {children}
      </SharedLayout>
      <MeetingFormDrawer />
    </>
  );
};