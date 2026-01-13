import React from 'react';
import { SharedLayout, NavItem } from '@shared';
// Using the same icons as UC01 for now - can be replaced with UC02-specific icons later
import ScheduleReviewIcon from '../../shared/assets/schedule-review.svg';
import { PATH } from '../routes/paths';
import HomeIcon from '@shared/assets/home-02.svg';

export interface LayoutProps {
  children: React.ReactNode;
}

// UC02 Navigation Items - 4 items starting with مراجعة الجدولة
const uc02NavItems: NavItem[] = [
  {
    id: 'schedule-review',
    icon: ScheduleReviewIcon,
    label: 'مراجعة الجدولة',
    path: PATH.SCHEDULE_REVIEW
  },
  {
    id: 'schedule-management',
    icon: ScheduleReviewIcon,
    label: 'إدارة الجدولة'
  },
  {
    id: 'schedule-approval',
    icon: ScheduleReviewIcon,
    label: 'الموافقة على الجدولة'
  },
  {
    id: 'schedule-reports',
    icon: HomeIcon,
    label: 'تقارير الجدولة'
  }
];

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'مراجعة الجدولة',
        description: 'مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة.',
        breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }]
      }}
      authenticated={true}
      navigationItems={uc02NavItems}
    />
  );
};

