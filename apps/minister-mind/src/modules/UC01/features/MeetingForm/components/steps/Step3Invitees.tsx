import React, { useState, useCallback, useRef } from 'react';
import { useToast } from '@sanad-ai/ui';
import { FormTable, ActionButtons, FormAsyncSelectV2, OptionType, AIGenerateButton } from '@shared';
import { SuggestAttendeesModal } from '../../../../../UC02/components';
import type { UseSuggestMeetingAttendeesParams } from '../../../../../UC02/hooks/useSuggestMeetingAttendees';
import {
  INVITEES_TABLE_COLUMNS,
  INVITEES_TABLE_TITLE,
  ADD_INVITEE_BUTTON_LABEL,
} from '../../utils/constants';
import type { Step3InviteesFormData } from '../../schemas/step3Invitees.schema';
import { getUsers } from '../../../../data/usersApi';
import type { UserApiResponse } from '../../../../data/usersApi';

export interface Step3InviteesProps {
  formData: Partial<Step3InviteesFormData>;
  errors: Record<string, Record<string, string>>;
  touched: Record<string, Record<string, boolean>>;
  inviteesRequired?: boolean;
  tableErrorMessage?: string;
  isSubmitting: boolean;
  isDeleting: boolean;
  
  // Handlers
  handleAddAttendee: () => void;
  handleDeleteAttendee: (id: string) => void;
  handleUpdateAttendee: (id: string, field: string, value: any) => void;
  handleAddUserFromSelect: (userOption: { 
    value: string; 
    label: string; 
    description?: string; 
    username?: string;
    position?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }) => boolean;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleCancelClick: () => void;
  /** Map of form field key -> editable. When provided, fields with false are disabled (edit mode with API editable_fields). */
  step3EditableMap?: Record<string, boolean>;
  /** When provided, enables "إضافة مدعوين آليًا" and renders SuggestAttendeesModal. */
  suggestAttendeesMeetingParams?: UseSuggestMeetingAttendeesParams | null;
  /** Called when suggest attendees modal returns success; receives API response with suggestions. */
  onSuggestAttendeesSuccess?: (data: { suggestions: Array<{ first_name: string; last_name: string; email: string; phone?: string; position_name?: string; job_description?: string; department_name?: string; importance_level?: string }> }) => void;
}

export const Step3Invitees: React.FC<Step3InviteesProps> = ({
  formData,
  errors,
  touched,
  inviteesRequired = false,
  tableErrorMessage,
  isSubmitting,
  isDeleting,
  handleAddAttendee,
  handleDeleteAttendee,
  handleUpdateAttendee,
  handleAddUserFromSelect,
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  step3EditableMap,
  suggestAttendeesMeetingParams,
  onSuggestAttendeesSuccess,
}) => {
  const isFieldDisabled = (fieldKey: string) =>
    step3EditableMap != null && step3EditableMap[fieldKey] === false;

  const [selectedUserId, setSelectedUserId] = useState<OptionType | null>(null);
  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);
  const { toast } = useToast();
  const userOptionsMapRef = useRef<Map<string, { 
    value: string; 
    label: string; 
    description?: string; 
    username?: string; 
    position?: string; 
    phone_number?: string;
    first_name?: string;
    last_name?: string;
  }>>(new Map());

  const handleUserSelect = useCallback((value: OptionType | null) => {
    if (!value) {
      setSelectedUserId(null);
      return;
    }
    
    const selectedOption = userOptionsMapRef.current.get(value.value);
    if (selectedOption) {
      const added = handleAddUserFromSelect(selectedOption);
      if (!added) {
        toast({
          title: 'المستخدم موجود مسبقاً',
          description: 'تم إضافة هذا المستخدم إلى القائمة مسبقاً',
          variant: 'destructive',
        });
        setSelectedUserId(null);
        return;
      }
      
      toast({
        title: 'تمت الإضافة بنجاح',
        description: `تم إضافة ${selectedOption.label} إلى قائمة المدعوين`,
      });
      setSelectedUserId(null);
    } else {
      setSelectedUserId(null);
    }
  }, [handleAddUserFromSelect]);

  const handleLoadOptions = useCallback(async (
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

      const items = response.items.map((user: UserApiResponse) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
        return {
          value: user.id,
          label: fullName,
          description: user.email,
          username: user.username || fullName, 
          position: user.position || '',
          phone_number: user.phone_number || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
        };
      });

      items.forEach((option) => {
        userOptionsMapRef.current.set(option.value, option);
      });

      return {
        items,
        total: response.total,
        skip: response.skip,
        limit: response.limit,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      };
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex flex-col gap-6">
        <FormAsyncSelectV2
          value={selectedUserId}
          onValueChange={handleUserSelect}
          placeholder="اختر أحدَ المشتركين في المنصّة"
          loadOptions={handleLoadOptions}
          isClearable
          fullWidth
          className='max-w-[1200px] mx-auto'
          isSearchable={true}
          limit={10}
          searchPlaceholder="ابحث عن مستخدم..."
          emptyMessage="لم يتم العثور على مستخدمين"
          isDisabled={isFieldDisabled('invitees')}
        />
        {suggestAttendeesMeetingParams && onSuggestAttendeesSuccess && (
          <SuggestAttendeesModal
            isOpen={isSuggestAttendeesModalOpen}
            onOpenChange={setIsSuggestAttendeesModalOpen}
            meetingParams={suggestAttendeesMeetingParams}
            onSuccess={onSuggestAttendeesSuccess}
          />
        )}
        <div className="relative w-full max-w-[1200px] mx-auto">
          <FormTable
            title={INVITEES_TABLE_TITLE}
            columns={INVITEES_TABLE_COLUMNS}
            required={inviteesRequired}
            rows={formData.invitees || []}
            onAddRow={handleAddAttendee}
            onDeleteRow={handleDeleteAttendee}
            onUpdateRow={handleUpdateAttendee}
            addButtonLabel={ADD_INVITEE_BUTTON_LABEL}
            errors={errors}
            touched={touched}
            errorMessage={tableErrorMessage}
            disabled={isFieldDisabled('invitees')}
          />
          {suggestAttendeesMeetingParams && onSuggestAttendeesSuccess && (
            <div className="absolute bottom-[-3px] right-[170px]">
              <AIGenerateButton
                label="إضافة مدعوين آليًا"
                disabled={isFieldDisabled('invitees')}
                onClick={() => setIsSuggestAttendeesModalOpen(true)}
              />
            </div>
          )}
        </div>
        <ActionButtons
          onCancel={handleCancelClick}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
          nextLabel='إرسال'
        />
      </div>
    </div>
  );
};