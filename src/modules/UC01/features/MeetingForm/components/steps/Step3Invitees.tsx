import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/lib/ui';
import { FormTable, ActionButtons, FormAsyncSelectV2, FormInput, AIGenerateButton, type OptionType, type CustomCellRenderParams } from '@/modules/shared';
import { SuggestAttendeesModal } from '../../../../../UC02/components';
import type { UseSuggestMeetingAttendeesParams } from '../../../../../UC02/hooks/useSuggestMeetingAttendees';
import { INVITEES_TABLE_COLUMNS } from '../../utils/constants';
import type { Step3InviteesFormData } from '../../schemas/step3Invitees.schema';
import { getUsers } from '../../../../data/usersApi';
import type { UserApiResponse } from '../../../../data/usersApi';

const MANUAL_ENTRY_VALUE = '__manual__';
const MANUAL_ENTRY_LABEL = 'إدخال يدوي (مستخدم غير مسجل)';

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
  handleNextClick,
  handleSaveDraftClick,
  handleCancelClick,
  step3EditableMap,
  suggestAttendeesMeetingParams,
  onSuggestAttendeesSuccess,
}) => {
  const isFieldDisabled = (fieldKey: string) =>
    step3EditableMap != null && step3EditableMap[fieldKey] === false;

  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);
  const { toast } = useToast();
  const userOptionsMapRef = useRef<Map<string, { value: string; label: string; description?: string; username?: string; position?: string; phone_number?: string; sector?: string; first_name?: string; last_name?: string }>>(new Map());
  /** Last search input per row id – used when user selects "إدخال يدوي" to prefill name */
  const searchInputByRowRef = useRef<Record<string, string>>({});

  const loadUserOptions = useCallback(async (search: string, skip: number, limit: number) => {
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = response.items.map((user: UserApiResponse) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
        const position = user.position ?? (user as Record<string, unknown>).position_name ?? (user as Record<string, unknown>).job_title ?? '';
        const sectorVal = (user as Record<string, unknown>).sector;
        return {
          value: user.id,
          label: fullName,
          description: user.email,
          username: user.username || fullName,
          position: typeof position === 'string' ? position : '',
          phone_number: user.phone_number || '',
          sector: typeof sectorVal === 'string' ? sectorVal : '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
        };
      });
      items.forEach((o) => userOptionsMapRef.current.set(o.value, o));
      // Include current search in manual option so it can be used as name when selected (e.g. when no results)
      const manualOption = { value: MANUAL_ENTRY_VALUE, label: MANUAL_ENTRY_LABEL, __search: search?.trim() ?? '' };
      return {
        items: skip === 0 ? [manualOption, ...items] : items,
        total: skip === 0 ? response.total + 1 : response.total,
        skip: response.skip,
        limit: response.limit,
        has_next: response.has_next || false,
        has_previous: response.has_previous || false,
      };
    } catch (err) {
      console.error('Error loading users:', err);
      throw err;
    }
  }, []);

  const inviteeNameCellRender = useCallback(
    (params: CustomCellRenderParams) => {
      const { row, onUpdateRow, disabled } = params;
      const isManual = row.user_id === MANUAL_ENTRY_VALUE;

      if (isManual) {
        return (
          <FormInput
            value={row.name ?? ''}
            onChange={(e) => onUpdateRow('name', e.target.value)}
            placeholder="الإسم"
            disabled={disabled}
            fullWidth
          />
        );
      }

      const value: OptionType | null =
        row.user_id && row.user_id !== MANUAL_ENTRY_VALUE
          ? { value: row.user_id, label: row.username || row.name || '' }
          : null;

      return (
        <FormAsyncSelectV2
          value={value}
          onValueChange={(opt) => {
            if (!opt) {
              onUpdateRow('user_id', '');
              onUpdateRow('username', '');
              onUpdateRow('name', '');
              onUpdateRow('position', '');
              onUpdateRow('sector', '');
              onUpdateRow('mobile', '');
              onUpdateRow('email', '');
              onUpdateRow('disabled', false);
              return;
            }
            if (opt.value === MANUAL_ENTRY_VALUE) {
              // Use search from option (from loadOptions when no/few results) or from onInputChange ref
              const searchFromOption = (opt as { __search?: string }).__search ?? '';
              const searchFromRef = (searchInputByRowRef.current[row.id] ?? '').trim();
              const searchValue = (searchFromOption || searchFromRef).trim();
              onUpdateRow('user_id', MANUAL_ENTRY_VALUE);
              onUpdateRow('username', '');
              onUpdateRow('name', searchValue);
              onUpdateRow('position', '');
              onUpdateRow('sector', '');
              onUpdateRow('mobile', '');
              onUpdateRow('email', '');
              onUpdateRow('disabled', false);
              return;
            }
            const existing = (formData.invitees ?? []).find(
              (inv) => inv.id !== row.id && inv.user_id === opt.value
            );
            if (existing) {
              toast({
                title: 'المستخدم موجود مسبقاً',
                description: 'تم إضافة هذا المستخدم إلى القائمة مسبقاً',
                variant: 'destructive',
              });
              return;
            }
            const u = userOptionsMapRef.current.get(opt.value);
            if (u) {
              const label = u.username || u.label;
              onUpdateRow('user_id', u.value);
              onUpdateRow('username', label);
              onUpdateRow('name', label);
              onUpdateRow('position', u.position ?? '');
              onUpdateRow('sector', u.sector ?? '');
              onUpdateRow('mobile', u.phone_number ?? '');
              onUpdateRow('email', u.description ?? '');
              onUpdateRow('disabled', true);
            }
          }}
          loadOptions={loadUserOptions}
          placeholder="اختر مستخدم أو إدخال يدوي"
          isClearable
          fullWidth
          isSearchable
          limit={10}
          searchPlaceholder="ابحث عن مستخدم..."
          emptyMessage="لم يتم العثور على مستخدمين"
          isDisabled={disabled}
          onInputChange={(newValue) => {
            searchInputByRowRef.current[row.id] = newValue;
          }}
        />
      );
    },
    [formData.invitees, loadUserOptions, toast]
  );

  const customCellRender = useMemo(
    () => ({ name: inviteeNameCellRender }),
    [inviteeNameCellRender]
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex flex-col gap-6">
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
            title= 'قائمة المدعوين'
            columns={INVITEES_TABLE_COLUMNS}
            required={inviteesRequired}
            rows={formData.invitees || []}
            onAddRow={handleAddAttendee}
            onDeleteRow={handleDeleteAttendee}
            onUpdateRow={handleUpdateAttendee}
            addButtonLabel='إضافة مدعو جديد'
            errors={errors}
            touched={touched}
            errorMessage={tableErrorMessage}
            disabled={isFieldDisabled('invitees')}
            customCellRender={customCellRender}
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