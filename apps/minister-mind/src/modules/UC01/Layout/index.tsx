import React from 'react';
import { NavItem, SharedLayout } from '@shared';
import HomeIcon from '@shared/assets/home-02.svg';
import CalendarIcon from '@shared/assets/calendar-minus-01.svg';

export interface LayoutProps {
  children: React.ReactNode;
}

const uc01NavItems: NavItem[] = [
  {
    id: 'home',
    icon: HomeIcon,
    label: 'الصفحة الرئيسية'
  },
  {
    id: 'calendar',
    icon: CalendarIcon,
    label: 'الاجتماعات'
  }
];

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <SharedLayout
    children={children}
    navigationItems={uc01NavItems}
    welcomeSection={{
      title: 'طلب اجتماع',
      description: 'أدخل البيانات اللازمة لإضافة اجتماع جديد.',
      // breadcrumbs: [{ label: 'إضافة اجتماع', onClick: () => {} }],
      actions: [{ label: 'إنشاء اجتماع', variant: 'primary', onClick: () => {} }, { label: 'عرض المسودات', variant: 'secondary', onClick: () => {} }]
    }}
    />
)};