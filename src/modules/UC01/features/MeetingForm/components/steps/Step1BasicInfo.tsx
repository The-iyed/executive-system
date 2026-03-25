import React, { useCallback, useState } from 'react';
import {
  FormField,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTextArea,
  FormSwitch,
  FormRow,
  ActionButtons,
  FormAsyncSelectV2,
  FileUpload,
  SECTOR_OPTIONS,
  MEETING_TYPE_OPTIONS,
  getMeetingCategoryOptions,
  MeetingSubCategoryField,
  MeetingClassification,
  MeetingAgendaTable,
} from '@/modules/shared';
import {
  MEETING_CLASSIFICATION_OPTIONS,
  MEETING_CHANNEL_OPTIONS,
  DIRECTIVE_METHOD_OPTIONS,
} from '../../utils/constants';
import { getUserDisplayId, getUserDisplayLabel } from '@/modules/shared/utils';
import { searchUsersByEmail, type UserApiResponse } from '../../../../data/usersApi';
import type { Step1BasicInfoFormData } from '../../schemas/step1BasicInfo.schema';
import { getMeetingDurationMinutes } from '../../schemas/step1BasicInfo.schema';
import type { Step1ErrorKey } from '../../hooks/useStep1BasicInfo';
import { MeetingDateFields } from '../MeetingDateFields/MeetingDateFields';
import { MeetingLocationField } from '../MeetingLocationField';

export interface Step1BasicInfoProps {
  formData: Partial<Step1BasicInfoFormData>;
  errors: Partial<Record<Step1ErrorKey, string>>;
  touched: Partial<Record<Step1ErrorKey, boolean>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step1BasicInfoFormData, value: any) => void;
  handleBlur: (field: Step1ErrorKey) => void;
  handleAddAgenda: () => string;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: any) => void;
  handleNextClick: () => void;
  handleCancelClick: () => void;  
  isStep1BasicInfoFieldRequired: (field: Step1ErrorKey) => boolean;
  step1EditableMap?: Record<string, boolean>;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
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
  handleNextClick,
  handleCancelClick,
  isStep1BasicInfoFieldRequired,
  step1EditableMap,
}) => {
  const [scrollToAgendaRowId, setScrollToAgendaRowId] = useState<string | null>(null);
  const isFieldDisabled = (fieldKey: string) =>
    step1EditableMap != null && step1EditableMap[fieldKey] === false;

  const handleAddAgendaWithScroll = useCallback(() => {
    const newRowId = handleAddAgenda();
    if (newRowId) setScrollToAgendaRowId(newRowId);
  }, [handleAddAgenda]);

  const loadMeetingManagerOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await searchUsersByEmail(search, skip, limit);

      const items = response?.items.map((user: UserApiResponse) => {
        const rec = user as Record<string, unknown>;
        const id = getUserDisplayId(rec) || user?.id || '';
        const label = getUserDisplayLabel(rec) || 'غير محدد';
        return { value: id, label };
      });

      return {
        items,
        total: response?.total,
        skip: response?.skip,
        limit: response?.limit,
        has_next: response?.has_next || false,
        has_previous: response?.has_previous || false,
      };
    } catch (error) {
      console.error('Error loading meeting managers:', error);
      throw error;
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
          <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData.is_on_behalf_of || false}
              onCheckedChange={(checked) => handleChange('is_on_behalf_of', checked)}
              label="هل تطلب الاجتماع نيابة عن غيرك؟"
              disabled={isFieldDisabled('is_on_behalf_of')}
            />
          </FormRow>
          {formData.is_on_behalf_of && (
            <FormRow className='sm:justify-end'>
              <FormField
                label="مالك الاجتماع"
                required={isStep1BasicInfoFieldRequired('meeting_manager_id')}
                error={touched.meeting_manager_id ? errors.meeting_manager_id : undefined}
              >
                <FormAsyncSelectV2
                  value={formData.meeting_manager_id ? { label: formData.meeting_manager_id, value: formData.meeting_manager_id } : null}
                  onValueChange={(option) => handleChange('meeting_manager_id', option?.value || '')}
                  loadOptions={loadMeetingManagerOptions}
                  placeholder="مالك الاجتماع"
                  error={!!(touched.meeting_manager_id && errors.meeting_manager_id)}
                  errorMessage={touched.meeting_manager_id ? errors.meeting_manager_id : undefined}
                  fullWidth
                  isDisabled={isFieldDisabled('meeting_manager_id')}
                />
              </FormField>
            </FormRow>
          )}
            <FormField
                className="w-full min-w-0"
              label="عنوان الاجتماع"
              required
              error={errors.meetingSubject ?? undefined}
            >
              <FormInput
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="عنوان الاجتماع"
                error={!!errors.meetingSubject}
                disabled={isFieldDisabled('meetingSubject')}
              />
            </FormField>
            <FormField
              className="w-full min-w-0"
              label="وصف الاجتماع"
              error={touched.meetingDescription ? errors.meetingDescription : undefined}
            >
              <FormInput
                value={formData.meetingDescription || ''}
                onChange={(e) => handleChange('meetingDescription', e.target.value)}
                onBlur={() => handleBlur('meetingDescription')}
                placeholder="وصف الاجتماع"
                error={!!(touched.meetingDescription && errors.meetingDescription)}
                disabled={isFieldDisabled('meetingDescription')}
              />
            </FormField>
            <FormField
                className="w-full min-w-0"
              label="القطاع"
              required={isStep1BasicInfoFieldRequired('sector')}
              error={touched.sector ? errors.sector : undefined}
            >
              <FormSelect
                value={formData.sector || ''}
                onValueChange={(value) => handleChange('sector', value)}
                options={SECTOR_OPTIONS}
                placeholder="القطاع"
                error={!!(touched.sector && errors.sector)}
                disabled={isFieldDisabled('sector')}
              />
            </FormField>
            <FormField
                className="w-full min-w-0"
              label="نوع الاجتماع"
              required
              error={touched.meetingType ? errors.meetingType : undefined}
            >
              <FormSelect
                value={formData.meetingType}
                onValueChange={(value) => handleChange('meetingType', value)}
                options={MEETING_TYPE_OPTIONS}
                placeholder="نوع الاجتماع"
                error={!!(touched.meetingType && errors.meetingType)}
                disabled={isFieldDisabled('meetingType')}
              />
            </FormField>
            <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData.is_urgent || false}
              onCheckedChange={(checked) => handleChange('is_urgent', checked)}
              label="اجتماع عاجل؟"
              disabled={isFieldDisabled('is_urgent')}
            />
          </FormRow>

          {formData.is_urgent && (
            <FormRow className='sm:justify-end'>
              <FormField
                label="السبب"
                required={isStep1BasicInfoFieldRequired('urgent_reason')}
                error={touched.urgent_reason ? errors.urgent_reason : undefined}
              >
                <FormInput
                  value={formData.urgent_reason || ''}
                  onChange={(e) => handleChange('urgent_reason', e.target.value)}
                  onBlur={() => handleBlur('urgent_reason')}
                  placeholder="السبب"
                  error={!!(touched.urgent_reason && errors.urgent_reason)}
                  disabled={isFieldDisabled('urgent_reason')}
                />
              </FormField>
            </FormRow>
          )}
            <MeetingDateFields
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              isFieldDisabled={isFieldDisabled}
            />
          <FormField
            className="w-full min-w-0"
            label="آلية انعقاد الاجتماع"
            error={touched.meetingChannel ? errors.meetingChannel : undefined}
          >
            <FormSelect
              value={formData.meetingChannel || ''}
              onValueChange={(value) => handleChange('meetingChannel', value)}
              options={MEETING_CHANNEL_OPTIONS}
              placeholder="حضوري / عن بعد"
              error={!!(touched.meetingChannel && errors.meetingChannel)}
              disabled={isFieldDisabled('meetingChannel')}
            />
          </FormField>
          {formData.meetingChannel === 'PHYSICAL' && (
            <MeetingLocationField
              formData={formData}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              isFieldDisabled={isFieldDisabled}
              isRequired={isStep1BasicInfoFieldRequired('meeting_location')}
            />
          )}
          <FormField
            className="w-full min-w-0"
            label="فئة الاجتماع"
            required
            error={touched.meetingCategory ? errors.meetingCategory : undefined}
          >
            <FormSelect
              value={formData.meetingCategory}
              onValueChange={(value) => handleChange('meetingCategory', value)}
              options={getMeetingCategoryOptions(formData.meetingType ?? '')}
              placeholder="فئة الاجتماع"
              error={!!(touched.meetingCategory && errors.meetingCategory)}
              disabled={isFieldDisabled('meetingCategory')}
            />
          </FormField>
          {(formData.meetingCategory === MeetingClassification.COUNCILS_AND_COMMITTEES_EXTERNAL ||
            formData.meetingCategory === MeetingClassification.COUNCILS_AND_COMMITTEES_INTERNAL) && (
            <MeetingSubCategoryField
              className="w-full min-w-0"
              value={formData.meetingSubCategory || ''}
              onChange={(value) => handleChange('meetingSubCategory', value)}
            />
          )}
 {/*فئة الاجتماع */}
          {isStep1BasicInfoFieldRequired('meetingReason') && (
            <FormField
              className="w-full min-w-0"
              label="مبرر اللقاء"
              required
              error={touched.meetingReason ? errors.meetingReason : undefined}
            >
              <FormInput
                value={formData.meetingReason || ''}
                onChange={(e) => handleChange('meetingReason', e.target.value)}
                onBlur={() => handleBlur('meetingReason')}
                placeholder="مبرر اللقاء"
                error={!!(touched.meetingReason && errors.meetingReason)}
                disabled={isFieldDisabled('meetingReason')}
              />
            </FormField>
          )}
          {isStep1BasicInfoFieldRequired('relatedTopic') && (
              <FormField
                className="w-full min-w-0"
                label="موضوع التكليف المرتبط"
                required
                error={touched.relatedTopic ? errors.relatedTopic : undefined}
              >
                <FormInput
                  value={formData.relatedTopic || ''}
                  onChange={(e) => handleChange('relatedTopic', e.target.value)}
                  onBlur={() => handleBlur('relatedTopic')}
                  placeholder="موضوع التكليف المرتبط"
                  error={!!(touched.relatedTopic && errors.relatedTopic)}
                  disabled={isFieldDisabled('relatedTopic')}
                />
              </FormField>
          )}
          {isStep1BasicInfoFieldRequired('dueDate') && (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return (
              <FormField
                className="w-full min-w-0"
                label="تاريخ الاستحقاق"
                required
                error={touched.dueDate ? errors.dueDate : undefined}
              >
                <FormDatePicker
                  value={formData.dueDate}
                  onChange={(value) => handleChange('dueDate', value)}
                  onBlur={() => handleBlur('dueDate')}
                  placeholder="dd/mm/yyyy"
                  error={!!(touched.dueDate && errors.dueDate)}
                  disabled={isFieldDisabled('dueDate')}
                  fromDate={today}
                />
              </FormField>
            );
          })()}
          {formData.meetingCategory === MeetingClassification.BUSINESS && (
            <FormField
              className="w-full min-w-0"
              label="تصنيف الاجتماع"
              required={isStep1BasicInfoFieldRequired('meetingClassification1')}
              error={touched.meetingClassification1 ? errors.meetingClassification1 : undefined}
            >
              <FormSelect
                value={formData.meetingClassification1}
                onValueChange={(value) => handleChange('meetingClassification1', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingClassification1 && errors.meetingClassification1)}
                disabled={isFieldDisabled('meetingClassification1')}
              />
            </FormField>
          )}
          <FormRow className="sm:justify-end">
            <FormSwitch
              checked={formData.meetingConfidentiality === 'CONFIDENTIAL'}
              onCheckedChange={(checked) => handleChange('meetingConfidentiality', checked ? 'CONFIDENTIAL' : 'NORMAL')}
              label="اجتماع سرّي؟"
              disabled={isFieldDisabled('meetingConfidentiality')}
            />
          </FormRow>
        </div>

          <MeetingAgendaTable
            rows={(formData.meetingAgenda || []).map(a => ({ ...a, id: a.id ?? crypto.randomUUID() }))}
            required={isStep1BasicInfoFieldRequired('meetingAgenda')}
            onAddRow={handleAddAgendaWithScroll}
            onDeleteRow={handleDeleteAgenda}
            onUpdateRow={handleUpdateAgenda}
            errors={tableErrors}
            touched={tableTouched}
            errorMessage={errors?.meetingAgenda}
            disabled={isFieldDisabled('meetingAgenda')}
            scrollToRowId={scrollToAgendaRowId}
            onScrolledToRow={() => setScrollToAgendaRowId(null)}
            meetingDurationMinutes={getMeetingDurationMinutes(
              formData.meeting_start_date,
              formData.meeting_end_date
            )}
          />

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
        <FormRow className='sm:justify-end'>
          <FormSwitch
            checked={formData.is_based_on_directive || false}
            onCheckedChange={(checked) => handleChange('is_based_on_directive', checked)}
            label="هل طلب الاجتماع بناءً على توجيه من معالي الوزير"
            disabled={isFieldDisabled('is_based_on_directive')}
          />
        </FormRow>
        {formData.is_based_on_directive && (
          <>
            <FormRow className='sm:justify-end'>
              <FormField
                label="طريقة التوجيه"
                required={isStep1BasicInfoFieldRequired('directive_method')}
                error={touched.directive_method ? errors.directive_method : undefined}
              >
                <FormSelect
                  value={formData.directive_method}
                  onValueChange={(value) => handleChange('directive_method', value)}
                  options={DIRECTIVE_METHOD_OPTIONS}
                  placeholder="طريقة التوجيه"
                  error={!!(touched.directive_method && errors.directive_method)}
                  disabled={isFieldDisabled('directive_method')}
                />
              </FormField>
            </FormRow>
            {formData.directive_method === 'PREVIOUS_MEETING' && (
                  <FileUpload
                    file={formData.previous_meeting_minutes_file ?? undefined}
                    onFileSelect={(file) => handleChange('previous_meeting_minutes_file', file ?? null)}
                    required={isStep1BasicInfoFieldRequired('previous_meeting_minutes_file')}
                    label="محضر الاجتماع"
                    acceptedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']}
                    acceptedExtensions={['.pdf', '.doc', '.docx', '.xls', '.xlsx']}
                    error={errors.previous_meeting_minutes_file}
                    dropzoneClassName="p-3 min-h-[170px]  max-w-[1200px] max-h-[160px]"
                    disabled={isFieldDisabled('previous_meeting_minutes_file')}
                  />
            )}
            {formData.directive_method === 'DIRECT_DIRECTIVE' && (
              <FormRow className='sm:justify-end'>
                <FormField
                  label="التوجيه"
                  required={isStep1BasicInfoFieldRequired('directive_text')}
                  error={touched.directive_text ? errors.directive_text : undefined}
                >
                  <FormInput
                    value={formData.directive_text || ''}
                    onChange={(e) => handleChange('directive_text', e.target.value)}
                    onBlur={() => handleBlur('directive_text')}
                    placeholder="التوجيه"
                    error={!!(touched.directive_text && errors.directive_text)}
                    disabled={isFieldDisabled('directive_text')}
                  />
                </FormField>
              </FormRow>
            )}
          </>
        )}
 </div>
        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
          error={errors?.notes}
          disabled={isFieldDisabled('notes')}
        />

        <ActionButtons
          onCancel={handleCancelClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
};