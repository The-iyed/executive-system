import React from 'react';
import { SharedLayout, NavItem } from '@shared';
import ScheduleReviewIcon from '../../shared/assets/schedule-review.svg';
import { PATH } from '../routes/paths';
import HomeIcon from '@shared/assets/home-02.svg';

export interface LayoutProps {
  children: React.ReactNode;
}

// UC03 Navigation Items
const uc03NavItems: NavItem[] = [
  {
    id: 'consultation-requests',
    icon: ScheduleReviewIcon,
    label: 'طلبات الاستشارات',
    path: PATH.CONSULTATION_REQUESTS,
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'طلبات الاستشارات',
        description: 'يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها',
        breadcrumbs: [{ label: 'طلبات الاستشارات', onClick: () => {} }],
      }}
      authenticated={true}
      navigationItems={uc03NavItems}
    />
  );
};

