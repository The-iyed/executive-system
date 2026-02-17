import React, { useCallback, useEffect, useState } from 'react';
import { FormTable, ActionButtons } from '@shared';
import {
  INVITEES_TABLE_COLUMNS,
  INVITEES_TABLE_TITLE,
  ADD_INVITEE_BUTTON_LABEL,
  MINISTER_INVITEES_TABLE_TITLE,
  ADD_MINISTER_INVITEE_BUTTON_LABEL,
} from '../../utils/constants';
import type { Step3FormData } from '../../schemas/step3.schema';
import { getUsers } from '../../../../data/usersApi';
import { cn } from '@sanad-ai/ui';

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
  handleCancelClick,
  nonDeletableInviteeIds,
}) => {
  const [proposerUsers, setProposerUsers] = useState<ProposerUser[]>([]);
  const [proposerLoading, setProposerLoading] = useState(true);

  useEffect(() => {
    getUsers({ limit: 200 })
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
          title={INVITEES_TABLE_TITLE}
          required
          columns={INVITEES_TABLE_COLUMNS}
          rows={inviteeRows}
          onAddRow={handleAddInvitee}
          onDeleteRow={handleDeleteInvitee}
          onUpdateRow={handleUpdateInvitee}
          addButtonLabel={ADD_INVITEE_BUTTON_LABEL}
          errors={errors}
          touched={touched}
          errorMessage={inviteesTableError}
          nonDeletableRowIds={nonDeletableInviteeIds}
          emptyStateMessage="أضف مدعوياً واحداً على الأقل (مالك الاجتماع يُضاف تلقائياً)"
        />

        <FormTable
          title={MINISTER_INVITEES_TABLE_TITLE}
          columns={INVITEES_TABLE_COLUMNS}
          rows={ministerRows}
          onAddRow={handleAddMinisterInvitee}
          onDeleteRow={handleDeleteMinisterInvitee}
          onUpdateRow={handleUpdateMinisterInvitee}
          addButtonLabel={ADD_MINISTER_INVITEE_BUTTON_LABEL}
          errors={errors}
          touched={touched}
          emptyStateMessage="لا يوجد مدعوون من الوزير"
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
                  {proposerUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 justify-end cursor-pointer hover:bg-[#F9FAFB] rounded px-2 py-1.5 -mx-2"
                      onClick={() => toggleProposer(u.id)}
                    >
                      <span className="text-[14px] text-[#344054]">
                        {u.label}
                        {u.email ? ` (${u.email})` : ''}
                      </span>
                      <Checkbox
                        checked={selectedProposerIds.has(u.id)}
                        onCheckedChange={() => toggleProposer(u.id)}
                        aria-label={u.label}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <ActionButtons
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
