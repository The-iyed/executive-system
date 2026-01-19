import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { FormField, FormSelect, FormAsyncSelect, FormInput, FormDatePicker, FormTable, FormTextArea, FormSwitch, FormRow, FileUpload } from './components';
import { FormCheckbox } from '@shared';
import { ActionButtons } from '@shared';
import {
  MEETING_NATURE_OPTIONS,
  MEETING_CATEGORY_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MEETING_TYPE_OPTIONS,
  SECTOR_OPTIONS,
  MEETING_GOALS_COLUMNS,
  MEETING_AGENDA_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  PREVIOUS_MEETING_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from './constants';
import { useStep1 } from './useStep1';
import { cn, AsyncSelect, type PaginatedResponse, type AsyncSelectOption } from '@sanad-ai/ui';
import { getUsers, getDirectivesPaginated, getDirectiveById, type UserApiResponse, type DirectiveApiResponse } from '../../../../data/meetingsApi';

interface Step1Props {
  draftId?: string;
  onNext?: (draftId: string) => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: (draftId: string) => void;
}

const DEFAULT_PAGE_SIZE = 20;

const Step1: React.FC<Step1Props> = ({ draftId, onNext, onCancel, onSaveDraft }) => {
  const location = useLocation();
  const [directiveIdFromQuery, setDirectiveIdFromQuery] = useState<string | null>(null);

  // Get directive_id from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const directiveId = searchParams.get('directive_id');
    if (directiveId) {
      setDirectiveIdFromQuery(directiveId);
    }
  }, [location.search]);

  // Fetch users (submitters) - this will be used by AsyncSelect's internal query
  // We'll create a separate query for the async select

  // Fetch single directive if directive_id is in query params
  const { data: defaultDirective, 
    // isLoading: isLoadingDefaultDirective 
  } = useQuery({
    queryKey: ['scheduling-directives', directiveIdFromQuery],
    queryFn: () => getDirectiveById(directiveIdFromQuery!),
    enabled: !!directiveIdFromQuery,
  });

  const handleSuccess = useCallback((newDraftId: string) => {
    console.log('newDraftId', newDraftId);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Step1 error:', error);
  }, []);

  const {
    formData,
    errors,
    touched,
    tableErrors,
    tableTouched,
    isSubmitting,
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
    submitStep,
  } = useStep1({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Store selected directive data to get related_meeting
  const [selectedDirectiveData, setSelectedDirectiveData] = useState<DirectiveApiResponse | null>(null);

  // Set default directive when loaded from query param
  useEffect(() => {
    if (defaultDirective) {
      // Set the directive value if not already set
      if (!formData.relatedDirective || formData.relatedDirective !== defaultDirective.id) {
        handleChange('relatedDirective', defaultDirective.id);
      }
      // Store the directive data for display
      setSelectedDirectiveData(defaultDirective);
      // Also set the previous meeting from the default directive
      if (defaultDirective.related_meeting) {
        handleChange('previousMeeting', defaultDirective.related_meeting);
      }
    }
  }, [defaultDirective, formData.relatedDirective, handleChange]);

  // Set previousMeeting value based on selected directive
  useEffect(() => {
    // First check if we have a default directive from query param
    const directiveToUse = defaultDirective && defaultDirective.id === formData.relatedDirective
      ? defaultDirective
      : selectedDirectiveData;

    if (directiveToUse?.related_meeting) {
      handleChange('previousMeeting', directiveToUse.related_meeting);
    } else if (!formData.relatedDirective) {
      // Clear previous meeting if no directive is selected
      handleChange('previousMeeting', '');
      setSelectedDirectiveData(null);
    }
  }, [formData.relatedDirective, selectedDirectiveData, defaultDirective, handleChange]);

  // Load users options - this function will be called by AsyncSelect
  const loadUsersOptions = useCallback(async (search?: string): Promise<AsyncSelectOption<string>[]> => {
    try {
      const response = await getUsers({
        search: search || '',
        role_code: 'SUBMITTER',
        skip: 0,
        limit: DEFAULT_PAGE_SIZE,
      });
      return response.items.map((user: UserApiResponse) => ({
        id: user.id,
        label: user.name || user.email || user.id,
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }, []);

  // Load directives options with search and pagination support
  // Adapter function to transform API response to AsyncSelect format
  const loadDirectivesOptions = useCallback(async (
    search?: string,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<AsyncSelectOption<string>>> => {
    try {
      // Convert page to skip (page is 0-indexed)
      const skip = (page || 0) * (pageSize || 8);
      const limit = pageSize || 8;

      const paginatedResponse = await getDirectivesPaginated({
        search: search || '',
        skip,
        limit,
      });
      
      // Transform to AsyncSelectOption format
      let options: AsyncSelectOption<string>[] = paginatedResponse.items.map((directive: DirectiveApiResponse) => ({
        id: directive.id,
        label: directive.directive_text || directive.directive_number || directive.id,
        description: directive.directive_number,
      }));
      
      // Add default directive if it exists and is not already in the options (only on first page and no search)
      if (page === 0 && !search && defaultDirective && !options.find((opt) => opt.id === defaultDirective.id)) {
        options.unshift({
          id: defaultDirective.id,
          label: defaultDirective.directive_text || defaultDirective.directive_number || defaultDirective.id,
          description: defaultDirective.directive_number,
        });
      }
      
      // Transform to AsyncSelect expected format
      return {
        data: options,
        page: page || 0,
        pageSize: limit,
        total: paginatedResponse.total,
        hasMore: paginatedResponse.has_next,
      };
    } catch (error) {
      console.error('Error loading directives:', error);
      // If there's an error but we have a default directive, return it
      if (page === 0 && !search && defaultDirective) {
        return {
          data: [{
            id: defaultDirective.id,
            label: defaultDirective.directive_text || defaultDirective.directive_number || defaultDirective.id,
            description: defaultDirective.directive_number,
          }],
          page: 0,
          pageSize: pageSize || DEFAULT_PAGE_SIZE,
          total: 1,
          hasMore: false,
        };
      }
      return {
        data: [],
        page: page || 0,
        pageSize: pageSize || DEFAULT_PAGE_SIZE,
        total: 0,
        hasMore: false,
      };
    }
  }, [defaultDirective]);

  // Handle directive selection to fetch full directive data for related_meeting
  const handleDirectiveChange = useCallback(async (directiveId: string | undefined) => {
    if (!directiveId) {
      handleChange('relatedDirective', '');
      setSelectedDirectiveData(null);
      return;
    }

    handleChange('relatedDirective', directiveId);
    
    // If it's the default directive, use that data
    if (defaultDirective && defaultDirective.id === directiveId) {
      setSelectedDirectiveData(defaultDirective);
      return;
    }
    
    // Otherwise fetch the directive to get related_meeting
    try {
      const directive = await getDirectiveById(directiveId);
      setSelectedDirectiveData(directive);
    } catch (error) {
      console.error('Error fetching directive:', error);
    }
  }, [defaultDirective, handleChange]);

  const handleNextClick = useCallback(async () => {
    try {
      // Try to submit, but proceed to next step regardless
      const newDraftId = await submitStep(false);
      // Always proceed to next step, using newDraftId if available, otherwise use existing draftId
      const finalDraftId = newDraftId || draftId;
      if (finalDraftId) {
        onNext?.(finalDraftId);
      } else {
        // If no draftId exists, create one and proceed
        const createdDraftId = nanoid();
        onNext?.(createdDraftId);
      }
    } catch (error) {
      console.error('Error submitting step 1:', error);
      // On error, still proceed to next step
      if (draftId) {
        onNext?.(draftId);
      } else {
        const createdDraftId = nanoid();
        onNext?.(createdDraftId);
      }
    }
  }, [submitStep, onNext, draftId]);

  const handleSaveDraftClick = useCallback(async () => {
    try {
      const newDraftId = await submitStep(true);
      if (newDraftId) {
        onSaveDraft?.(newDraftId);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [submitStep, onSaveDraft]);

  return (
    <div className="w-full flex flex-col gap-8" data-form-container>
      <form className="space-y-8 flex flex-col items-center">
        <div className="w-full flex flex-col items-center gap-4 sm:gap-7">
          {/* Row 1 */}
          <FormRow>
            <FormField
              label="التوجيه المرتبط"
              error={touched.relatedDirective ? errors.relatedDirective : undefined}
            >
              <AsyncSelect
                fetchOptions={loadDirectivesOptions}
                value={formData.relatedDirective}
                onValueChange={handleDirectiveChange}
                placeholder="-------"
                searchable={true}
                pageSize={DEFAULT_PAGE_SIZE}
                clearable={false}
                disabled={false}
                errorMessage={touched.relatedDirective ? errors.relatedDirective : null}
                searchPlaceholder="البحث..."
                emptyMessage="لم يتم العثور على نتائج."
                className={cn(
                  'w-full text-right h-[44px] p-[10px_14px] bg-[#FFFFFF] border border-[#D0D5DD] rounded-[8px]',
                  'font-normal text-base leading-6 text-[#667085]',
                  'flex-row-reverse justify-between',
                  'focus:outline-none focus:border-[#008774]',
                  'shadow-[0px_1px_2px_rgba(16,24,40,0.05)]',
                  touched.relatedDirective && errors.relatedDirective && 'border-[#D13C3C]',
                  !(touched.relatedDirective && errors.relatedDirective) && 'focus:border-[#008774]'
                )}
                popoverClassName="rtl"
                width="100%"
                renderSelected={(option) => {
                  // If option is found in the list, use it
                  if (option) {
                    return option.label;
                  }
                  // Fallback: if we have directive data but option not yet loaded
                  if (formData.relatedDirective) {
                    // Check if it's the default directive
                    if (defaultDirective && defaultDirective.id === formData.relatedDirective) {
                      return defaultDirective.directive_text || defaultDirective.directive_number || defaultDirective.id;
                    }
                    // Check if we have selected directive data
                    if (selectedDirectiveData && selectedDirectiveData.id === formData.relatedDirective) {
                      return selectedDirectiveData.directive_text || selectedDirectiveData.directive_number || selectedDirectiveData.id;
                    }
                  }
                  return null;
                }}
              />
            </FormField>
            <FormField
              label="مقدّم الطلب"
              error={touched.requester ? errors.requester : undefined}
            >
              <FormAsyncSelect
                value={formData.requester}
                onValueChange={(value) => handleChange('requester', value)}
                loadOptions={loadUsersOptions}
                placeholder="-------"
                error={!!(touched.requester && errors.requester)}
                searchable={true}
              />
            </FormField>
          </FormRow>

          {/* Row 2 */}
          <FormRow>
            <FormField
              label="الاجتماع السابق"
              error={touched.previousMeeting ? errors.previousMeeting : undefined}
            >
              <FormInput
                value={formData.previousMeeting || ''}
                onChange={(e) => handleChange('previousMeeting', e.target.value)}
                placeholder="-------"
                error={!!(touched.previousMeeting && errors.previousMeeting)}
                disabled={true}
                readOnly={true}
              />
            </FormField>
            <FormField
              label="طبيعة الاجتماع"
              required
              error={touched.meetingNature ? errors.meetingNature : undefined}
            >
              <FormSelect
                value={formData.meetingNature}
                onValueChange={(value) => handleChange('meetingNature', value)}
                options={MEETING_NATURE_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingNature && errors.meetingNature)}
              />
            </FormField>
          </FormRow>

          {/* File Upload Forms */}
          <FileUpload
            title="العرض التقديمي"
            file={formData.presentationFile || null}
            onFileSelect={(file) => handleChange('presentationFile', file)}
            error={touched.presentationFile ? errors.presentationFile : undefined}
          />
          
          <FileUpload
            title="مرفقات إضافية"
            file={formData.additionalAttachments || null}
            onFileSelect={(file) => handleChange('additionalAttachments', file)}
            error={touched.additionalAttachments ? errors.additionalAttachments : undefined}
          />

          <FormTextArea
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="-------"
                error={!!(touched.meetingSubject && errors.meetingSubject)}
                label="موضوع الاجتماع"
              />
          {/* Row 3 */}
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

          {/* Row 4 */}
              <FormTextArea
                value={formData.meetingReason || ''}
                onChange={(e) => handleChange('meetingReason', e.target.value)}
                onBlur={() => handleBlur('meetingReason')}
                placeholder="-------"
                error={!!(touched.meetingReason && errors.meetingReason)}
                label="مبرّر اللقاء"
              />
              <FormTextArea
                value={formData.relatedTopic || ''}
                onChange={(e) => handleChange('relatedTopic', e.target.value)}
                onBlur={() => handleBlur('relatedTopic')}
                placeholder="-------"
                error={!!(touched.relatedTopic && errors.relatedTopic)}
                label="الموضوع المرتبط"
              />

          <FormRow>
            <FormField
              label="تصنيف الاجتماع"
              error={touched.meetingClassification ? errors.meetingClassification : undefined}
            >
              <FormSelect
                value={formData.meetingClassification}
                onValueChange={(value) => handleChange('meetingClassification', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingClassification && errors.meetingClassification)}
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
                placeholder="dd:mm:yyyy"
                error={!!(touched.dueDate && errors.dueDate)}
              />
            </FormField>
          </FormRow>
          {/* </FormRow> */}

          {/* Row 6 */}
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

        {/* Table 1: Meeting Goals */}
        <FormTable
          title="الهدف من الاجتماع"
          required
          columns={MEETING_GOALS_COLUMNS}
          rows={formData.meetingGoals || []}
          onAddRow={handleAddGoal}
          onDeleteRow={handleDeleteGoal}
          onUpdateRow={handleUpdateGoal}
          addButtonLabel="إضافة هدف"
          errors={tableErrors}
          touched={tableTouched}
          hasError={!!(errors.meetingGoals || Object.keys(tableErrors).length > 0)}
          errorMessage={errors.meetingGoals || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة هدف واحد على الأقل' : undefined)}
        />

        {/* Table 2: Meeting Agenda */}
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

        {/* Table 3: Minister Support */}
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
          hasError={!!(errors.ministerSupport || Object.keys(tableErrors).length > 0)}
          errorMessage={errors.ministerSupport || (Object.keys(tableErrors).length > 0 ? 'يجب إضافة دعم واحد على الأقل' : undefined)}
        />

        {/* Switch: Was Discussed Previously */}
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

        {/* Table 4: Previous Meetings - Only show when wasDiscussedPreviously is checked */}
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

        {/* Table 5: Related Directives */}
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

        {/* Notes TextArea */}
        <FormTextArea
          label="ملاحظات"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="ملاحظات...."
        />

        {/* Checkbox: Is Complete */}
        <div className="w-full max-w-[1085px] mx-auto px-4">
          <FormCheckbox
            checked={formData.isComplete || false}
            onCheckedChange={(checked) => handleChange('isComplete', checked)}
            label="هل الطلب مكتمل؟"
            required
            error={touched.isComplete ? errors.isComplete : undefined}
          />
        </div>

        <ActionButtons
          onCancel={onCancel}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting}
        />
      </form>
    </div>
  );
};

export default Step1;
