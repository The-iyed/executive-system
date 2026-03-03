import React from 'react';
import { useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/lib/ui';
import { SharedLayout } from '@/modules/shared';
import { LayoutProps, WelcomeConfig } from './types';
import FormMeetingModal from '../features/MeetingForm/components/FormMeetingModal/FormMeetingModal';
import { EditMeeting } from '../features/MeetingForm/features/edit';
import { CreateMeeting } from '../features/MeetingForm/features/create';
import { useMeetingFormDrawer } from '../features/MeetingForm/hooks';
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
  } = useMeetingFormDrawer();

  const welcomeByPath: Record<string, WelcomeConfig> = {
    [PATH.MEETINGS]: {
      title: 'الطلبات الحالية',
      description: 'الاطلاع على الطلبات الحالية',
    },
    [PATH.PREVIOUS_MEETINGS]: {
      title: 'الاجتماعات السابقة',
      description: 'الاطلاع على الاجتماعات السابقة',
    },
    [PATH.WORK_BASKET]: {
      title: 'سلة العمل - طلبات قيد المراجعة',
      description: 'الاطلاع على الطلبات قيد المراجعة',
    },
  };

  const welcome = welcomeByPath[pathname];
  const hideContentBar = pathname === PATH.MEETINGS || pathname === PATH.WORK_BASKET || pathname === PATH.PREVIOUS_MEETINGS || pathname === PATH.SCHEDULED_MEETINGS;

  return (
    <TooltipProvider>
      <SharedLayout
        children={children}
        useDynamicNavigation={true}
        hideContentBar={hideContentBar}
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