import React from 'react';
import { useLocation } from 'react-router-dom';
import { TooltipProvider } from '@sanad-ai/ui';
import { SharedLayout } from '@shared';
import { FormMeetingModal } from '../features/MeetingForm/components/FormMeetingModal/FormMeetingModal';
import { useMeetingFormDrawer } from '../features/MeetingForm/hooks/useMeetingFormDrawer';
import { CreateMeeting } from '../features/MeetingForm/features/create';
import { EditMeeting } from '../features/MeetingForm/features/edit';
import { LayoutProps, WelcomeConfig } from './types';
import { PATH } from '../routes/paths';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const { pathname } = useLocation();
  const {
    open: formDrawerOpen,
    formMode,
    editId,
    onOpenChange: onFormDrawerOpenChange,
    openCreateDrawer,
  } = useMeetingFormDrawer();

  const defaultActions: WelcomeConfig['actions'] = [
    {
      label: 'إنشاء اجتماع',
      variant: 'primary',
      onClick: openCreateDrawer,
    },
  ];

const welcomeByPath: Record<string, WelcomeConfig> = {
  [PATH.MEETINGS]: {
    title: 'الطلبات الحالية',
    description: 'الاطلاع على الطلبات الحالية',
    actions: defaultActions
  },
  [PATH.NEW_MEETING]: {
    title:"طلب اجتماع", 
    description:"أدخل البيانات اللازمة بعناية لإضافة اجتماع جديد.", 
    breadcrumbs:[{ label: 'إضافة اجتماع', onClick: () => {} }]
  },
  [PATH.PREVIOUS_MEETINGS]: {
    title: 'الاجتماعات السابقة',
    description: 'الاطلاع على الاجتماعات السابقة',
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
    <TooltipProvider>
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
      {formDrawerOpen && (
        <FormMeetingModal open={formDrawerOpen} onOpenChange={onFormDrawerOpenChange}>
          {formMode === 'create' && (
            <CreateMeeting open={true} onOpenChange={onFormDrawerOpenChange} />
          )}
          {formMode === 'edit' && editId && (
            <EditMeeting open={true} onOpenChange={onFormDrawerOpenChange} meetingId={editId} />
          )}
        </FormMeetingModal>
      )}
    </TooltipProvider>
  );
};