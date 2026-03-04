import React, { useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/lib/ui';
import { FormTable, ActionButtons, FormAsyncSelectV2, FormInput, type OptionType, type CustomCellRenderParams, getUserDisplayId, getUserDisplayLabel } from '@/modules/shared';
import { INVITEES_TABLE_COLUMNS, MINISTER_ATTENDEES_COLUMNS } from '../../utils/constants';
import type { Step3InviteesFormData } from '../../schemas/step3Invitees.schema';
import type { UserApiResponse } from '../../../../data/usersApi';
import { searchUsersByEmail } from '@/modules/UC02/data/usersApi';

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
  handleBackClick?: () => void;
  handleCancelClick: () => void;
  step3EditableMap?: Record<string, boolean>;
  showMinisterInvitees?: boolean;
  ministerAttendees?: Array<{ id: string; external_name?: string; position?: string; external_email?: string; mobile?: string; attendance_channel?: 'PHYSICAL' | 'REMOTE'; is_required?: boolean; justification?: string }>;
  onAddMinisterAttendee?: () => void;
  onDeleteMinisterAttendee?: (index: number) => void;
  onUpdateMinisterAttendee?: (index: number, field: string, value: string | boolean) => void;
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
  handleBackClick,
  step3EditableMap,
}) => {
  const isFieldDisabled = (fieldKey: string) =>
    step3EditableMap != null && step3EditableMap[fieldKey] === false;

  const { toast } = useToast();
  const userOptionsMapRef = useRef<Map<string, { value: string; label: string; description?: string; username?: string; position?: string; phone_number?: string; sector?: string; first_name?: string; last_name?: string }>>(new Map());
  const searchInputByRowRef = useRef<Record<string, string>>({});

  const loadUserOptions = useCallback(async (search: string, skip: number, limit: number) => {
    try {
      const manualOption = { value: MANUAL_ENTRY_VALUE, label: MANUAL_ENTRY_LABEL, __search: search?.trim() ?? '' };
      const hasSearch = (search?.trim() ?? '').length > 0;

      if (!hasSearch) {
        // Initial dropdown: show only manual option, no API call
        return {
          items: skip === 0 ? [manualOption] : [],
          total: 1,
          skip: 0,
          limit,
          has_next: false,
          has_previous: false,
        };
      }

      const response = await searchUsersByEmail(search, skip, limit);
      const items = response.items.map((user: UserApiResponse) => {
        const u = user as Record<string, unknown>;
        const objectGuid =
          getUserDisplayId(u) ||
          (user as unknown as { object_guid?: string }).object_guid ||
          user.id;
        const label = getUserDisplayLabel(u);
        const position = user.position ?? u.position_name ?? u.job_title ?? u.title ?? '';
        const sectorVal = u.sector ?? u.department;
        const email = (user.email ?? u.mail) as string | undefined;
        const phone = (user.phone_number ?? u.mobile) as string | null | undefined;
        return {
          value: objectGuid,
          label,
          description: email ?? '',
          username: (user.username ?? u.cn ?? label) as string,
          position: typeof position === 'string' ? position : '',
          phone_number: phone ?? '',
          sector: typeof sectorVal === 'string' ? sectorVal : '',
          first_name: (user.first_name ?? u.givenName) as string,
          last_name: (user.last_name ?? u.sn) as string,
        };
      });
      items.forEach((o) => userOptionsMapRef.current.set(o.value, o));
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
      const isManual = row.object_guid === MANUAL_ENTRY_VALUE;

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
        row.object_guid && row.object_guid !== MANUAL_ENTRY_VALUE
          ? { value: row.object_guid, label: row.username || row.name || '' }
          : null;

      return (
        <div className="w-full min-w-0">
          <FormAsyncSelectV2
            value={value}
            defaultOptions={false}
            fullWidth
            onValueChange={(opt) => {
            if (!opt) {
              onUpdateRow('object_guid', '');
              onUpdateRow('username', '');
              onUpdateRow('name', '');
              onUpdateRow('position', '');
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
              onUpdateRow('object_guid', MANUAL_ENTRY_VALUE);
              onUpdateRow('username', '');
              onUpdateRow('name', searchValue);
              onUpdateRow('position', '');
              onUpdateRow('mobile', '');
              onUpdateRow('email', '');
              onUpdateRow('disabled', false);
              return;
            }
            const existing = (formData.invitees ?? []).find(
              (inv) => inv.id !== row.id && (inv as { object_guid?: string }).object_guid === opt.value
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
              const email = (u.description ?? '').trim() || label;
              onUpdateRow('object_guid', u.value);
              onUpdateRow('username', label);
              onUpdateRow('name', label);
              onUpdateRow('position', u.position ?? '');
              onUpdateRow('mobile', u.phone_number ?? '');
              onUpdateRow('email', email);
              onUpdateRow('disabled', true);
            }
          }}
          loadOptions={loadUserOptions}
          placeholder="اختر مستخدم أو إدخال يدوي"
          isClearable
          isSearchable
          limit={10}
          searchPlaceholder="ابحث عن مستخدم..."
          emptyMessage="لم يتم العثور على مستخدمين"
          isDisabled={disabled}
          onInputChange={(newValue) => {
            searchInputByRowRef.current[row.id] = newValue;
          }}
          />
        </div>
      );
    },
    [formData.invitees, loadUserOptions, toast]
  );

  const customCellRender = useMemo(
    () => ({ name: inviteeNameCellRender }),
    [inviteeNameCellRender]
  );

  const inviteeRows = (formData.invitees ?? []).map((row) => ({
    ...row,
    id: row.id,
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex flex-col gap-6">
        <div className="relative w-full max-w-[1200px] mx-auto">
          <FormTable
            title= 'قائمة المدعوين'
            columns={INVITEES_TABLE_COLUMNS}
            required={inviteesRequired}
            rows={inviteeRows}
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
        </div>

        {/* {showMinisterInvitees && (
          <div className="relative w-full max-w-[1200px] mx-auto">
            <FormTable
              title='مدعوو الوزير'
              columns={ministerColumns}
              rows={ministerRows}
              onAddRow={handleMinisterRowAdd}
              onDeleteRow={handleMinisterRowDelete}
              onUpdateRow={handleMinisterRowUpdate}
              addButtonLabel='إضافة مدعو للوزير'
              errors={errors}
              touched={touched}
              customCellRender={ministerCustomCellRender}
              emptyStateMessage="لا يوجد مدعوون من الوزير"
            />
          </div>
        )} */}

        <ActionButtons
          onBack={handleBackClick}
          // onCancel={handleCancelClick}
          // onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          disabled={isSubmitting || isDeleting}
          nextLabel='إرسال'
        />
      </div>
    </div>
  );
};