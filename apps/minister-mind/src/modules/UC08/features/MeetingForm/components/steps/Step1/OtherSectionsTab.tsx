import { type Dispatch, type SetStateAction } from 'react';
import { cn } from '@sanad-ai/ui';
import {
  FormTable,
  FormRow,
  FormSwitch,
  FileUpload,
} from '@shared';
import type { Step1FormData } from '../../../schemas/step1.schema';
import {
  MEETING_GOALS_COLUMNS,
  MINISTER_SUPPORT_COLUMNS,
  PREVIOUS_MEETING_COLUMNS,
  RELATED_DIRECTIVES_COLUMNS,
} from '../../../constants/step1.constants';
import { MeetingAgendaSection } from './sections';

export interface OtherSectionsTabProps {
  formData: Partial<Step1FormData>;
  errors: Partial<Record<keyof Step1FormData, string>>;
  tableErrors: Record<string, Record<string, string>>;
  tableTouched: Record<string, Record<string, boolean>>;
  setTableErrors: Dispatch<SetStateAction<Record<string, Record<string, string>>>>;
  setTableTouched: Dispatch<SetStateAction<Record<string, Record<string, boolean>>>>;
  handleChange: (field: keyof Step1FormData, value: unknown) => void;
  handleBlur: (field: keyof Step1FormData) => void;
  handleAddGoal: () => void;
  handleDeleteGoal: (id: string) => void;
  handleUpdateGoal: (id: string, field: string, value: unknown) => void;
  handleAddAgenda: () => void;
  handleDeleteAgenda: (id: string) => void;
  handleUpdateAgenda: (id: string, field: string, value: unknown) => void;
  handleAddSupport: () => void;
  handleDeleteSupport: (id: string) => void;
  handleUpdateSupport: (id: string, field: string, value: unknown) => void;
  handleAddPreviousMeeting: () => void;
  handleDeletePreviousMeeting: (id: string) => void;
  handleUpdatePreviousMeeting: (id: string, field: string, value: unknown) => void;
  handleAddDirective: () => void;
  handleDeleteDirective: (id: string) => void;
  handleUpdateDirective: (id: string, field: string, value: unknown) => void;
  isFieldRequired: (field: keyof Step1FormData) => boolean;
  disabled?: boolean;
}

/**
 * Other sections tab: goals, agenda, minister support, file uploads,
 * was discussed previously, previous meetings table, related directives table.
 * Disabled when Nature = Follow-up or Recurring (only Meeting Info tab editable).
 */
export function OtherSectionsTab({
  formData,
  errors,
  tableErrors,
  tableTouched,
  setTableErrors,
  setTableTouched,
  handleChange,
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
  isFieldRequired,
  disabled = false,
}: OtherSectionsTabProps) {
  return (
    <div className={cn('w-full max-w-full mx-auto px-4 sm:px-0 space-y-8 min-w-0', disabled && 'pointer-events-none opacity-60')}>
      <FileUpload
        label="العرض التقديمي"
        file={formData.presentationFile ?? null}
        onFileSelect={(file) => handleChange('presentationFile', file)}
        error={errors.presentationFile}
        required={isFieldRequired('presentationFile')}
        disabled={disabled}
      />
      <FileUpload
        label="مرفقات إضافية"
        file={formData.additionalAttachments ?? null}
        onFileSelect={(file) => handleChange('additionalAttachments', file)}
        error={errors.additionalAttachments}
        disabled={disabled}
      />

      <FormTable
        title="أهداف الاجتماع"
        required
        columns={MEETING_GOALS_COLUMNS}
        rows={formData.meetingGoals ?? []}
        onAddRow={handleAddGoal}
        onDeleteRow={handleDeleteGoal}
        onUpdateRow={handleUpdateGoal}
        addButtonLabel="إضافة هدف"
        errors={tableErrors}
        touched={tableTouched}
        errorMessage={
          errors.meetingGoals ??
          (Object.keys(tableErrors).length > 0 ? 'يجب إضافة هدف واحد على الأقل' : undefined)
        }
        disabled={disabled}
      />

      <MeetingAgendaSection
        value={formData.meetingAgenda}
        onChange={(rows) => handleChange('meetingAgenda', rows)}
        tableErrors={tableErrors}
        setTableErrors={setTableErrors}
        tableTouched={tableTouched}
        setTableTouched={setTableTouched}
        errorMessage={errors.meetingAgenda}
        required={isFieldRequired('meetingAgenda')}
        disabled={disabled}
      />

      <FormTable
        title="الدعم المطلوب من الوزير"
        required
        columns={MINISTER_SUPPORT_COLUMNS}
        rows={formData.ministerSupport ?? []}
        onAddRow={handleAddSupport}
        onDeleteRow={handleDeleteSupport}
        onUpdateRow={handleUpdateSupport}
        addButtonLabel="إضافة دعم"
        errors={tableErrors}
        touched={tableTouched}
        errorMessage={
          errors.ministerSupport ??
          (Object.keys(tableErrors).length > 0 ? 'يجب إضافة دعم واحد على الأقل' : undefined)
        }
        disabled={disabled}
      />

      <FormRow className="flex-wrap-reverse sm:flex-nowrap sm:justify-end">
        <FormSwitch
          checked={formData.wasDiscussedPreviously ?? false}
          onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
          label="هل تمت مناقشة الموضوع سابقًا؟"
          disabled={disabled}
        />
      </FormRow>

      {formData.wasDiscussedPreviously && (
        <FormTable
          title="تاريخ الاجتماع السابق"
          columns={PREVIOUS_MEETING_COLUMNS}
          rows={formData.previousMeetings ?? []}
          onAddRow={handleAddPreviousMeeting}
          onDeleteRow={handleDeletePreviousMeeting}
          onUpdateRow={handleUpdatePreviousMeeting}
          addButtonLabel="إضافة إجتماع سابق"
          errors={tableErrors}
          touched={tableTouched}
          disabled={disabled}
        />
      )}

      <FormTable
        title="التوجيه المرتبط"
        columns={RELATED_DIRECTIVES_COLUMNS}
        rows={formData.relatedDirectives ?? []}
        onAddRow={handleAddDirective}
        onDeleteRow={handleDeleteDirective}
        onUpdateRow={handleUpdateDirective}
        addButtonLabel="إضافة توجيه مرتبط"
        errors={tableErrors}
        touched={tableTouched}
        disabled={disabled}
      />
    </div>
  );
}
