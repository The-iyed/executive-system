import { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ActionButtons } from '@shared';
import type { OptionType } from '@shared';
import { getMeetingById, type MeetingApiResponse } from '../../../../../data';
import type { Step1FormData } from '../../../schemas/step1.schema';
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
  MeetingDateTimeField,
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

export interface Step1Props {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  fillFormFromPreviousMeeting?: (meeting: MeetingApiResponse) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  isFieldRequired: (field: keyof Step1FormData) => boolean;
}

export function Step1({
  formData,
  errors,
  touched,
  isSubmitting,
  isDeleting,
  handleChange,
  handleBlur,
  fillFormFromPreviousMeeting,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  isFieldRequired,
}: Step1Props) {
  const location = useLocation();
  const {
    isPreviousMeetingVisible,
    isPreviousMeetingRequired,
    isFieldDisabled,
  } = useStep1BusinessRules(formData);

  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full space-y-0">
          <MeetingNatureField
            value={formData.meetingNature ?? ''}
            onChange={(v) => handleChange('meetingNature', v)}
            onBlur={() => handleBlur('meetingNature')}
            error={errors.meetingNature}
            touched={touched.meetingNature}
            disabled={isFieldDisabled('meetingNature')}
            required
          />

          {isPreviousMeetingVisible && (
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
              required={isPreviousMeetingRequired}
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
            required={isFieldRequired('requester')}
          />

          <MeetingOwnerField
            value={toOption(formData.meetingOwner)}
            onChange={(v) => handleChange('meetingOwner', v)}
            error={errors.meetingOwner as string | undefined}
            touched={touched.meetingOwner}
            disabled={isFieldDisabled('meetingOwner')}
            required={isFieldRequired('meetingOwner')}
          />

          <MeetingTitleField
            value={formData.meetingTitle ?? ''}
            onChange={(v) => handleChange('meetingTitle', v)}
            onBlur={() => handleBlur('meetingTitle')}
            error={errors.meetingTitle}
            touched={touched.meetingTitle}
            disabled={isFieldDisabled('meetingTitle')}
            required={isFieldRequired('meetingTitle')}
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
            required={isFieldRequired('sector')}
          />

          <MeetingTypeField
            className="w-full min-w-0"
            value={formData.meetingType ?? ''}
            onChange={(v) => handleChange('meetingType', v)}
            error={errors.meetingType}
            touched={touched.meetingType}
            disabled={isFieldDisabled('meetingType')}
            required={isFieldRequired('meetingType')}
          />

          <UrgentMeetingField
            className="w-full min-w-0 sm:col-span-2"
            value={formData.isUrgent ?? false}
            onChange={(v) => handleChange('isUrgent', v)}
            error={errors.isUrgent}
            touched={touched.isUrgent}
            disabled={isFieldDisabled('isUrgent')}
          />

          {formData.isUrgent && (
            <UrgentReasonField
              className="sm:col-span-2 w-full min-w-0"
              value={formData.urgentReason ?? ''}
              onChange={(v) => handleChange('urgentReason', v)}
              onBlur={() => handleBlur('urgentReason')}
              error={errors.urgentReason}
              touched={touched.urgentReason}
              disabled={isFieldDisabled('urgentReason')}
            />
          )}

          <MeetingDateTimeField
            className="sm:col-span-2 w-full min-w-0"
            startValue={formData.meetingStartDate ?? ''}
            endValue={formData.meetingEndDate ?? ''}
            onStartChange={(v) => handleChange('meetingStartDate', v)}
            onEndChange={(v) => handleChange('meetingEndDate', v)}
            onStartBlur={() => handleBlur('meetingStartDate')}
            onEndBlur={() => handleBlur('meetingEndDate')}
            minStartDate={minStartDate}
            required
            disabled={isFieldDisabled('meetingStartDate')}
            startError={touched.meetingStartDate ? errors.meetingStartDate : undefined}
            endError={touched.meetingEndDate ? errors.meetingEndDate : undefined}
            startTouched={touched.meetingStartDate}
            endTouched={touched.meetingEndDate}
          />

          <MeetingChannelField
            className="w-full min-w-0"
            value={formData.meeting_channel ?? ''}
            onChange={(v) => handleChange('meeting_channel', v)}
            error={errors.meeting_channel}
            touched={touched.meeting_channel}
            disabled={isFieldDisabled('meeting_channel')}
            required={isFieldRequired('meeting_channel')}
          />

          {formData.meeting_channel === 'PHYSICAL' && (
            <LocationField
              className="w-full min-w-0"
              value={formData.location ?? ''}
              onChange={(v) => handleChange('location', v)}
              onBlur={() => handleBlur('location')}
              error={errors.location}
              touched={touched.location}
              disabled={isFieldDisabled('location')}
              required={isFieldRequired('location')}
            />
          )}

          <RequiresProtocolField
            className="w-full min-w-0 sm:col-span-2"
            value={formData.requiresProtocol ?? false}
            onChange={(v) => handleChange('requiresProtocol', v)}
            error={errors.requiresProtocol}
            touched={touched.requiresProtocol}
            disabled={isFieldDisabled('requiresProtocol')}
          />

          <MeetingCategoryField
            className="w-full min-w-0"
            value={formData.meetingCategory ?? ''}
            onChange={(v) => handleChange('meetingCategory', v)}
            error={errors.meetingCategory}
            touched={touched.meetingCategory}
            disabled={isFieldDisabled('meetingCategory')}
            required={isFieldRequired('meetingCategory')}
          />

          <MeetingReasonField
            className="sm:col-span-2 w-full min-w-0"
            value={formData.meetingReason ?? ''}
            onChange={(v) => handleChange('meetingReason', v)}
            onBlur={() => handleBlur('meetingReason')}
            error={errors.meetingReason}
            touched={touched.meetingReason}
            disabled={isFieldDisabled('meetingReason')}
          />

          <RelatedTopicField
            className="sm:col-span-2 w-full min-w-0"
            value={formData.relatedTopic ?? ''}
            onChange={(v) => handleChange('relatedTopic', v)}
            onBlur={() => handleBlur('relatedTopic')}
            error={errors.relatedTopic}
            touched={touched.relatedTopic}
            disabled={isFieldDisabled('relatedTopic')}
          />

          <DueDateField
            className="w-full min-w-0"
            value={formData.dueDate ?? undefined}
            onChange={(v) => handleChange('dueDate', v)}
            onBlur={() => handleBlur('dueDate')}
            error={errors.dueDate}
            touched={touched.dueDate}
            disabled={isFieldDisabled('dueDate')}
          />

          <MeetingClassificationField
            className="w-full min-w-0"
            value={formData.meetingClassification1 ?? ''}
            onChange={(v) => handleChange('meetingClassification1', v)}
            error={errors.meetingClassification1}
            touched={touched.meetingClassification1}
            disabled={isFieldDisabled('meetingClassification1')}
            required={isFieldRequired('meetingClassification1')}
          />

          <MeetingConfidentialityField
            className="w-full min-w-0"
            value={formData.meetingConfidentiality ?? ''}
            onChange={(v) => handleChange('meetingConfidentiality', v)}
            error={errors.meetingConfidentiality}
            touched={touched.meetingConfidentiality}
            disabled={isFieldDisabled('meetingConfidentiality')}
          />

          <NotesField
            className="sm:col-span-2 w-full min-w-0"
            value={formData.notes ?? ''}
            onChange={(v) => handleChange('notes', v)}
            disabled={isFieldDisabled('notes')}
          />

          <GuidanceField
            className="sm:col-span-2 w-full min-w-0"
            value={toOption(formData.relatedDirective)}
            onChange={handleDirectiveChange}
            error={errors.relatedDirective}
            touched={touched.relatedDirective}
            disabled={isFieldDisabled('relatedDirective')}
          />
        </div>

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
