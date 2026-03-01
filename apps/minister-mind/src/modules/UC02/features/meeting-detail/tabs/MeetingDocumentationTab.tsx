/**
 * Meeting documentation tab – توثيق الاجتماع (محضر من API، التوجيهات المرتبطة من API).
 * Uses GET /api/v1/adam-meetings/search/{title} for محضر الاجتماع (mom_pdf_base64) and actions.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, AttachmentPreviewDrawer, type AttachmentPreviewItem } from '@shared';
import { searchAdamMeetingByTitle, type AdamMeetingAction } from '../../../data/meetingsApi';
import { Loader2, Download, Eye } from 'lucide-react';
import pdfIcon from '../../../../shared/assets/pdf.svg';

function formatInvitees(invitees: AdamMeetingAction['invitees']): string {
  if (invitees == null) return '—';
  if (Array.isArray(invitees)) {
    const parts = invitees.map((inv) =>
      typeof inv === 'string' ? inv : (inv && typeof inv === 'object' && 'name' in inv ? String((inv as { name?: string }).name ?? inv) : String(inv))
    );
    return parts.filter(Boolean).join('، ') || '—';
  }
  return String(invitees);
}

export interface MeetingDocumentationTabProps {
  /** Meeting title used to call GET /api/v1/adam-meetings/search/{title} for mom_pdf_base64 and actions */
  meetingTitle: string | undefined;
}

export function MeetingDocumentationTab({ meetingTitle }: MeetingDocumentationTabProps) {
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewItem | null>(null);

  const {
    data: apiData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['adam-meetings-search', meetingTitle],
    queryFn: () => searchAdamMeetingByTitle(meetingTitle!),
    enabled: Boolean(meetingTitle?.trim()),
  });

  const hasPdf = Boolean(apiData?.mom_pdf_base64?.trim());
  const actions = apiData?.actions ?? [];
  const sectionHeadingClass = "text-right font-bold text-[#101828] text-[16px]";
  const sectionHeadingStyle = { fontFamily: "'Almarai', sans-serif", fontSize: '18px' };

  const momPdfDataUrl = hasPdf && apiData?.mom_pdf_base64
    ? `data:application/pdf;base64,${apiData.mom_pdf_base64}`
    : '';

  return (
    <div className="flex flex-col gap-8 w-full" dir="rtl">
      {/* محضر الاجتماع – from API mom_pdf_base64 */}
      <div className="flex flex-col gap-2">
        <h2 className={sectionHeadingClass} style={sectionHeadingStyle}>
          محضر الاجتماع
        </h2>
        {!meetingTitle?.trim() ? (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
            لا يوجد عنوان اجتماع للبحث عن المحضر
          </div>
        ) : isLoading ? (
          <div className="px-4 py-8 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري تحميل المحضر...</span>
          </div>
        ) : isError ? (
          <div className="px-4 py-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-600">
            {error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المحضر'}
          </div>
        ) : !apiData?.found ? (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
            {apiData?.message ?? 'لم يتم العثور على اجتماع بهذا العنوان'}
          </div>
        ) : !hasPdf ? (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
            {apiData?.mom_status ?? 'لا يتوفر محضر PDF لهذا الاجتماع'}
          </div>
        ) : (
          <div className="flex flex-row gap-4 justify-start items-center flex-wrap">
            <div className="flex flex-row items-center flex-1 min-w-0 px-4 py-3 gap-3 h-[56px] bg-white border border-[#E4E7EC] rounded-xl shadow-[0px_1px_2px_rgba(16,24,40,0.05)] max-w-[400px]">
              <img src={pdfIcon} alt="pdf" className="max-h-10 object-contain flex-shrink-0" />
              <div className="flex flex-col items-end min-w-0 flex-1">
                <span className="text-sm font-medium text-[#344054] truncate w-full text-right">محضر الاجتماع.pdf</span>
              </div>
              <a
                href={`data:application/pdf;base64,${apiData.mom_pdf_base64}`}
                download="محضر_الاجتماع.pdf"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-[#009883]/10 text-[#009883] transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewAttachment({ blob_url: momPdfDataUrl, file_name: 'محضر الاجتماع.pdf', file_type: 'pdf' })}
                className="p-2 rounded-lg hover:bg-[#F2F4F7] text-[#475467] transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* التوجيهات المرتبطة بالاجتماع – from API actions (Title, due date, status, invitees) */}
      <div className="flex flex-col gap-2">
        <h2 className={sectionHeadingClass} style={sectionHeadingStyle}>
          التوجيهات المرتبطة بالاجتماع
        </h2>
        {!meetingTitle?.trim() ? (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
            لا يوجد عنوان اجتماع لعرض التوجيهات
          </div>
        ) : isLoading ? (
          <div className="px-4 py-8 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري تحميل التوجيهات...</span>
          </div>
        ) : isError ? (
          <div className="px-4 py-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-600">
            {error instanceof Error ? error.message : 'حدث خطأ أثناء جلب التوجيهات'}
          </div>
        ) : !apiData?.found || actions.length === 0 ? (
          <div className="px-4 py-6 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500">
            لا توجد توجيهات مرتبطة
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
            <DataTable
              columns={[
                { id: 'index', header: '#', width: 'w-16', align: 'center', render: (_: AdamMeetingAction, i: number) => <span className="text-sm text-[#475467]">{i + 1}</span> },
                { id: 'title', header: 'العنوان', width: 'flex-1', align: 'end', render: (row: AdamMeetingAction) => <span className="text-sm text-[#475467]">{row.title ?? '—'}</span> },
                { id: 'due_date', header: 'تاريخ الاستحقاق', width: 'w-36', align: 'end', render: (row: AdamMeetingAction) => <span className="text-sm text-[#475467]">{row.due_date ?? '—'}</span> },
                { id: 'status', header: 'الحالة', width: 'w-28', align: 'center', render: (row: AdamMeetingAction) => <span className="text-sm text-[#475467]">{row.status ?? '—'}</span> },
                { id: 'invitees', header: 'المدعوون', width: 'w-48', align: 'end', render: (row: AdamMeetingAction) => <span className="text-sm text-[#475467]">{formatInvitees(row.invitees)}</span> },
              ]}
              data={actions}
              rowPadding="py-3"
            />
          </div>
        )}
      </div>

      <AttachmentPreviewDrawer
        open={!!previewAttachment}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </div>
  );
}
