import { FormMeetingModal } from '../FormMeetingModal/FormMeetingModal';
import { CreateMeeting } from '../../features/create';
import { EditMeeting } from '../../features/edit';
import { useMeetingFormDrawer, type UseMeetingFormDrawerOptions } from '../../hooks/useMeetingFormDrawer';

export interface MeetingFormDrawerProps extends UseMeetingFormDrawerOptions {}

export function MeetingFormDrawer({ createEditBasePath }: MeetingFormDrawerProps) {
  const {
    open: formDrawerOpen,
    formMode,
    editId,
    onOpenChange: onFormDrawerOpenChange,
  } = useMeetingFormDrawer({ createEditBasePath });

  if (!formDrawerOpen) return null;

  return (
    <FormMeetingModal open={formDrawerOpen} onOpenChange={onFormDrawerOpenChange}>
      {formMode === 'create' && (
        <CreateMeeting open={true} onOpenChange={onFormDrawerOpenChange} />
      )}
      {formMode === 'edit' && editId && (
        <EditMeeting open={true} onOpenChange={onFormDrawerOpenChange} meetingId={editId} />
      )}
    </FormMeetingModal>
  );
}

export default MeetingFormDrawer;
