import React from 'react';
import type { MeetingApiResponse, Attachment } from '../../../../UC02/data/meetingsApi';
import { MeetingPreviewCard } from '../MeetingPreviewCard';
import { MeetingStatus } from '@shared/types';
import pdfIcon from '../../../../shared/assets/pdf.svg';

/** Meeting may include presentation timing from API */
type MeetingWithContent = MeetingApiResponse & {
  when_presentation_attached?: string | null;
  presentation_attachment_timing?: string | null;
};

interface ContentTabProps {
  meeting: MeetingApiResponse;
}

function formatAttachmentTiming(value: string | null | undefined): string {
  if (!value || value.trim() === '') return 'غير محدد';
  const trimmed = value.trim();
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return trimmed;
}

/** Normalize file_type (e.g. "PDF", ".pdf", "application/pdf") or extension from file_name */
function getFileTypeKey(fileType: string | undefined, fileName: string | undefined): string {
  const normalized = (fileType ?? '')
    .toLowerCase()
    .replace(/^\./, '')
    .trim();
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
    return (
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E8E5E5] flex items-center justify-center overflow-hidden">
        <img src={pdfIcon} alt="PDF" className="w-6 h-6 object-contain" />
      </div>
    );
  }
  if (key === 'word') {
    return (
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#2B579A] flex items-center justify-center">
        <span className="text-white text-[10px] font-bold">DOC</span>
      </div>
    );
  }
  if (key === 'excel') {
    return (
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#217346] flex items-center justify-center">
        <span className="text-white text-[10px] font-bold">XLS</span>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#667085] flex items-center justify-center">
      <span className="text-white text-[10px] font-bold">FILE</span>
    </div>
  );
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes == null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AttachmentItem({ att }: { att: Attachment }) {
  const href = att.blob_url || '#';
  const isLink = !!att.blob_url;
  const label = att.file_name || 'مرفق';
  const sizeStr = formatFileSize(att.file_size);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E6E6E6] hover:border-[#048F86]/40 transition-colors">
      <FileTypeIcon fileType={att.file_type} fileName={att.file_name} />
      <div className="flex-1 min-w-0 text-right">
        {isLink ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#048F86] hover:underline break-all block"
          >
            {label}
          </a>
        ) : (
          <span className="text-sm font-medium text-[#101828] break-all block">{label}</span>
        )}
        {sizeStr && (
          <span className="text-xs text-[#667085]">{sizeStr}</span>
        )}
      </div>
    </div>
  );
}

export const ContentTab: React.FC<ContentTabProps> = ({ meeting }) => {
  const m = meeting as MeetingWithContent;
  const attachments = meeting.attachments ?? [];
  const presentationAttachments = attachments.filter((a) => a.is_presentation);
  const additionalAttachments = attachments.filter((a) => a.is_additional);
  const attachmentTiming =
    m.when_presentation_attached ?? m.presentation_attachment_timing ?? null;
  const showContentOfficerNotes =
    meeting.status === MeetingStatus.RETURNED_FROM_CONTENT_MANAGER &&
    meeting.content_officer_notes;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-center">
        <MeetingPreviewCard title="العرض التقديمي:">
          {presentationAttachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {presentationAttachments.map((att) => (
                <AttachmentItem key={att.id} att={att} />
              ))}
            </div>
          ) : (
            <div>• لا يوجد عرض تقديمي</div>
          )}
        </MeetingPreviewCard>

        <MeetingPreviewCard title="متى سيتم إرفاق العرض؟:">
          <div>• {formatAttachmentTiming(attachmentTiming ?? undefined)}</div>
        </MeetingPreviewCard>
      </div>

      <div className="flex gap-4 justify-center">
        <MeetingPreviewCard title="مرفقات اختيارية:">
          {additionalAttachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {additionalAttachments.map((att) => (
                <AttachmentItem key={att.id} att={att} />
              ))}
            </div>
          ) : (
            <div>• لا توجد مرفقات اختيارية</div>
          )}
        </MeetingPreviewCard>

        {showContentOfficerNotes && (
          <MeetingPreviewCard title="ملاحظات:">
            <div className="whitespace-pre-wrap">
              {meeting.content_officer_notes}
            </div>
          </MeetingPreviewCard>
        )}
      </div>
    </div>
  );
};
