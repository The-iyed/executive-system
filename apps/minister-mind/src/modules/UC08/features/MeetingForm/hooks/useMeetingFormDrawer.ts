import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { clearDraftData } from '../utils';
import { PATH } from '../../../routes/paths';

const FORM_PARAM = 'form';
const ID_PARAM = 'id';

export type MeetingFormDrawerMode = 'create' | 'edit' | null;

export interface UseMeetingFormDrawerOptions {
  createEditBasePath?: string;
}

export function useMeetingFormDrawer(options?: UseMeetingFormDrawerOptions) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ id: string }>();

  const basePath = options?.createEditBasePath ?? PATH.MEETINGS;

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
    clearDraftData();
    navigate(`${basePath}?${FORM_PARAM}=create`);
  }, [navigate, basePath]);

  const openEditDrawer = useCallback(
    (meetingId: string) => {
      clearDraftData();
      const currentPath = window.location.pathname;
      const isPreviewOrDetail = currentPath.includes('/uc08/meeting/') && currentPath.includes('/preview');
      if (isPreviewOrDetail && params.id) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set(FORM_PARAM, 'edit');
          return next;
        });
      } else {
        navigate(`${basePath}?${FORM_PARAM}=edit&${ID_PARAM}=${meetingId}`);
      }
    },
    [navigate, basePath, params.id, setSearchParams]
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
