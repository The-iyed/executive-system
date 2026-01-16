import React from 'react';
import { SharedLayout, NavItem } from '@shared';
import ScheduleReviewIcon from '../../shared/assets/schedule-review.svg';
import { PATH } from '../routes/paths';

export interface LayoutProps {
  children: React.ReactNode;
}

// UC05 Navigation Items
const uc05NavItems: NavItem[] = [
  {
    id: 'content-requests',
    icon: ScheduleReviewIcon,
    label: 'تقييم المحتوى وإضافة التوجيهات',
    path: PATH.CONTENT_REQUESTS,
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SharedLayout
      children={children}
      welcomeSection={{
        title: 'تقييم المحتوى وإضافة التوجيهات',
        description: 'يمكنك تقييم المحتوى وإضافة التوجيهات',
        breadcrumbs: [{ label: 'تقييم المحتوى وإضافة التوجيهات', onClick: () => {} }],
      }}
      useDynamicNavigation={true}
    />
  );
};

