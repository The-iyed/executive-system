import React, { useCallback } from 'react';
import {
  FormField,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTable,
  FormTextArea,
  FormSwitch,
  FormRow,
  ActionButtons,
  FormAsyncSelectV2,
  FileUpload,
} from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_CHANNEL_OPTIONS,
  MEETING_AGENDA_COLUMNS,
  DIRECTIVE_METHOD_OPTIONS,
} from '../../utils/constants';
import { getUsers, type UserApiResponse } from '../../../../data/usersApi';
import type { Step1BasicInfoFormData } from '../../schemas/step1BasicInfo.schema';
import type { Step1ErrorKey } from '../../hooks/useStep1BasicInfo';

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
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: any) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
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
  handleSaveDraftClick,
  handleCancelClick,
  isStep1BasicInfoFieldRequired,
  step1EditableMap,
}) => {
  const isFieldDisabled = (fieldKey: string) =>
    step1EditableMap != null && step1EditableMap[fieldKey] === false;
  // Load users options for meeting manager
  const loadMeetingManagerOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });

      const items = response?.items.map((user: UserApiResponse) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') 
          || user?.username 
          || user?.email 
          || 'غير محدد';
        
        return {
          label: fullName,
          value: user?.id || '',
        };
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
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
                  placeholder="-------"
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
              error={touched.meetingSubject ? errors.meetingSubject : undefined}
            >
              <FormInput
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="-------"
                error={!!(touched.meetingSubject && errors.meetingSubject)}
                disabled={isFieldDisabled('meetingSubject')}
              />
            </FormField>
            {/* وصف الاجتماع - optional, payload field: meeting_description */}
            <FormField
              className="w-full min-w-0"
              label="وصف الاجتماع"
              error={touched.meetingDescription ? errors.meetingDescription : undefined}
            >
              <FormInput
                value={formData.meetingDescription || ''}
                onChange={(e) => handleChange('meetingDescription', e.target.value)}
                onBlur={() => handleBlur('meetingDescription')}
                placeholder="-------"
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
              <FormInput
                value={formData.sector || ''}
                onChange={(e) => handleChange('sector', e.target.value)}
                onBlur={() => handleBlur('sector')}
                placeholder="-------"
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
                placeholder="-------"
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
                  placeholder="-------"
                  error={!!(touched.urgent_reason && errors.urgent_reason)}
                  disabled={isFieldDisabled('urgent_reason')}
                />
              </FormField>
            </FormRow>
          )}
          {isStep1BasicInfoFieldRequired('meeting_start_date') && (() => {
              const now = new Date();
              const oneWeekFromNow = new Date(now);
              oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
              const mainEndMin =
                formData.meeting_start_date && !Number.isNaN(new Date(formData.meeting_start_date).getTime())
                  ? new Date(formData.meeting_start_date)
                  : oneWeekFromNow;
              const alt1EndMin =
                formData.alternative_1_start_date && !Number.isNaN(new Date(formData.alternative_1_start_date).getTime())
                  ? new Date(formData.alternative_1_start_date)
                  : oneWeekFromNow;
              const alt2EndMin =
                formData.alternative_2_start_date && !Number.isNaN(new Date(formData.alternative_2_start_date).getTime())
                  ? new Date(formData.alternative_2_start_date)
                  : oneWeekFromNow;
              return (
                <>
                  {/* موعد الاجتماع */}
                  <div className="w-full min-w-0 sm:col-span-2 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">موعد الاجتماع</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ البداية"
                        required
                        error={touched.meeting_start_date ? errors.meeting_start_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.meeting_start_date || ''}
                          onChange={(value) => handleChange('meeting_start_date', value)}
                          onBlur={() => handleBlur('meeting_start_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.meeting_start_date && errors.meeting_start_date)}
                          disabled={isFieldDisabled('meeting_start_date')}
                          fromDate={oneWeekFromNow}
                        />
                      </FormField>
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ النهاية"
                        required
                        error={touched.meeting_end_date ? errors.meeting_end_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.meeting_end_date || ''}
                          onChange={(value) => handleChange('meeting_end_date', value)}
                          onBlur={() => handleBlur('meeting_end_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.meeting_end_date && errors.meeting_end_date)}
                          disabled={isFieldDisabled('meeting_end_date')}
                          fromDate={mainEndMin}
                        />
                      </FormField>
                    </div>
                  </div>
                  {/* الموعد البديل الأول */}
                  <div className="w-full min-w-0 sm:col-span-2 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">الموعد البديل الأول (اختياري)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ البداية"
                        error={touched.alternative_1_start_date ? errors.alternative_1_start_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.alternative_1_start_date || ''}
                          onChange={(value) => handleChange('alternative_1_start_date', value)}
                          onBlur={() => handleBlur('alternative_1_start_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.alternative_1_start_date && errors.alternative_1_start_date)}
                          disabled={isFieldDisabled('alternative_1_start_date')}
                          fromDate={oneWeekFromNow}
                        />
                      </FormField>
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ النهاية"
                        error={touched.alternative_1_end_date ? errors.alternative_1_end_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.alternative_1_end_date || ''}
                          onChange={(value) => handleChange('alternative_1_end_date', value)}
                          onBlur={() => handleBlur('alternative_1_end_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.alternative_1_end_date && errors.alternative_1_end_date)}
                          disabled={isFieldDisabled('alternative_1_end_date')}
                          fromDate={alt1EndMin}
                        />
                      </FormField>
                    </div>
                  </div>
                  {/* الموعد البديل الثاني */}
                  <div className="w-full min-w-0 sm:col-span-2 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">الموعد البديل الثاني (اختياري)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ البداية"
                        error={touched.alternative_2_start_date ? errors.alternative_2_start_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.alternative_2_start_date || ''}
                          onChange={(value) => handleChange('alternative_2_start_date', value)}
                          onBlur={() => handleBlur('alternative_2_start_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.alternative_2_start_date && errors.alternative_2_start_date)}
                          disabled={isFieldDisabled('alternative_2_start_date')}
                          fromDate={oneWeekFromNow}
                        />
                      </FormField>
                      <FormField
                        className="w-full min-w-0"
                        label="تاريخ النهاية"
                        error={touched.alternative_2_end_date ? errors.alternative_2_end_date : undefined}
                      >
                        <FormDatePicker
                          value={formData.alternative_2_end_date || ''}
                          onChange={(value) => handleChange('alternative_2_end_date', value)}
                          onBlur={() => handleBlur('alternative_2_end_date')}
                          placeholder="dd/mm/yyyy"
                          error={!!(touched.alternative_2_end_date && errors.alternative_2_end_date)}
                          disabled={isFieldDisabled('alternative_2_end_date')}
                          fromDate={alt2EndMin}
                        />
                      </FormField>
                    </div>
                  </div>
                </>
              );
          })()}
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
          <FormField
                className="w-full min-w-0"
              label="فئة الاجتماع"
              required
              error={touched.meetingCategory ? errors.meetingCategory : undefined}
            >
              <FormSelect
                value={formData.meetingCategory}
                onValueChange={(value) => handleChange('meetingCategory', value)}
                options={MEETING_CATEGORY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingCategory && errors.meetingCategory)}
                disabled={isFieldDisabled('meetingCategory')}
              />
          </FormField>
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
                placeholder="-------"
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
                  placeholder="-------"
                  error={!!(touched.relatedTopic && errors.relatedTopic)}
                  disabled={isFieldDisabled('relatedTopic')}
                />
              </FormField>
          )}
          {isStep1BasicInfoFieldRequired('dueDate') && (
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
              />
            </FormField>
          )}
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
          <FormField
              className="w-full min-w-0"
            label="سرية الاجتماع"
            required
            error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
          >
            <FormSelect
              value={formData.meetingConfidentiality}
              onValueChange={(value) => handleChange('meetingConfidentiality', value)}
              options={CONFIDENTIALITY_OPTIONS}
              placeholder="سرية الاجتماع"
              error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              disabled={isFieldDisabled('meetingConfidentiality')}
            />
          </FormField>
        </div>

          <FormTable
          title="أجندة الاجتماع"
          required={isStep1BasicInfoFieldRequired('meetingAgenda')}
          columns={MEETING_AGENDA_COLUMNS}
          rows={formData.meetingAgenda || []}
          onAddRow={handleAddAgenda}
          onDeleteRow={handleDeleteAgenda}
          onUpdateRow={handleUpdateAgenda}
          addButtonLabel="إضافة أجندة"
          errors={tableErrors}
          touched={tableTouched}
          errorMessage={errors?.meetingAgenda}
          disabled={isFieldDisabled('meetingAgenda')}
        />
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
                  placeholder="-------"
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
                    placeholder="-------"
                    error={!!(touched.directive_text && errors.directive_text)}
                    disabled={isFieldDisabled('directive_text')}
                  />
                </FormField>
              </FormRow>
            )}
          </>
        )}

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
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
        />
      </form>
    </div>
  );
};