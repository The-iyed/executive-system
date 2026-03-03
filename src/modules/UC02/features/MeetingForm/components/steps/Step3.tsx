import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { FormTable, ActionButtons, FormAsyncSelectV2, FormInput, AIGenerateButton, type OptionType, type CustomCellRenderParams } from '@/modules/shared';
import { cn } from '@/lib/ui';
import {
  INVITEES_TABLE_COLUMNS,
  MINISTER_INVITEES_TABLE_COLUMNS_NO_OWNER,
} from '../../utils/constants';
import type { Step3FormData } from '../../schemas/step3.schema';
import { getUsers, searchUsersByEmail, type UserApiResponse } from '../../../../data/usersApi';
import { getUserDisplayId, getUserDisplayLabel } from '@/modules/shared/utils';
import { SuggestAttendeesModal } from '../../../../components';
import type { UseSuggestMeetingAttendeesParams } from '../../../../hooks/useSuggestMeetingAttendees';

const MANUAL_ENTRY_VALUE = '__manual__';
const MANUAL_ENTRY_LABEL = 'إدخال يدوي (مستخدم غير مسجل)';

export interface Step3Props {
  formData: Partial<Step3FormData>;
  errors: Record<string, Record<string, string>>;
  touched: Record<string, Record<string, boolean>>;
  isSubmitting: boolean;
  isDeleting: boolean;
  handleAddInvitee: () => void;
  handleDeleteInvitee: (id: string) => void;
  handleUpdateInvitee: (id: string, field: string, value: unknown) => void;
  handleAddMinisterInvitee: () => void;
  handleDeleteMinisterInvitee: (id: string) => void;
  handleUpdateMinisterInvitee: (id: string, field: string, value: unknown) => void;
  setProposerObjectGuids: (ids: string[]) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleBackClick?: () => void;
  handleCancelClick: () => void;
  nonDeletableInviteeIds: string[];
  suggestAttendeesMeetingParams?: UseSuggestMeetingAttendeesParams | null;
  onSuggestAttendeesSuccess?: (data: any) => void;
}

interface ProposerUser {
  object_guid: string;
  label: string;
  email?: string;
}

export const Step3: React.FC<Step3Props> = ({
  formData,
  errors,
  touched,
  isSubmitting,
  isDeleting,
  handleAddInvitee,
  handleDeleteInvitee,
  handleUpdateInvitee,
  handleAddMinisterInvitee,
  handleDeleteMinisterInvitee,
  handleUpdateMinisterInvitee,
  setProposerObjectGuids,
  handleNextClick,
  handleSaveDraftClick,
  handleBackClick,
  handleCancelClick,
  nonDeletableInviteeIds,
  suggestAttendeesMeetingParams,
  onSuggestAttendeesSuccess,
}) => {
  const [proposerUsers, setProposerUsers] = useState<ProposerUser[]>([]);
  const [proposerLoading, setProposerLoading] = useState(true);
  const userOptionsMapRef = useRef<Map<string, { value: string; label: string; position?: string; phone_number?: string; email?: string; sector?: string }>>(new Map());
  const searchInputByRowRef = useRef<Record<string, string>>({});
  const [isSuggestAttendeesModalOpen, setIsSuggestAttendeesModalOpen] = useState(false);

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
      const items = response.items.map((u: UserApiResponse) => {
        const rec = u as Record<string, unknown>;
        const objectGuid = getUserDisplayId(rec) || (u as { object_guid?: string }).object_guid || u.id;
        const label = getUserDisplayLabel(rec);
        const position = u.position ?? rec.position_name ?? rec.job_title ?? rec.title ?? '';
        const sector = rec.sector ?? rec.department_name ?? rec.department ?? '';
        const email = (u.email ?? rec.mail) as string | undefined;
        const phone = (u.phone_number ?? rec.mobile) as string | null | undefined;
        return {
          value: objectGuid,
          label,
          position: typeof position === 'string' ? position : '',
          phone_number: phone ?? '',
          email: email ?? '',
          sector: typeof sector === 'string' ? sector : '',
        };
      });
      items.forEach((o) => userOptionsMapRef.current.set(o.value as string, o));
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
      const { row, onUpdateRow } = params;
      const isManual = (row as { _isManual?: boolean })._isManual === true;

      if (isManual) {
        return (
          <FormInput
            value={row.full_name ?? ''}
            onChange={(e) => onUpdateRow('full_name', e.target.value)}
            placeholder="الإسم"
            fullWidth
          />
        );
      }

      const objectGuid = (row as { _objectGuid?: string })._objectGuid;
      const value: OptionType | null =
        objectGuid && row.full_name
          ? { value: objectGuid, label: row.full_name }
          : null;

      return (
        <div className="w-full min-w-0">
          <FormAsyncSelectV2
            value={value}
            defaultOptions={false}
            fullWidth
            onValueChange={(opt) => {
              if (!opt) {
                onUpdateRow('full_name', '');
                onUpdateRow('position_title', '');
                onUpdateRow('mobile_number', '');
                onUpdateRow('email', '');
                onUpdateRow('_isManual', false);
                onUpdateRow('_objectGuid', '');
                return;
              }
              if (opt.value === MANUAL_ENTRY_VALUE) {
                const searchFromOption = (opt as { __search?: string }).__search ?? '';
                const searchFromRef = (searchInputByRowRef.current[row.id] ?? '').trim();
                const searchValue = (searchFromOption || searchFromRef).trim();
                onUpdateRow('_isManual', true);
                onUpdateRow('full_name', searchValue);
                onUpdateRow('position_title', '');
                onUpdateRow('mobile_number', '');
                onUpdateRow('email', '');
                onUpdateRow('_objectGuid', '');
                return;
              }
              const u = userOptionsMapRef.current.get(opt.value);
              if (u) {
                const existing = (formData.invitees ?? []).find(
                  (inv) => inv.id !== row.id && (inv as { _objectGuid?: string })._objectGuid === u.value
                );
                if (existing) return;
                onUpdateRow('_objectGuid', u.value);
                onUpdateRow('_isManual', false);
                onUpdateRow('full_name', u.label);
                onUpdateRow('position_title', u.position ?? '');
                onUpdateRow('mobile_number', u.phone_number ?? '');
                onUpdateRow('email', u.email ?? '');
              }
            }}
            loadOptions={loadUserOptions}
            placeholder="اختر مستخدم أو إدخال يدوي"
            isClearable
            isSearchable
            limit={10}
            searchPlaceholder="ابحث عن مستخدم..."
            emptyMessage="لم يتم العثور على مستخدمين"
            onInputChange={(newValue) => {
              searchInputByRowRef.current[row.id] = newValue;
            }}
          />
        </div>
      );
    },
    [formData.invitees, loadUserOptions]
  );

  const inviteesCustomCellRender = useMemo(
    () => ({ full_name: inviteeNameCellRender }),
    [inviteeNameCellRender]
  );

  /** Same as invitee name cell but checks minister_invitees for duplicates. */
  const ministerNameCellRender = useCallback(
    (params: CustomCellRenderParams) => {
      const { row, onUpdateRow } = params;
      const isManual = (row as { _isManual?: boolean })._isManual === true;

      if (isManual) {
        return (
          <FormInput
            value={row.full_name ?? ''}
            onChange={(e) => onUpdateRow('full_name', e.target.value)}
            placeholder="الإسم"
            fullWidth
          />
        );
      }

      const objectGuid = (row as { _objectGuid?: string })._objectGuid;
      const value: OptionType | null =
        objectGuid && row.full_name
          ? { value: objectGuid, label: row.full_name }
          : null;

      return (
        <div className="w-full min-w-0">
          <FormAsyncSelectV2
            value={value}
            defaultOptions={false}
            fullWidth
            onValueChange={(opt) => {
              if (!opt) {
                onUpdateRow('full_name', '');
                onUpdateRow('position_title', '');
                onUpdateRow('mobile_number', '');
                onUpdateRow('email', '');
                onUpdateRow('_isManual', false);
                onUpdateRow('_objectGuid', '');
                return;
              }
              if (opt.value === MANUAL_ENTRY_VALUE) {
                const searchFromOption = (opt as { __search?: string }).__search ?? '';
                const searchFromRef = (searchInputByRowRef.current[row.id] ?? '').trim();
                const searchValue = (searchFromOption || searchFromRef).trim();
                onUpdateRow('_isManual', true);
                onUpdateRow('full_name', searchValue);
                onUpdateRow('position_title', '');
                onUpdateRow('mobile_number', '');
                onUpdateRow('email', '');
                onUpdateRow('_objectGuid', '');
                return;
              }
              const u = userOptionsMapRef.current.get(opt.value);
              if (u) {
                const existing = (formData.minister_invitees ?? []).find(
                  (inv) => inv.id !== row.id && (inv as { _objectGuid?: string })._objectGuid === u.value
                );
                if (existing) return;
                onUpdateRow('_objectGuid', u.value);
                onUpdateRow('_isManual', false);
                onUpdateRow('full_name', u.label);
                onUpdateRow('position_title', u.position ?? '');
                onUpdateRow('mobile_number', u.phone_number ?? '');
                onUpdateRow('email', u.email ?? '');
              }
            }}
            loadOptions={loadUserOptions}
            placeholder="اختر مستخدم أو إدخال يدوي"
            isClearable
            isSearchable
            limit={10}
            searchPlaceholder="ابحث عن مستخدم..."
            emptyMessage="لم يتم العثور على مستخدمين"
            onInputChange={(newValue) => {
              searchInputByRowRef.current[row.id] = newValue;
            }}
          />
        </div>
      );
    },
    [formData.minister_invitees, loadUserOptions]
  );

  const ministerCustomCellRender = useMemo(
    () => ({ full_name: ministerNameCellRender }),
    [ministerNameCellRender]
  );

  useEffect(() => {
    getUsers({ limit: 10 })
      .then((res) => {
        setProposerUsers(
          res.items.map((u) => {
            const objectGuid = (u as { object_guid?: string }).object_guid ?? u.id;
            return {
              object_guid: objectGuid,
              label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.name || u.id,
              email: u.email,
            };
          })
        );
      })
      .catch(() => setProposerUsers([]))
      .finally(() => setProposerLoading(false));
  }, []);

  const selectedProposerGuids = new Set(formData.proposer_object_guids ?? []);
  const toggleProposer = useCallback(
    (objectGuid: string) => {
      const current = formData.proposer_object_guids ?? [];
      const next = current.includes(objectGuid)
        ? current.filter((id) => id !== objectGuid)
        : [...current, objectGuid];
      setProposerObjectGuids(next);
    },
    [formData.proposer_object_guids, setProposerObjectGuids]
  );

  const inviteesTableError = errors['__invitees_table__']?._;
  const inviteeRows = (formData.invitees ?? []).map((row) => ({
    ...row,
    id: row.id,
  }));
  const ministerRows = (formData.minister_invitees ?? []).map((row) => ({
    ...row,
    id: row.id,
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full flex flex-col gap-8 max-w-[1200px] mx-auto">
        {suggestAttendeesMeetingParams && onSuggestAttendeesSuccess && (
          <SuggestAttendeesModal
            isOpen={isSuggestAttendeesModalOpen}
            onOpenChange={setIsSuggestAttendeesModalOpen}
            meetingParams={suggestAttendeesMeetingParams}
            onSuccess={onSuggestAttendeesSuccess}
          />
        )}
        {/* Section 1 — Invitees (Request Submitter) */}
        <FormTable
          title='قائمة المدعوين (مقدّم الطلب)'
          required
          columns={INVITEES_TABLE_COLUMNS}
          rows={inviteeRows}
          onAddRow={handleAddInvitee}
          onDeleteRow={handleDeleteInvitee}
          onUpdateRow={handleUpdateInvitee}
          addButtonLabel='إضافة مدعو'
          errors={errors}
          touched={touched}
          errorMessage={inviteesTableError}
          nonDeletableRowIds={nonDeletableInviteeIds}
          emptyStateMessage="أضف مدعوياً واحداً على الأقل (مالك الاجتماع يُضاف تلقائياً)"
          customCellRender={inviteesCustomCellRender}
        />

        <div className="relative">
          <FormTable
            title='مدعوو الوزير'
            columns={MINISTER_INVITEES_TABLE_COLUMNS_NO_OWNER}
            rows={ministerRows}
            onAddRow={handleAddMinisterInvitee}
            onDeleteRow={handleDeleteMinisterInvitee}
            onUpdateRow={handleUpdateMinisterInvitee}
            addButtonLabel='إضافة مدعو للوزير'
            errors={errors}
            touched={touched}
            errorMessage={errors['__minister_invitees_table__']?._}
            emptyStateMessage="لا يوجد مدعوون من الوزير"
            customCellRender={ministerCustomCellRender}
          />
          {suggestAttendeesMeetingParams && onSuggestAttendeesSuccess && (
            <div className="absolute bottom-[-3px] right-[170px]">
              <AIGenerateButton
                label="إضافة مدعوين آليًا"
                disabled={isSubmitting || isDeleting}
                onClick={() => setIsSuggestAttendeesModalOpen(true)}
              />
            </div>
          )}
        </div>

        {/* Section 3 — Suggested Participants (المقترحون) */}
        <div className="w-full flex flex-col gap-3">
          <h3 className="text-right text-[22px] font-bold text-[#101828]">
            المقترحون
          </h3>
          <p className="text-right text-[14px] text-[#667085]">
            المستخدمون الذين يتلقون إشعاراً دون إضافتهم كمدعوين (اختياري).
          </p>
          {proposerLoading ? (
            <p className="text-right text-[14px] text-[#667085]">جاري التحميل...</p>
          ) : (
            <div
              className={cn(
                'w-full border border-[#D0D5DD] rounded-lg overflow-hidden p-4',
                'bg-white max-h-[280px] overflow-y-auto'
              )}
            >
              {proposerUsers.length === 0 ? (
                <p className="text-right text-[14px] text-[#667085]">لا يوجد مستخدمون متاحون.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {proposerUsers.map((u) => {
                    const isChecked = selectedProposerGuids.has(u.object_guid);
                    return (
                      <li
                        key={u.object_guid}
                        className="flex items-center gap-3 justify-end cursor-pointer hover:bg-[#F9FAFB] rounded px-2 py-1.5 -mx-2"
                        onClick={() => toggleProposer(u.object_guid)}
                      >
                        <span className="text-[14px] text-[#344054]">
                          {u.label}
                          {u.email ? ` (${u.email})` : ''}
                        </span>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isChecked}
                          aria-label={u.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProposer(u.object_guid);
                          }}
                          className={cn(
                            'flex items-center justify-center shrink-0',
                            'w-5 h-5 rounded border-2 transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-[#008774] focus:ring-offset-2',
                            isChecked
                              ? 'bg-[#008774] border-[#008774]'
                              : 'bg-white border-[#D0D5DD] hover:border-[#008774]'
                          )}
                        >
                          {isChecked && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <ActionButtons
          onBack={handleBackClick}
          onCancel={handleCancelClick}
          onSaveDraft={handleSaveDraftClick}
          onNext={handleNextClick}
          nextLabel="أنشئ اجتماعك الآن"
          disabled={isSubmitting || isDeleting}
        />
      </div>
    </div>
  );
};