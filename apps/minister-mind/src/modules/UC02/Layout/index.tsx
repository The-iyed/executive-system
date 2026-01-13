import React from 'react';
import { SharedLayout, NavItem } from '@shared';
// Using the same icons as UC01 for now - can be replaced with UC02-specific icons later
import CalendarIcon from '@shared/assets/calendar-minus-01.svg';
import HomeIcon from '@shared/assets/home-02.svg';

export interface LayoutProps {
  children: React.ReactNode;
}

// UC02 Navigation Items - 4 items starting with مراجعة الجدولة
const uc02NavItems: NavItem[] = [
  {
    id: 'schedule-review',
    icon: CalendarIcon,
    label: 'مراجعة الجدولة'
  },
  {
    id: 'schedule-management',
    icon: CalendarIcon,
    label: 'إدارة الجدولة'
  },
  {
    id: 'schedule-approval',
    icon: CalendarIcon,
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
        breadcrumbs: [{ label: 'مراجعة الجدولة', onClick: () => {} }],
        actions: [
          { label: 'إنشاء جدولة جديدة', variant: 'primary', onClick: () => {} }, 
          { label: 'عرض الجدول', variant: 'secondary', onClick: () => {} }
        ]
      }}
      authenticated={true}
      navigationItems={uc02NavItems}
    />
  );
};

