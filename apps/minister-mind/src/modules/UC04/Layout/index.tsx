import React from 'react';
import { SharedLayout, NavItem } from '@shared';
import ScheduleReviewIcon from '../../shared/assets/schedule-review.svg';
import { PATH } from '../routes/paths';
import HomeIcon from '@shared/assets/home-02.svg';

export interface LayoutProps {
  children: React.ReactNode;
}

// UC04 Navigation Items
const uc04NavItems: NavItem[] = [
  {
    id: 'guidance-requests',
    icon: ScheduleReviewIcon,
    label: 'طلبات تقديم توجيه',
    path: PATH.GUIDANCE_REQUESTS,
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'طلبات تقديم توجيه',
        description: 'يمكنك الاطلاع على الطلبات التي تتطلب تقديم توجيه',
        breadcrumbs: [{ label: 'طلبات تقديم توجيه', onClick: () => {} }],
      }}
      useDynamicNavigation={true}
    />
  );
};

