import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SharedLayout } from '@shared';
import { LayoutProps, WelcomeConfig } from './types';
import { PATH } from '../routes/paths';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

const defaultActions: WelcomeConfig['actions'] = [
  { 
    label: 'إنشاء اجتماع', 
    variant: 'primary',  
    onClick: () => navigate(`${PATH.NEW_MEETING}?new=true`, { state: { isNewMeeting: true } }), 
  }, 
  { label: 'عرض المسودات', variant: 'secondary', onClick: () => {} }
]

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
  [PATH.SCHEDULED_MEETINGS]: {
    title: 'الاجتماعات المجدولة',
    description: 'الاطلاع على الاجتماعات المجدولة',
    actions: defaultActions
  },
  [PATH.WORK_BASKET]: {
    title: 'سلة العمل - طلبات قيد المراجعة',
    description: 'الاطلاع على الطلبات قيد المراجعة',
    actions: defaultActions
  },
};

const welcome = welcomeByPath[pathname];

  return (
    <SharedLayout
    children={children}
    useDynamicNavigation={true}
    welcomeSection={{
      title: welcome?.title ?? 'مرحباً بك',
      description: welcome?.description,
      breadcrumbs: welcome?.breadcrumbs,
      actions: welcome?.actions
    }}
    />
)};