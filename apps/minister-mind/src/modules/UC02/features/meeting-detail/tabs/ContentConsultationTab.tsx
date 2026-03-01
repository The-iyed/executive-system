/**
 * Content consultation tab – استشارة المحتوى (التوجيهات، الملخص التنفيذي، الملاحظات).
 * Uses same file card component as tab المحتوى (ContentTabFileCard from Mou7tawaContentTab).
 */
import React from 'react';
import { DataTable, ContentTabFileCard, type ContentTabFileItem } from '@shared';

/** Normalize content_approval_directives: API may return string[] or object[] (e.g. { id, title, due_date, assignees, status }). */
function normalizeDirectivesToRows(
  raw: string[] | Array<{ title?: string; text?: string; [key: string]: unknown }> | undefined
): Array<{ text: string }> {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') return { text: item };
    if (item && typeof item === 'object') {
      const t = (item as { title?: string; text?: string }).title ?? (item as { text?: string }).text;
      if (t != null && typeof t === 'string') return { text: t };
    }
    return { text: String(item) };
  });
}

export interface ContentConsultationTabProps {
  isLoading: boolean;
  meeting?: {
    content_approval_directives?: string[] | Array<{ id?: string; title?: string; due_date?: string; assignees?: unknown; status?: string; [key: string]: unknown }>;
    executive_summary?: string | null;
    attachments?: Array<{ id: string; file_name: string; file_type?: string; file_size?: number; blob_url: string; is_executive_summary?: boolean }>;
    content_officer_notes?: unknown;
  } | undefined;
  contentOfficerNotesRecords?: { items: Array<{ note_type?: string; text?: string; note_answer?: string }> };
  onPreviewAttachment?: (att: { blob_url: string; file_name: string; file_type?: string }) => void;
}

export function ContentConsultationTab({
  isLoading,
  meeting,
  contentOfficerNotesRecords,
  onPreviewAttachment,
}: ContentConsultationTabProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full" dir="rtl">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  const textSummary =
    meeting?.executive_summary != null && String(meeting.executive_summary).trim() !== ''
      ? String(meeting.executive_summary)
      : contentOfficerNotesRecords?.items?.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY')
        ? (contentOfficerNotesRecords.items.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY') as any)?.text ?? (contentOfficerNotesRecords.items.find((n: any) => n?.note_type === 'SUMMARY' || n?.note_type === 'EXECUTIVE_SUMMARY') as any)?.note_answer ?? ''
        : '';
  const executiveSummaryAttachments = (meeting?.attachments ?? []).filter((a) => a.is_executive_summary === true);
  const hasContent = textSummary || executiveSummaryAttachments.length > 0;

  const notesDisplay = (() => {
    const raw: unknown = meeting?.content_officer_notes;
    if (raw == null) return '—';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw.map((n: any) => (n && typeof n === 'object' && typeof n.text === 'string' ? n.text : String(n?.text ?? '')).trim()).filter(Boolean).join('\n\n') || '—';
    if (typeof raw === 'object' && raw !== null && 'text' in raw) return (raw as { text?: string }).text ?? '—';
    return '—';
  })();

  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      {meeting?.content_approval_directives && meeting.content_approval_directives.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-700 text-right">التوجيهات المرتبطة بالاجتماع</h3>
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
            <DataTable
              columns={[
                { id: 'index', header: '#', width: 'w-20', align: 'center', render: (_: { text: string }, i: number) => <span className="text-sm text-[#475467]">{i + 1}</span> },
                { id: 'text', header: 'نص التوجيه', width: 'flex-1', align: 'end', render: (row: { text: string }) => <span className="text-sm text-[#475467]">{row.text}</span> },
              ]}
              data={normalizeDirectivesToRows(meeting.content_approval_directives)}
              rowPadding="py-3"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 text-right">الملخص التنفيذي</h3>
        {!hasContent ? (
          <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap">—</div>
        ) : (
          <>
            {textSummary ? (
              <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap">{textSummary}</div>
            ) : null}
            {executiveSummaryAttachments.length > 0 && (
              <div className="space-y-3">
                {executiveSummaryAttachments.map((att) => {
                  const fileItem: ContentTabFileItem = {
                    id: att.id,
                    file_name: att.file_name,
                    file_size: att.file_size ?? 0,
                    file_type: att.file_type ?? '',
                    blob_url: att.blob_url,
                  };
                  return (
                    <ContentTabFileCard
                      key={att.id}
                      file={fileItem}
                      variant="default"
                      readOnly
                      onView={onPreviewAttachment ? () => onPreviewAttachment({ blob_url: att.blob_url, file_name: att.file_name, file_type: att.file_type }) : fileItem.blob_url ? () => window.open(fileItem.blob_url!, '_blank') : undefined}
                      onDownload={fileItem.blob_url ? () => {} : undefined}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-700 text-right">الملاحظات</h3>
        <div className="w-full min-h-16 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-right text-[#475467] whitespace-pre-wrap">{notesDisplay}</div>
      </div>
    </div>
  );
}
