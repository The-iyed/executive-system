import React, { useCallback, useMemo } from 'react';
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextArea,
  FormDatePicker,
  FormSwitch,
  MeetingDateTimeRangePicker,
} from '@shared';
import type { OptionType } from '@shared';
import type { Step1FormData } from '../../../schemas/step1.schema';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  SECTOR_OPTIONS,
  MEETING_CHANNEL_OPTIONS,
} from '../../../constants/step1.constants';
import {
  MeetingNatureField,
  PreviousMeetingField,
  ApplicantField,
  MeetingOwnerField,
  GuidanceField,
} from './fields';

export interface MeetingInfoTabProps {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  isFieldRequired: (field: keyof Step1FormData) => boolean;
  isFieldDisabled: (field: keyof Step1FormData) => boolean;
  isPreviousMeetingVisible: boolean;
  isPreviousMeetingRequired: boolean;
  loadDirectivesOptions: (
    search: string,
    skip: number,
    limit: number
  ) => Promise<{
    items: Array<OptionType & { description?: string }>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  loadUsersOptions: (
    search: string,
    skip: number,
    limit: number
  ) => Promise<{
    items: Array<OptionType>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  loadMeetingOwnerOptions?: (
    search: string,
    skip: number,
    limit: number
  ) => Promise<{
    items: Array<OptionType>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  loadPreviousMeetingsOptions?: (
    search: string,
    skip: number,
    limit: number
  ) => Promise<{
    items: Array<OptionType>;
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  }>;
  onPreviousMeetingSelect?: (option: OptionType | null) => void;
  onDirectiveChange?: (value: OptionType | null) => void;
}

/**
 * Meeting Information tab. Field order per spec.
 * When Nature = Follow-up or Recurring, only this tab is editable; Guidance does NOT auto-populate.
 */
export function MeetingInfoTab({
  formData,
  errors,
  touched,
  handleChange,
  handleBlur,
  isFieldRequired,
  isFieldDisabled,
  isPreviousMeetingVisible,
  isPreviousMeetingRequired,
  loadDirectivesOptions,
  loadUsersOptions,
  loadMeetingOwnerOptions = loadUsersOptions,
  loadPreviousMeetingsOptions,
  onPreviousMeetingSelect,
  onDirectiveChange,
}: MeetingInfoTabProps) {
  const handleDirectiveChange = useCallback(
    (value: OptionType | null) => {
      if (onDirectiveChange) {
        onDirectiveChange(value);
        return;
      }
      handleChange('relatedDirective', value);
      handleChange('previousMeeting', value?.description ?? '');
    },
    [handleChange, onDirectiveChange]
  );

  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full space-y-0">
      {/* 1. Nature of Meeting (طبيعة الاجتماع) - Required */}
      <MeetingNatureField
        className="w-full min-w-0"
        value={formData.meetingNature ?? ''}
        onChange={(v) => handleChange('meetingNature', v)}
        onBlur={() => handleBlur('meetingNature')}
        error={errors.meetingNature}
        touched={touched.meetingNature}
        disabled={isFieldDisabled('meetingNature')}
        required
      />

      {/* 2. Previous Meeting (الاجتماع السابق) - Hidden when Normal, Required when Follow-up/Recurring; searchable select, fills form from meeting detail */}
      {isPreviousMeetingVisible && (
        <PreviousMeetingField
          className="w-full min-w-0"
          value={
            formData.previousMeeting
              ? typeof formData.previousMeeting === 'object'
                ? formData.previousMeeting
                : { value: formData.previousMeeting, label: formData.previousMeeting }
              : null
          }
          onChange={(v) => {
            if (onPreviousMeetingSelect) {
              onPreviousMeetingSelect(v);
            } else {
              if (typeof v === 'object' && v !== null) {
                handleChange('previousMeeting', v.value);
              } else {
                handleChange('previousMeeting', v ?? '');
              }
            }
          }}
          loadOptions={loadPreviousMeetingsOptions ?? loadDirectivesOptions}
          visible={true}
          required={isPreviousMeetingRequired}
          readOnly={false}
          error={errors.previousMeeting}
          touched={touched.previousMeeting}
          disabled={isFieldDisabled('previousMeeting')}
        />
      )}

      {/* 3. Applicant (مقدّم الطلب) - Required */}
      <ApplicantField
        className="w-full min-w-0"
        value={formData.requester ?? null}
        onChange={(v) => handleChange('requester', v)}
        loadOptions={loadUsersOptions}
        error={errors.requester}
        touched={touched.requester}
        disabled={isFieldDisabled('requester')}
        required={isFieldRequired('requester')}
      />

      {/* 4. Meeting Owner (مالك الاجتماع) - Required */}
      <MeetingOwnerField
        className="w-full min-w-0"
        value={formData.meetingOwner ?? null}
        onChange={(v) => handleChange('meetingOwner', v)}
        loadOptions={loadMeetingOwnerOptions}
        error={errors.meetingOwner as string | undefined}
        touched={touched.meetingOwner}
        disabled={isFieldDisabled('meetingOwner')}
        required={isFieldRequired('meetingOwner')}
      />

      {/* 5. Meeting Title (عنوان الاجتماع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="عنوان الاجتماع"
        required={isFieldRequired('meetingTitle')}
        error={touched.meetingTitle ? errors.meetingTitle : undefined}
      >
        <FormInput
          value={formData.meetingTitle ?? ''}
          onChange={(e) => handleChange('meetingTitle', e.target.value)}
          onBlur={() => handleBlur('meetingTitle')}
          placeholder="عنوان الاجتماع"
          error={!!(touched.meetingTitle && errors.meetingTitle)}
          disabled={isFieldDisabled('meetingTitle')}
        />
      </FormField>

      {/* 6. Meeting Description (وصف الاجتماع) - Optional */}
      <FormField
        className="sm:col-span-2 w-full min-w-0"
        label="وصف الاجتماع"
        error={touched.meetingDescription ? errors.meetingDescription : undefined}
      >
        <FormInput
          value={formData.meetingDescription ?? ''}
          onChange={(e) => handleChange('meetingDescription', e.target.value)}
          onBlur={() => handleBlur('meetingDescription')}
          placeholder="وصف الاجتماع"
          error={!!(touched.meetingDescription && errors.meetingDescription)}
          disabled={isFieldDisabled('meetingDescription')}
        />
      </FormField>

      {/* 7. Sector (القطاع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="القطاع"
        required={isFieldRequired('sector')}
        error={touched.sector ? errors.sector : undefined}
      >
        <FormSelect
          value={formData.sector ?? ''}
          onValueChange={(v) => handleChange('sector', v)}
          options={SECTOR_OPTIONS}
          placeholder="القطاع"
          error={!!(touched.sector && errors.sector)}
          disabled={isFieldDisabled('sector')}
        />
      </FormField>

      {/* 8. Meeting Type (نوع الاجتماع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="نوع الاجتماع"
        required={isFieldRequired('meetingType')}
        error={touched.meetingType ? errors.meetingType : undefined}
      >
        <FormSelect
          value={formData.meetingType ?? ''}
          onValueChange={(v) => handleChange('meetingType', v)}
          options={MEETING_TYPE_OPTIONS}
          placeholder="نوع الاجتماع"
          error={!!(touched.meetingType && errors.meetingType)}
          disabled={isFieldDisabled('meetingType')}
        />
      </FormField>

      {/* 9. Urgent Meeting? (اجتماع عاجل؟) - Optional */}
      <FormField
        label="اجتماع عاجل؟"
        error={touched.isUrgent ? errors.isUrgent : undefined}
        className="w-full min-w-0 sm:col-span-2"
      >
        <FormSwitch
          checked={formData.isUrgent ?? false}
          onCheckedChange={(checked) => handleChange('isUrgent', checked)}
          disabled={isFieldDisabled('isUrgent')}
        />
      </FormField>

      {/* 10. Reason (السبب) - Optional, when urgent */}
      {formData.isUrgent && (
        <div className="sm:col-span-2 w-full min-w-0">
          <FormTextArea
            value={formData.urgentReason ?? ''}
            onChange={(e) => handleChange('urgentReason', e.target.value)}
            onBlur={() => handleBlur('urgentReason')}
            error={touched.urgentReason && errors.urgentReason ? errors.urgentReason : undefined}
            label="السبب"
            placeholder="السبب..."
            disabled={isFieldDisabled('urgentReason')}
          />
        </div>
      )}

      {/* 11. Meeting Date & Time (موعد الاجتماع) - Required */}
      <div className="sm:col-span-2 w-full min-w-0">
        <MeetingDateTimeRangePicker
          sectionTitle="موعد الاجتماع"
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
      </div>

      {/* 12. Meeting Mode (آلية انعقاد الاجتماع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="آلية انعقاد الاجتماع"
        required={isFieldRequired('meeting_channel')}
        error={touched.meeting_channel ? errors.meeting_channel : undefined}
      >
        <FormSelect
          value={formData.meeting_channel ?? ''}
          onValueChange={(v) => handleChange('meeting_channel', v)}
          options={MEETING_CHANNEL_OPTIONS}
          placeholder="حضوري / افتراضي / مختلط"
          error={!!(touched.meeting_channel && errors.meeting_channel)}
          disabled={isFieldDisabled('meeting_channel')}
        />
      </FormField>

      {/* 13. Location (الموقع) - Required only when Meeting Mode = In-person */}
      {formData.meeting_channel === 'PHYSICAL' && (
        <FormField
          className="w-full min-w-0"
          label="الموقع"
          required={isFieldRequired('location')}
          error={touched.location ? errors.location : undefined}
        >
          <FormInput
            value={formData.location ?? ''}
            onChange={(e) => handleChange('location', e.target.value)}
            onBlur={() => handleBlur('location')}
            placeholder="الموقع"
            error={!!(touched.location && errors.location)}
            disabled={isFieldDisabled('location')}
          />
        </FormField>
      )}

      {/* 14. Requires Protocol? (هل يتطلب بروتوكول؟) - Required */}
      <FormField
        label="هل يتطلب بروتوكول؟"
        error={touched.requiresProtocol ? errors.requiresProtocol : undefined}
        className="w-full min-w-0 sm:col-span-2"
      >
        <FormSwitch
          checked={formData.requiresProtocol ?? false}
          onCheckedChange={(checked) => handleChange('requiresProtocol', checked)}
          disabled={isFieldDisabled('requiresProtocol')}
        />
      </FormField>

      {/* 15. Meeting Category (فئة الاجتماع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="فئة الاجتماع"
        required={isFieldRequired('meetingCategory')}
        error={touched.meetingCategory ? errors.meetingCategory : undefined}
      >
        <FormSelect
          value={formData.meetingCategory ?? ''}
          onValueChange={(v) => handleChange('meetingCategory', v)}
          options={MEETING_CATEGORY_OPTIONS}
          placeholder="فئة الاجتماع"
          error={!!(touched.meetingCategory && errors.meetingCategory)}
          disabled={isFieldDisabled('meetingCategory')}
        />
      </FormField>

      {/* 16. Meeting Justification (مبرّر اللقاء) - Optional */}
      <div className="sm:col-span-2 w-full min-w-0">
        <FormTextArea
          value={formData.meetingReason ?? ''}
          onChange={(e) => handleChange('meetingReason', e.target.value)}
          onBlur={() => handleBlur('meetingReason')}
          error={touched.meetingReason && errors.meetingReason ? errors.meetingReason : undefined}
          label="مبرّر اللقاء"
          placeholder="مبرّر اللقاء..."
          disabled={isFieldDisabled('meetingReason')}
        />
      </div>

      {/* 17. Related Assignment Topic (موضوع التكليف المرتبط) - Optional */}
      <FormField
        className="sm:col-span-2 w-full min-w-0"
        label="موضوع التكليف المرتبط"
        error={touched.relatedTopic ? errors.relatedTopic : undefined}
      >
        <FormInput
          value={formData.relatedTopic ?? ''}
          onChange={(e) => handleChange('relatedTopic', e.target.value)}
          onBlur={() => handleBlur('relatedTopic')}
          placeholder="موضوع التكليف المرتبط"
          error={!!(touched.relatedTopic && errors.relatedTopic)}
          disabled={isFieldDisabled('relatedTopic')}
        />
      </FormField>

      {/* 18. Due Date (تاريخ الاستحقاق) - Optional */}
      <FormField
        className="w-full min-w-0"
        label="تاريخ الاستحقاق"
        error={touched.dueDate ? errors.dueDate : undefined}
      >
        <FormDatePicker
          value={formData.dueDate ?? undefined}
          onChange={(v) => handleChange('dueDate', v ?? '')}
          onBlur={() => handleBlur('dueDate')}
          placeholder="dd/mm/yyyy"
          error={!!(touched.dueDate && errors.dueDate)}
          disabled={isFieldDisabled('dueDate')}
        />
      </FormField>

      {/* 19. Meeting Classification (تصنيف الاجتماع) - Required */}
      <FormField
        className="w-full min-w-0"
        label="تصنيف الاجتماع"
        required={isFieldRequired('meetingClassification1')}
        error={touched.meetingClassification1 ? errors.meetingClassification1 : undefined}
      >
        <FormSelect
          value={formData.meetingClassification1 ?? ''}
          onValueChange={(v) => handleChange('meetingClassification1', v)}
          options={MEETING_CLASSIFICATION_OPTIONS}
          placeholder="تصنيف الاجتماع"
          error={!!(touched.meetingClassification1 && errors.meetingClassification1)}
          disabled={isFieldDisabled('meetingClassification1')}
        />
      </FormField>

      {/* 20. Meeting Confidentiality (سريّة الاجتماع) - Optional */}
      <FormField
        className="w-full min-w-0"
        label="سريّة الاجتماع"
        error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
      >
        <FormSelect
          value={formData.meetingConfidentiality ?? ''}
          onValueChange={(v) => handleChange('meetingConfidentiality', v)}
          options={CONFIDENTIALITY_OPTIONS}
          placeholder="سريّة الاجتماع"
          error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
          disabled={isFieldDisabled('meetingConfidentiality')}
        />
      </FormField>

      {/* Notes (ملاحظات) - Optional */}
      <div className="sm:col-span-2 w-full min-w-0">
        <FormTextArea
          label="ملاحظات"
          value={formData.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
          disabled={isFieldDisabled('notes')}
        />
      </div>

      {/* Guidance (التوجيه) - Optional, last; do NOT auto-populate when Follow-up/Recurring */}
      <div className="sm:col-span-2 w-full min-w-0">
        <GuidanceField
          className="w-full min-w-0"
          value={formData.relatedDirective ?? null}
          onChange={(v) => handleDirectiveChange(v)}
          loadOptions={loadDirectivesOptions}
          error={errors.relatedDirective}
          touched={touched.relatedDirective}
          disabled={isFieldDisabled('relatedDirective')}
        />
      </div>
    </div>
  );
}
