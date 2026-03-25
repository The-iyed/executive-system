import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ActionButtons, MeetingAgendaTable, MeetingSubCategoryField, MeetingClassification, type OptionType } from '@/modules/shared';
import { getMeetingById, type MeetingApiResponse } from '../../../../../data';
import type { Step1FormData } from '../../../schemas/step1.schema';
import { getMeetingDurationMinutes } from '../../../schemas/step1.schema';
import { useStep1BusinessRules } from '../../../hooks/useStep1BusinessRules';
import {
  MeetingNatureField,
  PreviousMeetingField,
  ApplicantField,
  MeetingOwnerField,
  MeetingTitleField,
  MeetingDescriptionField,
  SectorField,
  MeetingTypeField,
  UrgentMeetingField,
  UrgentReasonField,
  MeetingDateFields,
  MeetingChannelField,
  LocationField,
  RequiresProtocolField,
  MeetingCategoryField,
  MeetingReasonField,
  RelatedTopicField,
  DueDateField,
  MeetingClassificationField,
  MeetingConfidentialityField,
  NotesField,
  GuidanceField,
} from './components';

const REQUIRED_INDICATOR_FIELDS = new Set<keyof Step1FormData>([
  'meetingTitle',
  'meetingCategory',
  'meeting_channel',
  'requester',
  'meetingOwner',
  'sector',
  'meetingType',
  'meetingStartDate',
]);

export interface Step1Props {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  handleAddAgenda: () => string;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: unknown) => void;
  fillFormFromPreviousMeeting?: (meeting: MeetingApiResponse) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  isFieldVisible: (field: keyof Step1FormData) => boolean;
}

export function Step1({
  formData,
  errors,
  touched,
  tableErrors,
  tableTouched,
  isSubmitting,
  isDeleting,
  handleChange,
  handleBlur,
  handleAddAgenda,
  handleDeleteAgenda,
  handleUpdateAgenda,
  fillFormFromPreviousMeeting,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  isFieldVisible,
}: Step1Props) {
  const location = useLocation();
  const { isFieldDisabled } = useStep1BusinessRules(formData);
  const [scrollToAgendaRowId, setScrollToAgendaRowId] = useState<string | null>(null);

  const handleAddAgendaWithScroll = useCallback(() => {
    const newRowId = handleAddAgenda();
    if (newRowId) setScrollToAgendaRowId(newRowId);
  }, [handleAddAgenda]);

  const isRequired = useCallback(
    (field: keyof Step1FormData): boolean => {
      if (field === 'meetingAgenda') return false; // UC02: أجندة الاجتماع always optional
      if (REQUIRED_INDICATOR_FIELDS.has(field)) return true;
      if (field === 'location') return formData.meeting_channel === 'PHYSICAL';
      // تصنيف الاجتماع: required only when فئة الاجتماع is "اجتماعات الأعمال" (Business Meetings)
      if (field === 'meetingClassification1') return formData.meetingCategory === MeetingClassification.BUSINESS;
      if (field === 'previousMeeting' || field === 'urgentReason' || field === 'meetingReason' || field === 'relatedTopic' || field === 'dueDate') {
        return isFieldVisible(field);
      }
      return false;
    },
    [formData.meeting_channel, formData.meetingCategory, isFieldVisible]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const directiveId = searchParams.get('directive_id');
    const directiveText = searchParams.get('directive_text');
    if (directiveId && directiveText) {
      handleChange('relatedDirective', {
        value: directiveId,
        label: directiveText,
      });
    }
  }, [location.search, handleChange]);

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

  const handleDirectiveChange = useCallback(
    (value: OptionType | null) => {
      handleChange('relatedDirective', value);
      handleChange('previousMeeting', value?.description ?? '');
    },
    [handleChange]
  );

  const previousMeetingValue =
    formData.previousMeeting != null && formData.previousMeeting !== ''
      ? typeof formData.previousMeeting === 'object'
        ? formData.previousMeeting
        : { value: formData.previousMeeting, label: formData.previousMeeting }
      : null;

  const toOption = (v: unknown): OptionType | null => {
    if (v == null || v === '') return null;
    if (typeof v === 'object' && v !== null && 'value' in v && 'label' in v) return v as OptionType;
    return { value: String(v), label: String(v) };
  };

  return (
    <div className="w-full min-w-0 flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center w-full min-w-0 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full space-y-0">
          <MeetingNatureField
            value={formData.meetingNature ?? ''}
            onChange={(v) => handleChange('meetingNature', v)}
            onBlur={() => handleBlur('meetingNature')}
            error={errors.meetingNature}
            touched={touched.meetingNature}
            disabled={isFieldDisabled('meetingNature')}
            required
          />

          {isFieldVisible('previousMeeting') && (
            <PreviousMeetingField
              value={previousMeetingValue}
              onChange={(v) => {
                if (v !== null && typeof v === 'object' && 'value' in v) {
                  onPreviousMeetingSelect(v);
                } else {
                  handleChange('previousMeeting', v ?? '');
                }
              }}
              visible
              required={isRequired('previousMeeting')}
              readOnly={false}
              error={errors.previousMeeting}
              touched={touched.previousMeeting}
              disabled={isFieldDisabled('previousMeeting')}
            />
          )}

          <ApplicantField
            value={toOption(formData.requester)}
            onChange={(v) => handleChange('requester', v)}
            error={errors.requester}
            touched={touched.requester}
            disabled={isFieldDisabled('requester')}
            required={isRequired('requester')}
          />

          <MeetingOwnerField
            value={toOption(formData.meetingOwner)}
            onChange={(v) => handleChange('meetingOwner', v)}
            error={errors.meetingOwner as string | undefined}
            touched={touched.meetingOwner}
            disabled={isFieldDisabled('meetingOwner')}
            required={isRequired('meetingOwner')}
          />

          <MeetingTitleField
            value={formData.meetingTitle ?? ''}
            onChange={(v) => handleChange('meetingTitle', v)}
            onBlur={() => handleBlur('meetingTitle')}
            error={errors.meetingTitle}
            touched={touched.meetingTitle}
            disabled={isFieldDisabled('meetingTitle')}
            required={isRequired('meetingTitle')}
          />

          <MeetingDescriptionField
            value={formData.meetingDescription ?? ''}
            onChange={(v) => handleChange('meetingDescription', v)}
            onBlur={() => handleBlur('meetingDescription')}
            error={errors.meetingDescription}
            touched={touched.meetingDescription}
            disabled={isFieldDisabled('meetingDescription')}
          />

          <SectorField
            value={formData.sector ?? ''}
            onChange={(v) => handleChange('sector', v)}
            error={errors.sector}
            touched={touched.sector}
            disabled={isFieldDisabled('sector')}
            required={isRequired('sector')}
          />

          <MeetingTypeField
            className="w-full min-w-0"
            value={formData.meetingType ?? ''}
            onChange={(v) => handleChange('meetingType', v)}
            error={errors.meetingType}
            touched={touched.meetingType}
            disabled={isFieldDisabled('meetingType')}
            required={isRequired('meetingType')}
          />

          <UrgentMeetingField
            className="gap-4"
            value={formData.isUrgent ?? false}
            onChange={(v) => handleChange('isUrgent', v)}
            error={errors.isUrgent}
            touched={touched.isUrgent}
            disabled={isFieldDisabled('isUrgent')}
          />

          {isFieldVisible('urgentReason') && (
            <UrgentReasonField
              value={formData.urgentReason ?? ''}
              onChange={(v) => handleChange('urgentReason', v)}
              onBlur={() => handleBlur('urgentReason')}
              error={errors.urgentReason}
              touched={touched.urgentReason}
              disabled={isFieldDisabled('urgentReason')}
              required={isRequired('urgentReason')}
            />
          )}

          <MeetingDateFields
            formData={formData}
            errors={errors}
            touched={touched}
            handleChange={(field, value) => handleChange(field as keyof Step1FormData, value)}
            handleBlur={(field) => handleBlur(field as keyof Step1FormData)}
            isFieldDisabled={(field) => isFieldDisabled(field as keyof Step1FormData)}
            mainDateRequired={isRequired('meetingStartDate')}
          />

          <MeetingChannelField
            value={formData.meeting_channel ?? ''}
            onChange={(v) => handleChange('meeting_channel', v)}
            error={errors.meeting_channel}
            touched={touched.meeting_channel}
            disabled={isFieldDisabled('meeting_channel')}
            required={isRequired('meeting_channel')}
          />

          {isFieldVisible('location') && (
            <LocationField
              className="w-full min-w-0"
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              isFieldDisabled={isFieldDisabled}
              isRequired={isRequired('location')}
            />
          )}

          <RequiresProtocolField
            className="gap-4"
            value={formData.requiresProtocol ?? false}
            onChange={(v) => handleChange('requiresProtocol', v)}
            error={errors.requiresProtocol}
            touched={touched.requiresProtocol}
            disabled={isFieldDisabled('requiresProtocol')}
          />

          <MeetingCategoryField
            value={formData.meetingCategory ?? ''}
            onChange={(v) => handleChange('meetingCategory', v)}
            error={errors.meetingCategory}
            touched={touched.meetingCategory}
            disabled={isFieldDisabled('meetingCategory')}
            required={isRequired('meetingCategory')}
          />

          {(formData.meetingCategory === MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL ||
            formData.meetingCategory === MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL) && (
            <MeetingSubCategoryField
              className="w-full min-w-0"
              value={formData.meetingSubCategory ?? ''}
              onChange={(v) => handleChange('meetingSubCategory', v)}
              error={errors.meetingSubCategory as string | undefined}
              touched={touched.meetingSubCategory}
            />
          )}

          {isFieldVisible('meetingReason') && (
            <MeetingReasonField
              value={formData.meetingReason ?? ''}
              onChange={(v) => handleChange('meetingReason', v)}
              onBlur={() => handleBlur('meetingReason')}
              error={errors.meetingReason}
              touched={touched.meetingReason}
              disabled={isFieldDisabled('meetingReason')}
              required={isRequired('meetingReason')}
            />
          )}

          {isFieldVisible('relatedTopic') && (
            <RelatedTopicField
              value={formData.relatedTopic ?? ''}
              onChange={(v) => handleChange('relatedTopic', v)}
              onBlur={() => handleBlur('relatedTopic')}
              error={errors.relatedTopic}
              touched={touched.relatedTopic}
              disabled={isFieldDisabled('relatedTopic')}
              required={isRequired('relatedTopic')}
            />
          )}

          {isFieldVisible('dueDate') && (
            <DueDateField
              className="w-full min-w-0"
              value={formData.dueDate ?? undefined}
              onChange={(v) => handleChange('dueDate', v)}
              onBlur={() => handleBlur('dueDate')}
              error={errors.dueDate}
              touched={touched.dueDate}
              disabled={isFieldDisabled('dueDate')}
              required={isRequired('dueDate')}
            />
          )}

          {formData.meetingCategory === MeetingClassification.BUSINESS && (
            <MeetingClassificationField
              className="w-full min-w-0"
              value={formData.meetingClassification1 ?? ''}
              onChange={(v) => handleChange('meetingClassification1', v)}
              error={errors.meetingClassification1}
              touched={touched.meetingClassification1}
              disabled={isFieldDisabled('meetingClassification1')}
              required={isRequired('meetingClassification1')}
            />
          )}

          <MeetingConfidentialityField
            className="w-full min-w-0"
            value={formData.meetingConfidentiality ?? ''}
            onChange={(v) => handleChange('meetingConfidentiality', v)}
            error={errors.meetingConfidentiality}
            touched={touched.meetingConfidentiality}
            disabled={isFieldDisabled('meetingConfidentiality')}
          />

          <div className='md:col-span-2 lg:col-span-3 w-full min-w-0'>
          <MeetingAgendaTable
            rows={(formData.meetingAgenda || []).map(a => ({ ...a, id: a.id ?? crypto.randomUUID() }))}
            required={false}
            onAddRow={handleAddAgendaWithScroll}
            onDeleteRow={handleDeleteAgenda}
            onUpdateRow={handleUpdateAgenda}
            errors={tableErrors}
            touched={tableTouched}
            errorMessage={errors.meetingAgenda}
            scrollToRowId={scrollToAgendaRowId}
            onScrolledToRow={() => setScrollToAgendaRowId(null)}
            meetingDurationMinutes={getMeetingDurationMinutes(
              formData.meetingStartDate,
              formData.meetingEndDate
            )}
            />
          </div>

          <NotesField
            className="sm:col-span-2 w-full min-w-0"
            value={formData.notes ?? ''}
            onChange={(v) => handleChange('notes', v)}
            disabled={isFieldDisabled('notes')}
          />

          <GuidanceField
            value={toOption(formData.relatedDirective)}
            onChange={handleDirectiveChange}
            error={errors.relatedDirective}
            touched={touched.relatedDirective}
            disabled={isFieldDisabled('relatedDirective')}
          />
        </div>

        <ActionButtons
          onCancel={handleCancelClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
}