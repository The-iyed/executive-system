import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavItem, SharedLayout } from '@shared';
import CalendarIcon from '@shared/assets/calendar-minus-01.svg';
import HomeIcon from '@shared/assets/home-02.svg';
import { LayoutProps, WelcomeConfig } from './types';
import { PATH } from '../routes/paths';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

const defaultActions: WelcomeConfig['actions'] = [
  { label: 'إنشاء اجتماع', variant: 'primary',  onClick: () => navigate(PATH.NEW_MEETING), }, 
  { label: 'عرض المسودات', variant: 'secondary', onClick: () => {} }
]

const uc01NavItems: NavItem[] = [
  {
    id: 'home',
    icon: HomeIcon,
    label: 'الصفحة الرئيسية',
    path: PATH.HOME
  },
  {
    id: 'calendar',
    icon: CalendarIcon,
    label: 'الاجتماعات',
    path: PATH.MEETINGS
  }
];

const welcomeByPath: Record<string, WelcomeConfig> = {
  [PATH.HOME]: {
    title: 'مرحباً بك،',
    description: 'لوحة التحكم الرئيسية - المنصة التنفيذية لجدولة الاجتماعات',
    actions: defaultActions
  },
  [PATH.MEETINGS]: {
    title: 'الاجتماعات',
    description: 'يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها.',
    actions: defaultActions
  },
  [PATH.NEW_MEETING]: {
    title:"طلب اجتماع", 
    description:"أدخل البيانات اللازمة بعناية لإضافة اجتماع جديد.", 
    breadcrumbs:[{ label: 'إضافة اجتماع', onClick: () => {} }]
  },
};

const welcome = welcomeByPath[pathname];

  return (
    <SharedLayout
    children={children}
    navigationItems={uc01NavItems}
    welcomeSection={{
      title: welcome?.title ?? 'مرحباً بك',
      description: welcome?.description,
      breadcrumbs: welcome?.breadcrumbs,
      actions: welcome?.actions
    }}
    />
)};