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
} from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_CHANNEL_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
  DIRECTIVE_METHOD_OPTIONS,
} from '../../utils/constants';
import { getUsers, type UserApiResponse } from '../../../../data/usersApi';
import { getMeetings, type MeetingApiResponse } from '../../../../data/meetingsApi';
import { cn } from '@sanad-ai/ui';
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
  handleAddGoal: () => void;
  handleDeleteGoal: (id: string) => void;
  handleUpdateGoal: (id: string, field: string, value: any) => void;
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: any) => void;
  handleAddDirective: () => void;
  handleDeleteDirective: (id: string) => void;
  handleUpdateDirective: (id: string, field: string, value: any) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  
  isStep1BasicInfoFieldRequired: (field: Step1ErrorKey) => boolean;

  /** Time slots (shown when draft exists and meeting is not urgent) */
  timeSlots?: {
    selected_time_slot_id: string | null;
    alternative_time_slot_id_1: string | null;
    alternative_time_slot_id_2: string | null;
    slotOptions: { value: string; label: string }[];
    isLoadingSlots: boolean;
    showTimeSlots: boolean;
  };
  handleSelectMainSlot?: (slotId: string) => void;
  handleSelectAlt1?: (slotId: string) => void;
  handleSelectAlt2?: (slotId: string) => void;
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
  handleAddGoal,
  handleDeleteGoal,
  handleUpdateGoal,
  handleAddAgenda,
  handleDeleteAgenda,
  handleUpdateAgenda,
  handleAddDirective,
  handleDeleteDirective,
  handleUpdateDirective,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  isStep1BasicInfoFieldRequired,
  timeSlots,
  handleSelectMainSlot,
  handleSelectAlt1,
  handleSelectAlt2,
}) => {
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

  // Load previous meeting minutes options
  const loadPreviousMeetingMinutesOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await getMeetings({
        search: search.trim() || undefined,
        skip,
        limit,
      });

      const items = response?.items.map((meeting: MeetingApiResponse) => ({
        label: meeting.meeting_subject || meeting.meeting_title || 'غير محدد',
        value: meeting.id || '',
      }));

      return {
        items,
        total: response?.total,
        skip: response?.skip,
        limit: response?.limit,
        has_next: false,
        has_previous: false,
      };
    } catch (error) {
      console.error('Error loading previous meeting minutes:', error);
      throw error;
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">

        <div className="w-full flex flex-col items-center gap-6 sm:gap-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-[1200px] mx-auto px-4 sm:px-0 [&>div]:min-w-0 [&>div]:w-full">
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
              />
            </FormField>
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
                />
              </FormField>
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
                options={MEETING_CATEGORY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingCategory && errors.meetingCategory)}
              />
            </FormField>

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
                />
              </FormField>
            )}

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
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              />
            </FormField>
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
              />
            </FormField>

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
              />
            </FormField>
            {isStep1BasicInfoFieldRequired('selected_time_slot_id') && timeSlots && (
              <>
              {/* {timeSlots.isLoadingSlots ? ( <div className="text-gray-600 text-right py-4">جاري تحميل المواعيد المتاحة...</div> */}
                <div data-time-slot-error>
                <FormField
                  className="w-full min-w-0"
                  label="موعد الاجتماع"
                  required
                  error={touched.selected_time_slot_id ? errors.selected_time_slot_id : undefined}
                >
                  <FormSelect
                    value={timeSlots.selected_time_slot_id || ''}
                    onValueChange={(v) => handleSelectMainSlot?.(v)}
                    onBlur={() => handleBlur('selected_time_slot_id')}
                    options={timeSlots.slotOptions}
                    placeholder="اختر موعد الاجتماع"
                    error={!!(touched.selected_time_slot_id && errors.selected_time_slot_id)}
                    loading={timeSlots.isLoadingSlots}
                  />
                </FormField>
                </div>
                <FormField
                className="w-full min-w-0"
                label="الموعد البديل الأول"
                error={undefined}
                >
                <FormSelect
                  value={timeSlots.alternative_time_slot_id_1 || ''}
                  onValueChange={(v) => handleSelectAlt1?.(v)}
                  options={timeSlots.slotOptions.filter((o) => o.value !== timeSlots.selected_time_slot_id)}
                  placeholder="( اختياري ) الموعد البديل الأول"
                  loading={timeSlots.isLoadingSlots}
                />
                </FormField>
                <FormField
                className="w-full min-w-0"
                label="الموعد البديل الثاني"
                error={undefined}
                >
                <FormSelect
                  value={timeSlots.alternative_time_slot_id_2 || ''}
                  onValueChange={(v) => handleSelectAlt2?.(v)}
                  options={timeSlots.slotOptions.filter(
                    (o) => o.value !== timeSlots.selected_time_slot_id && o.value !== timeSlots.alternative_time_slot_id_1
                  )}
                  placeholder="( اختياري ) الموعد البديل الثاني"
                  loading={timeSlots.isLoadingSlots}
                />
                </FormField>
              </>  
            )}
          </div>
          {/* Urgent Meeting Section */}
          <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData.is_urgent || false}
              onCheckedChange={(checked) => handleChange('is_urgent', checked)}
              label="اجتماع عاجل؟"
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
                />
              </FormField>
            </FormRow>
          )}

          {/* On Behalf Of Section */}
          <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData.is_on_behalf_of || false}
              onCheckedChange={(checked) => handleChange('is_on_behalf_of', checked)}
              label="هل تطلب الاجتماع نيابة عن غيرك؟"
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
                />
              </FormField>
            </FormRow>
          )}

          {/* Based on Directive Section */}
          <FormRow className='sm:justify-end'>
            <FormSwitch
              checked={formData.is_based_on_directive || false}
              onCheckedChange={(checked) => handleChange('is_based_on_directive', checked)}
              label="هل طلب الاجتماع بناءً على توجيه من معالي الوزير"
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
                  />
                </FormField>
              </FormRow>

              {formData.directive_method === 'PREVIOUS_MEETING' && (
                <FormRow className='sm:justify-end'>
                  <FormField
                    label="محضر الاجتماع"
                    required={isStep1BasicInfoFieldRequired('previous_meeting_minutes_id')}
                    error={touched.previous_meeting_minutes_id ? errors.previous_meeting_minutes_id : undefined}
                  >
                    <FormAsyncSelectV2
                      value={formData.previous_meeting_minutes_id ? { label: formData.previous_meeting_minutes_id, value: formData.previous_meeting_minutes_id } : null}
                      onValueChange={(option) => handleChange('previous_meeting_minutes_id', option?.value || '')}
                      loadOptions={loadPreviousMeetingMinutesOptions}
                      placeholder="-------"
                      error={!!(touched.previous_meeting_minutes_id && errors.previous_meeting_minutes_id)}
                      errorMessage={touched.previous_meeting_minutes_id ? errors.previous_meeting_minutes_id : undefined}
                      fullWidth
                    />
                  </FormField>
                </FormRow>
              )}
            </>
          )}
        </div>

        <FormTable
          title="أهداف الاجتماع"
          required
          columns={MEETING_GOALS_COLUMNS}
          rows={formData.meetingGoals || []}
          onAddRow={handleAddGoal}
          onDeleteRow={handleDeleteGoal}
          onUpdateRow={handleUpdateGoal}
          addButtonLabel="إضافة هدف"
          errors={tableErrors}
          touched={tableTouched}
          errorMessage={errors?.meetingGoals}
        />

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
        />

        <FormRow 
          className={cn(
            'flex-wrap-reverse sm:flex-nowrap',
            formData.wasDiscussedPreviously ? 'sm:justify-between' : 'sm:justify-end')}
        >
          {formData.wasDiscussedPreviously && (
            <FormField
              label="تاريخ الاجتماع السابق"
              required={isStep1BasicInfoFieldRequired('previousMeetingDate')}
              error={touched.previousMeetingDate ? errors.previousMeetingDate : undefined}
            >
              <FormDatePicker
                value={formData.previousMeetingDate}
                onChange={(value) => handleChange('previousMeetingDate', value)}
                onBlur={() => handleBlur('previousMeetingDate')}
                placeholder="dd/mm/yyyy"
                error={!!(touched.previousMeetingDate && errors.previousMeetingDate)}
              />
            </FormField>
          )}
          <FormSwitch
            checked={formData.wasDiscussedPreviously || false}
            onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
            label="هل تمت مناقشة الموضوع سابقاً؟"
          />
        </FormRow>

        {formData.wasDiscussedPreviously && (
          <FormTable
            title="التوجيه المرتبط"
            columns={RELATED_DIRECTIVES_COLUMNS}
            rows={formData.relatedDirectives || []}
            onAddRow={handleAddDirective}
            onDeleteRow={handleDeleteDirective}
            onUpdateRow={handleUpdateDirective}
            addButtonLabel="إضافة توجيه مرتبط"
            errors={tableErrors}
            touched={tableTouched}
            errorMessage={errors?.relatedDirectives}
          />
        )}

        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
          error={errors?.notes}
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