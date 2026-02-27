/**
 * Content consultation tab – استشارة المحتوى (التوجيهات، الملخص التنفيذي، الملاحظات).
 */
import React from 'react';
import { Download, Eye } from 'lucide-react';
import { DataTable } from '@shared';

export interface ContentConsultationTabProps {
  isLoading: boolean;
  meeting: {
    content_approval_directives?: string[];
    executive_summary?: string | null;
    attachments?: Array<{ id: string; file_name: string; file_type?: string; file_size?: number; blob_url: string; is_executive_summary?: boolean }>;
    content_officer_notes?: unknown;
  } | undefined;
  contentOfficerNotesRecords?: { items: Array<{ note_type?: string; text?: string; note_answer?: string }> };
  pdfIcon: string;
}

export function ContentConsultationTab({
  isLoading,
  meeting,
  contentOfficerNotesRecords,
  pdfIcon,
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
              data={meeting.content_approval_directives.map((text) => ({ text }))}
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
              <div className="flex flex-row gap-4 flex-wrap">
                {executiveSummaryAttachments.map((att) => (
                  <div key={att.id} className="flex flex-row items-center px-3 py-2 gap-3 h-[56px] bg-white border border-gray-300 rounded-xl">
                    {att.file_type?.toLowerCase() === 'pdf' ? (
                      <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-[#E2E5E7] rounded-md flex items-center justify-center text-xs font-semibold text-[#B04135]">{att.file_type?.toUpperCase() || ''}</div>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-[#344054]">{att.file_name}</span>
                      <span className="text-xs text-[#475467]">{Math.round((att.file_size || 0) / 1024)} KB</span>
                    </div>
                    <div className="flex items-center gap-2 mr-auto">
                      <a href={att.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[rgba(0,152,131,0.1)]" title="تحميل"><Download className="w-4 h-4 text-[#009883]" /></a>
                      <button type="button" onClick={() => window.open(att.blob_url, '_blank')} className="p-2 rounded-lg hover:bg-gray-100" title="معاينة"><Eye className="w-4 h-4 text-[#475467]" /></button>
                    </div>
                  </div>
                ))}
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
