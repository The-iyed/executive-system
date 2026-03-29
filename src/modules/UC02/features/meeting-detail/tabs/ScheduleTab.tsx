/**
 * Schedule tab – إعدادات الجدولة + قائمة المدعوين (read-only).
 * Shown only for schedule officers (UC-02).
 */
import { CalendarMinus } from 'lucide-react';
import { FormField, FormSwitch, FormTextArea } from '@/modules/shared';
import { InviteesTableForm } from '@/modules/shared/features/invitees-table-form';

export interface ScheduleFormData {
  requires_protocol: boolean;
  is_data_complete: boolean;
  notes: string;
}

export interface ScheduleTabProps {
  scheduleForm: ScheduleFormData;
  onScheduleFormChange: (updates: Partial<ScheduleFormData>) => void;
  invitees: any;
  validationError?: string | null;
  scheduleMutationSuccess?: boolean;
}

export function ScheduleTab({
  scheduleForm,
  onScheduleFormChange,
  invitees,
  validationError,
  scheduleMutationSuccess,
}: ScheduleTabProps) {
  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
          <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
            <CalendarMinus className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
          </div>
          <h2 className="text-[15px] font-bold text-[#1F2937]">إعدادات الجدولة</h2>
          <div className="mr-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => onScheduleFormChange({ requires_protocol: !scheduleForm.requires_protocol })}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                ${!scheduleForm.requires_protocol
                  ? 'bg-[#048F86]/10 text-[#048F86] border-[#048F86]/30'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              مبدئي
            </button>
            <button
              type="button"
              onClick={() => onScheduleFormChange({ is_data_complete: !scheduleForm.is_data_complete })}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                ${scheduleForm.is_data_complete
                  ? 'bg-[#048F86]/10 text-[#048F86] border-[#048F86]/30'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              البيانات مكتملة
            </button>
          </div>
        </div>
        <div className="p-6">
          {validationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-right text-sm text-red-600">{validationError}</p>
            </div>
          )}
          {scheduleMutationSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-right text-sm text-green-600">تم جدولة الاجتماع بنجاح</p>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <FormTextArea
              label="ملاحظات"
              value={scheduleForm.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onScheduleFormChange({ notes: e.target.value })
              }
              placeholder="Meeting scheduled successfully"
              containerClassName="!px-0 !mx-0"
              fullWidth={false}
            />
          </div>
        </div>
        <InviteesTableForm initialInvitees={invitees} mode="view" />
      </section>
    </div>
  );
}
