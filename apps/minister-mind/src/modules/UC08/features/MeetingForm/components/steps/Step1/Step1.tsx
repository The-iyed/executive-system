import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, ActionButtons } from '@shared';
import type { OptionType } from '@shared';
import {
  getDirectivesPaginated,
  getUsers,
  getMeetings,
  getMeetingById,
  type DirectiveApiResponse,
  type UserApiResponse,
  type MeetingApiResponse,
} from '../../../../../data';
import type { Step1FormData } from '../../../schemas/step1.schema';
import { useStep1BusinessRules } from '../../../hooks/useStep1BusinessRules';
import { STEP1_TABS, STEP1_ASYNC_SELECT_PAGE_SIZE, SUBMITTER_ROLE_CODE } from '../../../constants/step1.constants';
import { MeetingInfoTab } from './MeetingInfoTab';
import { OtherSectionsTab } from './OtherSectionsTab';

export interface Step1Props {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  setTableErrors: Dispatch<SetStateAction<Record<string, Record<string, string>>>>;
  setTableTouched: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  fillFormFromPreviousMeeting?: (meeting: MeetingApiResponse) => void;
  handleAddGoal: () => void;
  handleDeleteGoal: (id: string) => void;
  handleUpdateGoal: (id: string, field: string, value: unknown) => void;
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: unknown) => void;
  handleAddSupport: () => void;
  handleDeleteSupport: (id: string) => void;
  handleUpdateSupport: (id: string, field: string, value: unknown) => void;
  handleAddPreviousMeeting: () => void;
  handleDeletePreviousMeeting: (id: string) => void;
  handleUpdatePreviousMeeting: (id: string, field: string, value: unknown) => void;
  handleAddDirective: () => void;
  handleDeleteDirective: (id: string) => void;
  handleUpdateDirective: (id: string, field: string, value: unknown) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  isFieldRequired: (field: keyof Step1FormData) => boolean;
}

/**
 * Step 1: Meeting Scheduling Form (refactored).
 *
 * Architecture:
 * - Tabs: Meeting Info (always editable when Normal; only editable tab when Follow-up/Recurring), Other Sections.
 * - Business rules: useStep1BusinessRules drives visibility/disabled state from Nature.
 * - Reusable field components in ./fields. Loaders for async selects defined here and passed to tabs.
 */
export function Step1({
  formData,
  errors,
  touched,
  tableErrors,
  tableTouched,
  setTableErrors,
  setTableTouched,
  isSubmitting,
  isDeleting,
  handleChange,
  handleBlur,
  fillFormFromPreviousMeeting,
  handleAddGoal,
  handleDeleteGoal,
  handleUpdateGoal,
  handleAddAgenda,
  handleDeleteAgenda,
  handleUpdateAgenda,
  handleAddSupport,
  handleDeleteSupport,
  handleUpdateSupport,
  handleAddPreviousMeeting,
  handleDeletePreviousMeeting,
  handleUpdatePreviousMeeting,
  handleAddDirective,
  handleDeleteDirective,
  handleUpdateDirective,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  isFieldRequired,
}: Step1Props) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(STEP1_TABS[0].id);

  const {
    isPreviousMeetingVisible,
    isPreviousMeetingRequired,
    isFieldDisabled,
    isOtherSectionsDisabled,
  } = useStep1BusinessRules(formData);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const directiveId = searchParams.get('directive_id');
    const directiveText = searchParams.get('directive_text');
    const relatedMeeting = searchParams.get('related_meeting');
    if (directiveId && directiveText && relatedMeeting) {
      handleChange('relatedDirective', {
        value: directiveId,
        label: directiveText,
        description: relatedMeeting,
      });
      handleChange('previousMeeting', relatedMeeting);
    }
  }, [location.search]);

  const loadDirectivesOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getDirectivesPaginated({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((d: DirectiveApiResponse) => ({
        value: d?.id ?? '',
        label: d?.directive_text ?? '',
        description: d?.related_meeting ?? '',
      }));
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: response?.has_next ?? false,
        has_previous: response?.has_previous ?? false,
      };
    },
    []
  );

  const loadUsersOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getUsers({
        search: search.trim() || undefined,
        role_code: SUBMITTER_ROLE_CODE,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((u: UserApiResponse) => {
        const fullName =
          ([u.first_name, u.last_name].filter(Boolean).join(' ') || u?.username || u?.email) ?? '';
        return { value: u?.id ?? '', label: fullName };
      });
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: response?.has_next ?? false,
        has_previous: response?.has_previous ?? false,
      };
    },
    []
  );

  const loadMeetingOwnerOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = (response?.items ?? []).map((u: UserApiResponse) => {
        const fullName =
          ([u.first_name, u.last_name].filter(Boolean).join(' ') || u?.username || u?.email) ?? '';
        return { value: u?.id ?? '', label: fullName };
      });
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: response?.has_next ?? false,
        has_previous: response?.has_previous ?? false,
      };
    },
    []
  );

  const loadPreviousMeetingsOptions = useCallback(
    async (search: string, skip: number, limit: number) => {
      const response = await getMeetings({
        search: search.trim() || undefined,
        skip,
        limit: limit || STEP1_ASYNC_SELECT_PAGE_SIZE,
      });
      const items = (response?.items ?? []).map((m: MeetingApiResponse) => ({
        value: m.id,
        label: m.meeting_title || m.meeting_subject || m.request_number || m.id,
      }));
      return {
        items,
        total: response?.total ?? 0,
        skip: response?.skip ?? 0,
        limit: response?.limit ?? limit,
        has_next: (response?.total ?? 0) > (response?.skip ?? 0) + items.length,
        has_previous: (response?.skip ?? 0) > 0,
      };
    },
    []
  );

  const onPreviousMeetingSelect = useCallback(
    async (option: OptionType | null) => {
      if (!option?.value) {
        handleChange('previousMeeting', '');
        return;
      }
      handleChange('previousMeeting', option.value);
      if (fillFormFromPreviousMeeting) {
        try {
          const meeting = await getMeetingById(option.value);
          fillFormFromPreviousMeeting(meeting);
        } catch (err) {
          console.error('Failed to load previous meeting details:', err);
        }
      }
    },
    [handleChange, fillFormFromPreviousMeeting]
  );

  const tabItems = STEP1_TABS.map((t) => ({ id: t.id, label: t.label }));

  return (
    <div className="w-full min-w-0 flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center w-full min-w-0 max-w-full">
        <Tabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="w-full max-w-full mx-auto"
        />

        {activeTab === 'meeting-info' && (
          <MeetingInfoTab
            formData={formData}
            errors={errors}
            touched={touched}
            handleChange={handleChange}
            handleBlur={handleBlur}
            isFieldRequired={isFieldRequired}
            isFieldDisabled={isFieldDisabled}
            isPreviousMeetingVisible={isPreviousMeetingVisible}
            isPreviousMeetingRequired={isPreviousMeetingRequired}
            loadDirectivesOptions={loadDirectivesOptions}
            loadUsersOptions={loadUsersOptions}
            loadMeetingOwnerOptions={loadMeetingOwnerOptions}
            loadPreviousMeetingsOptions={loadPreviousMeetingsOptions}
            onPreviousMeetingSelect={onPreviousMeetingSelect}
          />
        )}

        {activeTab === 'other-sections' && (
          <OtherSectionsTab
            formData={formData}
            errors={errors}
            tableErrors={tableErrors}
            tableTouched={tableTouched}
            setTableErrors={setTableErrors}
            setTableTouched={setTableTouched}
            handleChange={handleChange}
            handleBlur={handleBlur}
            handleAddGoal={handleAddGoal}
            handleDeleteGoal={handleDeleteGoal}
            handleUpdateGoal={handleUpdateGoal}
            handleAddAgenda={handleAddAgenda}
            handleDeleteAgenda={handleDeleteAgenda}
            handleUpdateAgenda={handleUpdateAgenda}
            handleAddSupport={handleAddSupport}
            handleDeleteSupport={handleDeleteSupport}
            handleUpdateSupport={handleUpdateSupport}
            handleAddPreviousMeeting={handleAddPreviousMeeting}
            handleDeletePreviousMeeting={handleDeletePreviousMeeting}
            handleUpdatePreviousMeeting={handleUpdatePreviousMeeting}
            handleAddDirective={handleAddDirective}
            handleDeleteDirective={handleDeleteDirective}
            handleUpdateDirective={handleUpdateDirective}
            isFieldRequired={isFieldRequired}
            disabled={isOtherSectionsDisabled}
          />
        )}

        <ActionButtons
          onCancel={handleCancelClick}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
}
