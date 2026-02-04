import React, { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@sanad-ai/ui';
import { 
  FormField, 
  FormInput, 
  FormSelect, 
  FormDatePicker, 
  FormTable, 
  FormTextArea, 
  FormSwitch, 
  FileUpload,
  FormRow,
  ActionButtons,
  FormAsyncSelectV2,
  type OptionType,
} from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  MEETING_NATURE_OPTIONS,
  SECTOR_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  PREVIOUS_MEETING_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from '../../utils/constants';
import { DirectiveApiResponse, getDirectivesPaginated, getUsers, UserApiResponse } from '../../../../data';
import type { Step1FormData } from '../../schemas/step1.schema';

const DEFAULT_PAGE_SIZE = 10;

export interface Step1Props {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  touched: Partial<Record<keyof Step1FormData, boolean>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleChange: (field: keyof Step1FormData, value: any) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  handleAddGoal: () => void;
  handleDeleteGoal: (id: string) => void;
  handleUpdateGoal: (id: string, field: string, value: any) => void;
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: any) => void;
  handleAddSupport: () => void;
  handleDeleteSupport: (id: string) => void;
  handleUpdateSupport: (id: string, field: string, value: any) => void;
  handleAddPreviousMeeting: () => void;
  handleDeletePreviousMeeting: (id: string) => void;
  handleUpdatePreviousMeeting: (id: string, field: string, value: any) => void;
  handleAddDirective: () => void;
  handleDeleteDirective: (id: string) => void;
  handleUpdateDirective: (id: string, field: string, value: any) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  isFieldRequired: (field: keyof Step1FormData) => boolean;
}

export const Step1: React.FC<Step1Props> = ({
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
}) => {
  const location = useLocation();

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
  }, []);

  const loadDirectivesOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await getDirectivesPaginated({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      
      const items = response?.items.map((directive: DirectiveApiResponse) => {
        const option = {
          value: directive?.id,
          label: directive?.directive_text || '',
          description: directive?.related_meeting || '',
        };
        return option;
      });

      return {
        items,
        total: response?.total,
        skip: response?.skip,
        limit: response?.limit,
        has_next: response?.has_next,
        has_previous: response?.has_previous,
      };
    } catch (error) {
      console.error('Error loading directives:', error);
      throw error;
    }
  }, []);

  const loadUsersOptions = useCallback(async (
    search: string,
    skip: number,
    limit: number
  ) => {
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        role_code: 'SUBMITTER',
        skip,
        limit,
      });

      const items = response?.items.map((user: UserApiResponse) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') 
          || user?.username 
          || user?.email 
        
        return {
          label: fullName,
          value: user?.id,
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
      console.error('Error loading users:', error);
      throw error;
    }
  }, []);

  const handleDirectiveChange = useCallback(async (value: OptionType | null) => {
    if (!value) {
      handleChange('relatedDirective', null);
      handleChange('previousMeeting', '');
      return;
    }
    handleChange('relatedDirective', value);
    handleChange('previousMeeting', value?.description);
  }, []);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        <div className="w-full flex flex-col items-center gap-4 sm:gap-7">
          <FormRow>
            <FormField
              label="التوجيه المرتبط"
              error={touched.relatedDirective ? errors.relatedDirective : undefined}
            >
              <FormAsyncSelectV2
                value={formData.relatedDirective || null}
                onValueChange={handleDirectiveChange}
                loadOptions={loadDirectivesOptions}
                placeholder="-------"
                isSearchable={true}
                isClearable={false}
                isDisabled={false}
                error={!!(touched.relatedDirective && errors.relatedDirective)}
                errorMessage={touched.relatedDirective ? errors.relatedDirective : null}
                searchPlaceholder="البحث..."
                emptyMessage="لم يتم العثور على نتائج."
                fullWidth={true}
                limit={DEFAULT_PAGE_SIZE}
              />
            </FormField>
            <FormField
              label="مقدّم الطلب"
              error={touched.requester ? errors.requester : undefined}
            >
              <FormAsyncSelectV2
                value={formData.requester || null}
                onValueChange={(value: OptionType | null) => handleChange('requester', value || null)}
                loadOptions={loadUsersOptions}
                placeholder="-------"
                isSearchable={true}
                error={!!(touched.requester && errors.requester)}
                errorMessage={touched.requester ? errors.requester : null}
                fullWidth={true}
                limit={DEFAULT_PAGE_SIZE}
                searchPlaceholder="ابحث عن مستخدم..."
                emptyMessage="لم يتم العثور على مستخدمين"
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField
              label="الاجتماع السابق"
              error={touched.previousMeeting ? errors.previousMeeting : undefined}
            >
              <FormInput
                value={formData.previousMeeting ||  ''}
                onChange={(e) => handleChange('previousMeeting', e.target.value)}
                onBlur={() => handleBlur('previousMeeting')}
                placeholder={ '-------'}
                error={!!(touched.previousMeeting && errors.previousMeeting)}
                disabled={true}
                readOnly={true}
              />
            </FormField>
            <FormField
              label="طبيعة الاجتماع"
              error={touched.meetingNature ? errors.meetingNature : undefined}
            >
              <FormSelect
                value={formData.meetingNature || ''}
                onValueChange={(value) => handleChange('meetingNature', value)}
                options={MEETING_NATURE_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingNature && errors.meetingNature)}
              />
            </FormField>
          </FormRow>

          <FormTextArea
            value={formData.meetingSubject || ''}
            onChange={(e) => handleChange('meetingSubject', e.target.value)}
            onBlur={() => handleBlur('meetingSubject')}
            error={touched.meetingSubject && errors.meetingSubject ? errors.meetingSubject : undefined}
            label="موضوع الاجتماع"
            placeholder="موضوع الاجتماع...."
          />

          <FormRow>
            <FormField
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
            <FormField
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
          </FormRow>

          <FormTextArea
            value={formData.meetingReason || ''}
            onChange={(e) => handleChange('meetingReason', e.target.value)}
            onBlur={() => handleBlur('meetingReason')}
            error={touched.meetingReason && errors.meetingReason ? errors.meetingReason : undefined}
            label="مبرّر اللقاء"
            placeholder="مبرّر اللقاء...."
          />
          <FormTextArea
            value={formData.relatedTopic || ''}
            onChange={(e) => handleChange('relatedTopic', e.target.value)}
            onBlur={() => handleBlur('relatedTopic')}
            error={touched.relatedTopic && errors.relatedTopic ? errors.relatedTopic : undefined}
            label="الموضوع المرتبط"
            placeholder="الموضوع المرتبط...."
          />

          <FormRow>
            <FormField
              label="تصنيف الاجتماع"
              error={touched.meetingClassification1 ? errors.meetingClassification1 : undefined}
            >
              <FormSelect
                value={formData.meetingClassification1}
                onValueChange={(value) => handleChange('meetingClassification1', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingClassification1 && errors.meetingClassification1)}
              />
            </FormField>
            <FormField
              label="تاريخ الاستحقاق"
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
          </FormRow>

          <FormRow>
            <FormField
              label="القطاع"
              error={touched.sector ? errors.sector : undefined}
            >
              <FormSelect
                value={formData.sector}
                onValueChange={(value) => handleChange('sector', value)}
                options={SECTOR_OPTIONS}
                placeholder="-------"
                error={!!(touched.sector && errors.sector)}
              />
            </FormField>
            <FormField
              label="سريّة الاجتماع"
              error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
            >
              <FormSelect
                value={formData.meetingConfidentiality}
                onValueChange={(value) => handleChange('meetingConfidentiality', value)}
                options={CONFIDENTIALITY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              />
            </FormField>
          </FormRow>
        </div>

        <FileUpload
            label="العرض التقديمي"
            file={formData.presentationFile || null}
            onFileSelect={(file) => handleChange('presentationFile', file)}
            error={touched.presentationFile && errors.presentationFile ? errors.presentationFile : undefined}
            required={isFieldRequired('presentationFile')}
          />
          
          <FileUpload
            label="مرفقات إضافية"
            file={formData.additionalAttachments || null}
            onFileSelect={(file) => handleChange('additionalAttachments', file)}
            error={touched.additionalAttachments && errors.additionalAttachments ? errors.additionalAttachments : undefined}
          />

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
          errorMessage={errors.meetingGoals || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة هدف واحد على الأقل' : undefined)}
        />

        <FormTable
          title="جدول أعمال الاجتماع"
          columns={MEETING_AGENDA_COLUMNS}
          rows={formData.meetingAgenda || []}
          onAddRow={handleAddAgenda}
          onDeleteRow={handleDeleteAgenda}
          onUpdateRow={handleUpdateAgenda}
          addButtonLabel="إضافة جدول أعمال الاجتماع"
          errors={tableErrors}
          touched={tableTouched}
        />

        <FormTable
          title="الدعم المطلوب من الوزير"
          required
          columns={MINISTER_SUPPORT_COLUMNS}
          rows={formData.ministerSupport || []}
          onAddRow={handleAddSupport}
          onDeleteRow={handleDeleteSupport}
          onUpdateRow={handleUpdateSupport}
          addButtonLabel="إضافة دعم"
          errors={tableErrors}
          touched={tableTouched}
          errorMessage={errors.ministerSupport || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة دعم واحد على الأقل' : undefined)}
        />

        <FormRow className={cn(
          'flex-wrap-reverse sm:flex-nowrap',
          formData.wasDiscussedPreviously ? 'sm:justify-end' : 'sm:justify-end'
        )}>
          <FormSwitch
            checked={formData.wasDiscussedPreviously || false}
            onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
            label="هل تمت مناقشة الموضوع سابقًا؟"
          />
        </FormRow>

        {formData.wasDiscussedPreviously && (
          <FormTable
            title="تاريخ الاجتماع السابق"
            columns={PREVIOUS_MEETING_COLUMNS}
            rows={formData.previousMeetings || []}
            onAddRow={handleAddPreviousMeeting}
            onDeleteRow={handleDeletePreviousMeeting}
            onUpdateRow={handleUpdatePreviousMeeting}
            addButtonLabel="إضافة إجتماع سابق"
            errors={tableErrors}
            touched={tableTouched}
          />
        )}

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
        />

        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
        />

          <FormField
            label="هل الطلب مكتمل؟"
            error={touched.isComplete ? errors.isComplete : undefined}
            className='w-full max-w-[1200px]'
          >
            <FormSwitch
              checked={formData.isComplete || false}
              onCheckedChange={(checked) => handleChange('isComplete', checked)}
            />
          </FormField>

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