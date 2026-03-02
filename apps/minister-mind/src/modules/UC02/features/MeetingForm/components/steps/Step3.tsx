import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { FormTable, ActionButtons, FormAsyncSelectV2, FormInput, type OptionType, type CustomCellRenderParams } from '@shared';
import { cn } from '@sanad-ai/ui';
import {
  INVITEES_TABLE_COLUMNS,
} from '../../utils/constants';
import type { Step3FormData } from '../../schemas/step3.schema';
import { getUsers, type UserApiResponse } from '../../../../data/usersApi';

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
  setProposerUserIds: (ids: string[]) => void;
  handleNextClick: () => void;
  handleSaveDraftClick: () => void;
  handleBackClick?: () => void;
  handleCancelClick: () => void;
  nonDeletableInviteeIds: string[];
}

interface ProposerUser {
  id: string;
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
  setProposerUserIds,
  handleNextClick,
  handleSaveDraftClick,
  handleBackClick,
  handleCancelClick,
  nonDeletableInviteeIds,
}) => {
  const [proposerUsers, setProposerUsers] = useState<ProposerUser[]>([]);
  const [proposerLoading, setProposerLoading] = useState(true);
  const userOptionsMapRef = useRef<Map<string, { value: string; label: string; position?: string; phone_number?: string; email?: string; sector?: string }>>(new Map());
  const searchInputByRowRef = useRef<Record<string, string>>({});

  const loadUserOptions = useCallback(async (search: string, skip: number, limit: number) => {
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        skip,
        limit,
      });
      const items = response.items.map((u: UserApiResponse) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.name || '';
        const position = u.position ?? (u as Record<string, unknown>).position_name ?? (u as Record<string, unknown>).job_title ?? '';
        const sector = (u as Record<string, unknown>).sector ?? (u as Record<string, unknown>).department_name ?? '';
        return {
          value: u.id,
          label: fullName,
          position: typeof position === 'string' ? position : '',
          phone_number: u.phone_number ?? '',
          email: u.email ?? '',
          sector: typeof sector === 'string' ? sector : '',
        };
      });
      items.forEach((o) => userOptionsMapRef.current.set(o.value, o));
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

      const userId = (row as { _userId?: string })._userId;
      const value: OptionType | null =
        userId && row.full_name
          ? { value: userId, label: row.full_name }
          : null;

      return (
        <FormAsyncSelectV2
          value={value}
          onValueChange={(opt) => {
            if (!opt) {
              onUpdateRow('full_name', '');
              onUpdateRow('position_title', '');
              onUpdateRow('mobile_number', '');
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              onUpdateRow('_isManual', false);
              onUpdateRow('_userId', '');
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
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              onUpdateRow('_userId', '');
              return;
            }
            const u = userOptionsMapRef.current.get(opt.value);
            if (u) {
              const existing = (formData.invitees ?? []).find(
                (inv) => inv.id !== row.id && (inv as { _userId?: string })._userId === u.value
              );
              if (existing) return;
              onUpdateRow('_userId', u.value);
              onUpdateRow('_isManual', false);
              onUpdateRow('full_name', u.label);
              onUpdateRow('position_title', u.position ?? '');
              onUpdateRow('mobile_number', u.phone_number ?? '');
              onUpdateRow('sector', u.sector ?? '');
              onUpdateRow('email', u.email ?? '');
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
          onInputChange={(newValue) => {
            searchInputByRowRef.current[row.id] = newValue;
          }}
        />
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

      const userId = (row as { _userId?: string })._userId;
      const value: OptionType | null =
        userId && row.full_name
          ? { value: userId, label: row.full_name }
          : null;

      return (
        <FormAsyncSelectV2
          value={value}
          onValueChange={(opt) => {
            if (!opt) {
              onUpdateRow('full_name', '');
              onUpdateRow('position_title', '');
              onUpdateRow('mobile_number', '');
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              onUpdateRow('_isManual', false);
              onUpdateRow('_userId', '');
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
              onUpdateRow('sector', '');
              onUpdateRow('email', '');
              onUpdateRow('_userId', '');
              return;
            }
            const u = userOptionsMapRef.current.get(opt.value);
            if (u) {
              const existing = (formData.minister_invitees ?? []).find(
                (inv) => inv.id !== row.id && (inv as { _userId?: string })._userId === u.value
              );
              if (existing) return;
              onUpdateRow('_userId', u.value);
              onUpdateRow('_isManual', false);
              onUpdateRow('full_name', u.label);
              onUpdateRow('position_title', u.position ?? '');
              onUpdateRow('mobile_number', u.phone_number ?? '');
              onUpdateRow('sector', u.sector ?? '');
              onUpdateRow('email', u.email ?? '');
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
          onInputChange={(newValue) => {
            searchInputByRowRef.current[row.id] = newValue;
          }}
        />
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
          res.items.map((u) => ({
            id: u.id,
            label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.name || u.id,
            email: u.email,
          }))
        );
      })
      .catch(() => setProposerUsers([]))
      .finally(() => setProposerLoading(false));
  }, []);

  const selectedProposerIds = new Set(formData.proposer_user_ids ?? []);
  const toggleProposer = useCallback(
    (userId: string) => {
      const current = formData.proposer_user_ids ?? [];
      const next = current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
      setProposerUserIds(next);
    },
    [formData.proposer_user_ids, setProposerUserIds]
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

        <FormTable
          title='مدعوو الوزير'
          columns={INVITEES_TABLE_COLUMNS}
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
                    const isChecked = selectedProposerIds.has(u.id);
                    return (
                      <li
                        key={u.id}
                        className="flex items-center gap-3 justify-end cursor-pointer hover:bg-[#F9FAFB] rounded px-2 py-1.5 -mx-2"
                        onClick={() => toggleProposer(u.id)}
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
                            toggleProposer(u.id);
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