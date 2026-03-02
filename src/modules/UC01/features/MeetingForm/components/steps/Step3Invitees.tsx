import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/lib/ui';
import { FormTable, ActionButtons, FormAsyncSelectV2, FormInput, AIGenerateButton, type OptionType, type CustomCellRenderParams, getUserDisplayId, getUserDisplayLabel } from '@/modules/shared';
import { SuggestAttendeesModal } from '../../../../../UC02/components';
import type { UseSuggestMeetingAttendeesParams } from '../../../../../UC02/hooks/useSuggestMeetingAttendees';
import { INVITEES_TABLE_COLUMNS } from '../../utils/constants';
import type { Step3InviteesFormData } from '../../schemas/step3Invitees.schema';
import type { UserApiResponse } from '../../../../data/usersApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@sanad-ai/ui';
import { Trash2 } from 'lucide-react';
import { searchUsersByEmail } from '@/modules/UC02/data/usersApi';

const MANUAL_ENTRY_VALUE = '__manual__';
const MANUAL_ENTRY_LABEL = 'إدخال يدوي (مستخدم غير مسجل)';

/** Row for قائمة المدعوين (الوزير) – only shown for UC02 in edit form */
export interface MinisterAttendeeRow {
  id: string;
  external_name: string;
  position: string;
  external_email: string;
  mobile: string;
  attendance_channel: 'PHYSICAL' | 'REMOTE';
  is_required: boolean;
  justification: string;
}

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
  /** Map of form field key -> editable. When provided, fields with false are disabled (edit mode with API editable_fields). */
  step3EditableMap?: Record<string, boolean>;
  /** When provided, enables "إضافة مدعوين آليًا" and renders SuggestAttendeesModal. */
  suggestAttendeesMeetingParams?: UseSuggestMeetingAttendeesParams | null;
  /** Called when suggest attendees modal returns success; receives API response with suggestions. */
  onSuggestAttendeesSuccess?: (data: { suggestions: Array<{ first_name: string; last_name: string; email: string; phone?: string; position_name?: string; job_description?: string; department_name?: string; importance_level?: string }> }) => void;
  /** When true (UC02 scheduling officer), show قائمة المدعوين (الوزير) table. */
  showMinisterInvitees?: boolean;
  /** Minister attendees from formData (hook state); used when showMinisterInvitees. */
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
  handleSaveDraftClick,
  handleBackClick,
  handleCancelClick,
  step3EditableMap,
  suggestAttendeesMeetingParams,
  onSuggestAttendeesSuccess,
  showMinisterInvitees = false,
  ministerAttendees = [],
  onAddMinisterAttendee,
  onDeleteMinisterAttendee,
  onUpdateMinisterAttendee,
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
        const id = getUserDisplayId(u) || user.id;
        const label = getUserDisplayLabel(u);
        const position = user.position ?? u.position_name ?? u.job_title ?? u.title ?? '';
        const sectorVal = u.sector ?? u.department;
        const email = (user.email ?? u.mail) as string | undefined;
        const phone = (user.phone_number ?? u.mobile) as string | null | undefined;
        return {
          value: id,
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
        <div className="w-full min-w-0">
          <FormAsyncSelectV2
            value={value}
            defaultOptions={false}
            fullWidth
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

        {showMinisterInvitees && (
          <div className="relative w-full max-w-[1200px] mx-auto flex flex-col gap-4" dir="rtl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101828]">قائمة المدعوين (الوزير)</h3>
              <button
                type="button"
                onClick={() => onAddMinisterAttendee?.()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] rounded-lg text-[#344054] hover:bg-gray-50 text-sm font-medium"
              >
                إضافة مدعو (الوزير)
              </button>
            </div>
            <div className="border border-[#EAECF0] rounded-xl overflow-hidden">
              <table className="w-full text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                <thead className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                  <tr>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">الاسم</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">المنصب</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">البريد</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">الجوال</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">آلية الحضور</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">مطلوب</th>
                    <th className="px-3 py-3 text-sm font-semibold text-[#344054]">المبرر</th>
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0]">
                  {ministerAttendees.map((row, index) => (
                    <tr key={row.id} className="bg-white hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <FormInput
                          value={row.external_name ?? ''}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'external_name', e.target.value)}
                          placeholder="الاسم"
                          className="h-9 text-right w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FormInput
                          value={row.position ?? ''}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'position', e.target.value)}
                          placeholder="المنصب"
                          className="h-9 text-right w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FormInput
                          value={row.external_email ?? ''}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'external_email', e.target.value)}
                          placeholder="البريد"
                          type="email"
                          className="h-9 text-right w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FormInput
                          value={row.mobile ?? ''}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'mobile', e.target.value)}
                          placeholder="الجوال"
                          className="h-9 text-right w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={row.attendance_channel ?? 'PHYSICAL'}
                          onValueChange={(v: string) => onUpdateMinisterAttendee?.(index, 'attendance_channel', v as 'PHYSICAL' | 'REMOTE')}
                        >
                          <SelectTrigger className="h-9 text-right w-full min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PHYSICAL">حضوري</SelectItem>
                            <SelectItem value="REMOTE">عن بعد</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.is_required ?? false}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'is_required', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#048F86] focus:ring-[#048F86]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FormInput
                          value={row.justification ?? ''}
                          onChange={(e) => onUpdateMinisterAttendee?.(index, 'justification', e.target.value)}
                          placeholder="المبرر"
                          className="h-9 text-right w-full"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onDeleteMinisterAttendee?.(index)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ministerAttendees.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[#667085]">لا توجد بيانات</div>
              )}
            </div>
          </div>
        )}

        <ActionButtons
          onBack={handleBackClick}
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