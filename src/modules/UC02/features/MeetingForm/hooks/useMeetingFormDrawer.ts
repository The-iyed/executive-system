import { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { clearDraftData } from '../utils';
import { PATH as PATH_UC02 } from '../../../../UC02/routes/paths';
import { trackEvent } from '@/lib/analytics';

const FORM_PARAM = 'form';
const ID_PARAM = 'id';

export type MeetingFormDrawerMode = 'create' | 'edit' | null;

export interface UseMeetingFormDrawerOptions {
  createEditBasePath?: string;
}

export function useMeetingFormDrawer(options?: UseMeetingFormDrawerOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ id: string }>();
  const [forceClosed, setForceClosed] = useState(false);

  const basePath = options?.createEditBasePath ?? PATH_UC02.DIRECTIVES;

  const form = searchParams.get(FORM_PARAM) as MeetingFormDrawerMode;
  const idFromSearch = searchParams.get(ID_PARAM);
  const idFromPath = params.id;
  const editId = idFromSearch ?? idFromPath ?? null;

  const isCreate = form === 'create';
  const isEdit = form === 'edit' && !!editId;
  const openFromUrl = isCreate || isEdit;
  const open = openFromUrl && !forceClosed;

  useEffect(() => {
    if (!form) {
      setForceClosed(false);
    }
  }, [form]);

  const closeDrawer = useCallback(() => {
    setForceClosed(true);
    clearDraftData();
    const next = new URLSearchParams(location.search);
    next.delete(FORM_PARAM);
    next.delete(ID_PARAM);
    const search = next.toString();
    const to = { pathname: location.pathname, search: search ? `?${search}` : '' };
    navigate(to, { replace: true });
  }, [navigate, location.pathname, location.search]);

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeDrawer();
    },
    [closeDrawer]
  );

  const openCreateDrawer = useCallback(
    (additionalParams?: Record<string, string>) => {
      setForceClosed(false);
      clearDraftData();
      const params = new URLSearchParams();
      params.set(FORM_PARAM, 'create');
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value != null && value !== '') params.set(key, value);
        });
      }
      navigate(`${basePath}?${params.toString()}`);
    },
    [navigate, basePath]
  );

  const openEditDrawer = useCallback(
    (meetingId: string) => {
      trackEvent('UC-02', 'uc02_meeting_edit_opened', { meeting_id: meetingId });
      setForceClosed(false);
      clearDraftData();
      const currentPath = window.location.pathname;
      const isPreviewOrDetail = currentPath.includes(PATH_UC02.DIRECTIVES) && currentPath.includes('/preview');
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