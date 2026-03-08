import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PATH } from '../../../routes/paths';
import { clearDraftData } from '../utils';
import { trackEvent } from '@/lib/analytics';

const FORM_PARAM = 'form';
const ID_PARAM = 'id';

export type MeetingFormDrawerMode = 'create' | 'edit' | null;

export function useMeetingFormDrawer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ id: string }>();

  const form = searchParams.get(FORM_PARAM) as MeetingFormDrawerMode;
  const idFromSearch = searchParams.get(ID_PARAM);
  const idFromPath = params.id;
  const editId = idFromSearch ?? idFromPath ?? null;

  const isCreate = form === 'create';
  const isEdit = form === 'edit' && !!editId;
  const open = isCreate || isEdit;

  const closeDrawer = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(FORM_PARAM);
      next.delete(ID_PARAM);
      return next;
    });
  }, [setSearchParams]);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeDrawer();
    },
    [closeDrawer]
  );

  const openCreateDrawer = useCallback(() => {
    trackEvent('UC-01', 'uc01_meeting_request_started');
    clearDraftData();
    navigate(`${PATH.MEETINGS}?${FORM_PARAM}=create`);
  }, [navigate]);

  const openEditDrawer = useCallback(
    (meetingId: string) => {
      trackEvent('UC-01', 'uc01_meeting_edit_opened', { meeting_id: meetingId });
      clearDraftData();
      const currentPath = window.location.pathname;
      const isPreviewOrDetail = currentPath.includes('/meeting/');
      if (isPreviewOrDetail && params.id) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set(FORM_PARAM, 'edit');
          return next;
        });
      } else {
        navigate(`${PATH.MEETINGS}?${FORM_PARAM}=edit&${ID_PARAM}=${meetingId}`);
      }
    },
    [navigate, params.id, setSearchParams]
  );

  return {
    open,
    formMode: open ? (isCreate ? 'create' : 'edit') : null,
    editId: isEdit ? editId : null,
    onOpenChange,
    openCreateDrawer,
    openEditDrawer,
  };
}
