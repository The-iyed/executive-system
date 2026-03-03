import React from 'react';
import FormMeetingModal from '../FormMeetingModal/FormMeetingModal';
import { CreateMeeting } from '../../features/create';
import { EditMeeting, type EditMeetingProps } from '../../features/edit';
import { useMeetingFormDrawer } from '../../hooks/useMeetingFormDrawer';

export interface MeetingFormDrawerProps {
  initialMeetingData?: EditMeetingProps['initialMeetingData'];
}

export const MeetingFormDrawer: React.FC<MeetingFormDrawerProps> = ({ initialMeetingData }) => {
  const {
    open: formDrawerOpen,
    formMode,
    editId,
    onOpenChange: onFormDrawerOpenChange,
  } = useMeetingFormDrawer();

  if (!formDrawerOpen || !formMode) return null;

  return (
    <FormMeetingModal open={formDrawerOpen} onOpenChange={onFormDrawerOpenChange}>
      {formMode === 'create' && (
        <CreateMeeting open={true} onOpenChange={onFormDrawerOpenChange} />
      )}
      {formMode === 'edit' && editId && (
        <EditMeeting
          open={true}
          onOpenChange={onFormDrawerOpenChange}
          meetingId={editId}
          initialMeetingData={initialMeetingData}
        />
      )}
    </FormMeetingModal>
  );
};

export default MeetingFormDrawer;