import React from 'react';
import { SharedLayout } from '@shared';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <SharedLayout
    children={children}
    welcomeSection={{
      title: 'طلب اجتماع',
      description: 'أدخل البيانات اللازمة لإضافة اجتماع جديد.',
      // breadcrumbs: [{ label: 'إضافة اجتماع', onClick: () => {} }],
      actions: [{ label: 'إنشاء اجتماع', variant: 'primary', onClick: () => {} }, { label: 'عرض المسودات', variant: 'secondary', onClick: () => {} }]
    }}
    authenticated={true}
    />
)};