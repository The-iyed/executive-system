import React from 'react';
import type { MeetingApiResponse, Attachment } from '../../../../UC02/data/meetingsApi';
import { formatDateArabic } from '@shared/utils';
import { MeetingStatus } from '@shared/types';
import pdfIcon from '../../../../shared/assets/pdf.svg';

/** Meeting may include presentation timing from API */
type MeetingWithContent = MeetingApiResponse & {
  when_presentation_attached?: string | null;
  presentation_attachment_timing?: string | null;
};

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

interface ContentTabProps {
  meeting: MeetingApiResponse;
}

function formatAttachmentTiming(value: string | null | undefined): string {
  if (!value || String(value).trim() === '') return '-';
  const trimmed = String(value).trim();
  const formatted = formatDateArabic(trimmed);
  return formatted || trimmed;
}

function getFileTypeKey(fileType: string | undefined, fileName: string | undefined): string {
  const normalized = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  if (normalized === 'pdf' || normalized === 'application/pdf') return 'pdf';
  if (['doc', 'docx'].includes(normalized) || normalized.includes('msword') || normalized.includes('word')) return 'word';
  if (['xls', 'xlsx'].includes(normalized) || normalized.includes('excel') || normalized.includes('spreadsheet')) return 'excel';
  const ext = (fileName ?? '').toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext ?? '')) return 'word';
  if (['xls', 'xlsx'].includes(ext ?? '')) return 'excel';
  return 'file';
}

function FileTypeIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const key = getFileTypeKey(fileType, fileName);
  if (key === 'pdf') {
    return <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" />;
  }
  return (
    <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">
      {(fileType ?? '').toUpperCase() || (fileName ?? '').split('.').pop()?.toUpperCase() || 'FILE'}
    </div>
  );
}

function PresentationAttachmentRow({ att }: { att: Attachment }) {
  return (
    <div className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-[#009883] rounded-xl">
      <FileTypeIcon fileType={att.file_type} fileName={att.file_name} />
      <div className="flex flex-col items-end flex-1 min-w-0">
        <span className="text-sm font-medium text-[#344054]" style={fontStyle}>{att.file_name}</span>
        <span className="text-xs text-[#475467]" style={fontStyle}>{Math.round((att.file_size || 0) / 1024)} KB</span>
      </div>
      {att.blob_url && (
        <a href={att.blob_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)] text-[#009883]">
          تحميل
        </a>
      )}
    </div>
  );
}

function OptionalAttachmentRow({ att }: { att: Attachment }) {
  return (
    <div className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-gray-300 rounded-xl">
      <FileTypeIcon fileType={att.file_type} fileName={att.file_name} />
      <div className="flex flex-col items-end flex-1 min-w-0">
        <span className="text-sm font-medium text-[#344054]" style={fontStyle}>{att.file_name}</span>
        <span className="text-xs text-[#475467]" style={fontStyle}>{Math.round((att.file_size || 0) / 1024)} KB</span>
      </div>
      {att.blob_url && (
        <a href={att.blob_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-[#475467]">
          تحميل
        </a>
      )}
    </div>
  );
}

export const ContentTab: React.FC<ContentTabProps> = ({ meeting }) => {
  const m = meeting as MeetingWithContent;
  const attachments = meeting.attachments ?? [];
  const presentationAttachments = attachments.filter((a) => a.is_presentation);
  const additionalAttachments = attachments.filter((a) => a.is_additional);
  const attachmentTiming = m.when_presentation_attached ?? m.presentation_attachment_timing ?? null;
  const showContentOfficerNotes =
    meeting.status === MeetingStatus.RETURNED_FROM_CONTENT && meeting.content_officer_notes;

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700" style={fontStyle}>العرض التقديمي</label>
        <div className="flex flex-row gap-4 flex-wrap">
          {presentationAttachments.length > 0 ? (
            presentationAttachments.map((att) => (
              <PresentationAttachmentRow key={att.id} att={att} />
            ))
          ) : (
            <p className="text-[#667085] text-sm py-2" style={fontStyle}>لا يوجد عرض تقديمي</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700" style={fontStyle}>متى سيتم إرفاق العرض؟</label>
        <div className="w-full h-11 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467]" style={fontStyle}>
          {formatAttachmentTiming(attachmentTiming ?? undefined)}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700" style={fontStyle}>مرفقات اختيارية</label>
        <div className="flex flex-row gap-4 flex-wrap">
          {additionalAttachments.length > 0 ? (
            additionalAttachments.map((att) => (
              <OptionalAttachmentRow key={att.id} att={att} />
            ))
          ) : (
            <p className="text-[#667085] text-sm py-2" style={fontStyle}>لا توجد مرفقات اختيارية</p>
          )}
        </div>
      </div>
      {showContentOfficerNotes && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700" style={fontStyle}>ملاحظات</label>
          <div className="w-full min-h-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap" style={fontStyle}>
            {meeting.content_officer_notes}
          </div>
        </div>
      )}
    </div>
  );
};
