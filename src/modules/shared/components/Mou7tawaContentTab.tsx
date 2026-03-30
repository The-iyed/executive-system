/**
 * Shared "المحتوى" (mou7tawa) tab UI: presentation, optional attachments, date, notes.
 * Layout: bordered sections, file cards with View/Download/Delete, dashed add button, date input with calendar icon.
 */
import React from 'react';
import { Plus, Trash2, Eye, Download, FileText, Calendar } from 'lucide-react';
import { Input, Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/ui';
import pdfIcon from '../assets/pdf.svg';

const fontStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

export interface ContentTabFileItem {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  blob_url?: string | null;
  /** Optional label e.g. "محضر الاجتماع السابق" for previous meeting minutes */
  badge?: string | null;
}

function getFileTypeKey(fileType: string | undefined, fileName: string | undefined): string {
  const n = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  if (n === 'pdf' || n === 'application/pdf') return 'pdf';
  if (['doc', 'docx'].includes(n) || n.includes('msword') || n.includes('word')) return 'word';
  if (['xls', 'xlsx'].includes(n) || n.includes('excel')) return 'excel';
  const ext = (fileName ?? '').toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext ?? '')) return 'word';
  if (['xls', 'xlsx'].includes(ext ?? '')) return 'excel';
  return 'file';
}

function FileIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const key = getFileTypeKey(fileType, fileName);
  if (key === 'pdf') {
    return <img src={pdfIcon} alt="pdf" className="h-10 w-10 object-contain flex-shrink-0" />;
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#E2E5E7] flex-shrink-0">
      <FileText className="h-5 w-5 text-[#B04135]" />
    </div>
  );
}

function FileCard({
  file,
  variant = 'default',
  onDelete,
  onView,
  onDownload,
  onCompare,
  compareDisabled,
  compareDisabledReason,
  onAiNotes,
  aiNotesDisabled,
  readOnly,
}: {
  file: ContentTabFileItem;
  variant?: 'presentation' | 'default';
  onDelete?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  onCompare?: () => void;
  compareDisabled?: boolean;
  compareDisabledReason?: string;
  /** ملاحظات بالذكاء الاصطناعي (presentation only) */
  onAiNotes?: () => void;
  aiNotesDisabled?: boolean;
  readOnly?: boolean;
}) {
  const borderClass = variant === 'presentation' ? 'border-[#009883]/40' : 'border-[#E4E7EC]';
  return (
    <div
      className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 ${borderClass}`}
      dir="rtl"
      style={fontStyle}
    >
      <FileIcon fileType={file.file_type} fileName={file.file_name} />
      <div className="flex-1 min-w-0 text-right">
        {file.badge && (
          <p className="text-[10px] font-medium text-[#009883] bg-[#009883]/10 px-2 py-0.5 rounded-full inline-block mb-1">
            {file.badge}
          </p>
        )}
        <p className="text-sm font-medium text-[#344054] truncate">{file.file_name}</p>
        <p className="text-xs text-[#667085]">{Math.round((file.file_size || 0) / 1024)} KB</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 flex-shrink-0 max-w-full">
        {onCompare !== undefined && (
          compareDisabled && compareDisabledReason ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1.5 rounded text-xs font-medium text-[#009883] bg-[#009883]/10 opacity-50 cursor-not-allowed"
                  >
                    مقارنة بالذكاء الاصطناعي
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{compareDisabledReason}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onCompare}
              className="px-2 py-1.5 rounded text-xs font-medium text-[#009883] bg-[#009883]/10 hover:bg-[#009883]/20 transition-colors"
            >
              مقارنة بالذكاء الاصطناعي
            </button>
          )
        )}
        {variant === 'presentation' && onAiNotes && (
          <button
            type="button"
            onClick={onAiNotes}
            disabled={aiNotesDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-l from-[#048F86] to-[#34C3BA] shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            ملاحظات بالذكاء الاصطناعي
          </button>
        )}
        {onDownload && file.blob_url && (
          <a
            href={file.blob_url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-[#F2F4F7] transition-colors text-[#009883]"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        {onView && file.blob_url && (
          <button
            type="button"
            onClick={onView}
            className="p-1.5 rounded hover:bg-[#F2F4F7] transition-colors text-[#009883]"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {!readOnly && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 transition-colors text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Exported for reuse in other tabs (e.g. استشارة المحتوى) – same file card as tab المحتوى */
export { FileCard as ContentTabFileCard };

function AddFileButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-2 border-dashed border-[#009883]/40 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium text-[#009883] hover:bg-[#009883]/5 transition-colors"
      style={fontStyle}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

export interface Mou7tawaContentTabProps {
  /** Presentation file(s) – usually one card or list */
  presentationFiles: ContentTabFileItem[];
  /** Optional attachments */
  optionalFiles: ContentTabFileItem[];
  /** "متى سيتم إرفاق العرض؟" value (display or controlled) */
  attachmentTimingValue?: string;
  /** Notes (controlled when editable) */
  notesValue?: string;
  /** Content officer notes (read-only, shown below notes when present) */
  contentOfficerNotes?: string | null;
  readOnly?: boolean;
  onView?: (file: ContentTabFileItem) => void;
  onDownload?: (file: ContentTabFileItem) => void;
  onDelete?: (file: ContentTabFileItem) => void;
  onAddPresentation?: () => void;
  onAddOptional?: () => void;
  onAttachmentTimingChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  /** Optional: format date for display when read-only */
  formatDate?: (value: string) => string;
  /** When provided, compare button is shown on every presentation file. When false, button is disabled and compareDisabledReason is shown on hover. */
  compareEnabledForPresentation?: (file: ContentTabFileItem, index: number, total: number) => boolean;
  /** Reason shown on hover when compare button is disabled. */
  compareDisabledReason?: (file: ContentTabFileItem, index: number, total: number) => string;
  onComparePresentation?: (file: ContentTabFileItem) => void;
  /** فتح ملاحظات الذكاء الاصطناعي على العرض (مسؤول المحتوى وغيره) */
  onAiNotesPresentation?: (file: ContentTabFileItem) => void;
  aiNotesPending?: boolean;
}

export function Mou7tawaContentTab({
  presentationFiles,
  optionalFiles,
  attachmentTimingValue = '',
  notesValue = '',
  contentOfficerNotes,
  readOnly = true,
  onView,
  onDownload,
  onDelete,
  onAddPresentation,
  onAddOptional,
  onAttachmentTimingChange,
  onNotesChange,
  formatDate,
  compareEnabledForPresentation,
  compareDisabledReason,
  onComparePresentation,
  onAiNotesPresentation,
  aiNotesPending = false,
}: Mou7tawaContentTabProps) {
  const displayDate = readOnly && formatDate && attachmentTimingValue ? formatDate(attachmentTimingValue) : attachmentTimingValue;

  return (
    <div className="space-y-6" dir="rtl" style={fontStyle}>
      {/* العرض التقديمي */}
      <div className="border border-[#EAECF0] rounded-xl p-5 space-y-4">
        <h3 className="text-base font-bold text-[#101828] text-center">العرض التقديمي</h3>

        {presentationFiles.length > 0 ? (
          <div className="space-y-3">
            {presentationFiles.map((file, index) => {
              const total = presentationFiles.length;
              const enabled = compareEnabledForPresentation?.(file, index, total) ?? true;
              const disabledReason = compareDisabledReason?.(file, index, total);
              return (
                <FileCard
                  key={file.id}
                  file={file}
                  variant="presentation"
                  onView={onView ? () => onView(file) : undefined}
                  onDownload={onDownload ? () => onDownload(file) : undefined}
                  onDelete={onDelete ? () => onDelete(file) : undefined}
                  onCompare={onComparePresentation ? () => onComparePresentation(file) : undefined}
                  compareDisabled={onComparePresentation ? !enabled : undefined}
                  compareDisabledReason={disabledReason}
                  onAiNotes={
                    onAiNotesPresentation ? () => onAiNotesPresentation(file) : undefined
                  }
                  aiNotesDisabled={aiNotesPending}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        ) : null}

        {!readOnly && <AddFileButton label="إضافة عرض تقديمي" onClick={onAddPresentation} />}

        {/* متى سيتم إرفاق العرض؟ */}
        {/* <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#344054] text-right block">متى سيتم إرفاق العرض؟</label>
          <div className="relative">
            {readOnly ? (
              <div className="w-full min-h-10 px-4 py-2.5 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] text-right text-[#475467] flex items-center">
                {displayDate || '—'}
              </div>
            ) : (
              <>
                <Input
                  type="text"
                  value={attachmentTimingValue}
                  onChange={(e) => onAttachmentTimingChange?.(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="text-right pr-4 pl-10 w-full h-10 border border-[#D0D5DD] rounded-lg"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
              </>
            )}
          </div>
        </div> */}
      </div>

      {/* مرفقات اختيارية */}
      <div className="border border-[#EAECF0] rounded-xl p-5 space-y-4">
        <h3 className="text-base font-bold text-[#101828] text-center">مرفقات اختيارية</h3>

        {optionalFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optionalFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onView={onView ? () => onView(file) : undefined}
                onDownload={onDownload ? () => onDownload(file) : undefined}
                onDelete={onDelete ? () => onDelete(file) : undefined}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
            <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-[#9CA3AF]" strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#374151]">لا توجد مرفقات اختيارية</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">لم تتم إضافة مرفقات</p>
            </div>
          </div>
        )}

        {!readOnly && <AddFileButton label="إضافة مرفق" onClick={onAddOptional} />}
      </div>

      {/* ملاحظات */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#344054] text-right block">ملاحظات</label>
        {readOnly ? (
          <div className="min-h-[120px] px-4 py-3 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] text-right text-[#475467] whitespace-pre-wrap">
            {notesValue || '—'}
          </div>
        ) : (
          <Textarea
            value={notesValue}
            onChange={(e) => onNotesChange?.(e.target.value)}
            className="min-h-[120px] text-right resize-none border border-[#D0D5DD] rounded-lg"
            placeholder="أضف ملاحظاتك هنا..."
          />
        )}
        {contentOfficerNotes && contentOfficerNotes?.trim?.() && (
          <div className="mt-2 min-h-[80px] px-4 py-3 rounded-lg border border-[#E4E7EC] bg-amber-50/50 text-right text-[#475467] whitespace-pre-wrap text-sm">
            <span className="font-medium text-[#344054] block mb-1">ملاحظات مسؤول المحتوى</span>
            {contentOfficerNotes}
          </div>
        )}
      </div>
    </div>
  );
}
