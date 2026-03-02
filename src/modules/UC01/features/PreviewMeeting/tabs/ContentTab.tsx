import React from 'react';
import type { MeetingApiResponse, Attachment } from '../../../../UC02/data/meetingsApi';
import { formatDateArabic } from '@/modules/shared/utils';
import { MeetingStatus } from '@/modules/shared/types';
import { Mou7tawaContentTab, type ContentTabFileItem } from '@/modules/shared/components';

/** Meeting may include presentation timing from API */
type MeetingWithContent = MeetingApiResponse & {
  when_presentation_attached?: string | null;
  presentation_attachment_timing?: string | null;
};

interface ContentTabProps {
  meeting: MeetingApiResponse;
  /** When provided, Eye opens this (e.g. drawer) instead of new tab */
  onPreviewAttachment?: (att: { blob_url: string; file_name: string; file_type?: string }) => void;
}

function toFileItem(att: Attachment): ContentTabFileItem {
  return {
    id: att.id,
    file_name: att.file_name,
    file_size: att.file_size ?? 0,
    file_type: att.file_type ?? '',
    blob_url: att.blob_url ?? null,
  };
}

export const ContentTab: React.FC<ContentTabProps> = ({ meeting, onPreviewAttachment }) => {
  const m = meeting as MeetingWithContent;
  const attachments = meeting.attachments ?? [];
  const presentationFiles = attachments.filter((a) => a.is_presentation).map(toFileItem);
  const optionalFiles = attachments.filter((a) => a.is_additional).map(toFileItem);
  const attachmentTiming = m.when_presentation_attached ?? m.presentation_attachment_timing ?? '';
  const showContentOfficerNotes =
    meeting.status === MeetingStatus.RETURNED_FROM_CONTENT && meeting.content_officer_notes;

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      <Mou7tawaContentTab
        presentationFiles={presentationFiles}
        optionalFiles={optionalFiles}
        attachmentTimingValue={attachmentTiming ?? ''}
        notesValue=""
        contentOfficerNotes={showContentOfficerNotes ? meeting.content_officer_notes ?? null : null}
        readOnly
        formatDate={formatDateArabic}
        onView={(file) => {
          if (!file.blob_url) return;
          if (onPreviewAttachment) {
            onPreviewAttachment({ blob_url: file.blob_url, file_name: file.file_name, file_type: file.file_type });
          } else {
            window.open(file.blob_url, '_blank');
          }
        }}
        onDownload={(file) => file.blob_url && window.open(file.blob_url, '_blank')}
      />
    </div>
  );
};
