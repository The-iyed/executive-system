/**
 * Meeting documentation tab – توثيق الاجتماع (محضر من API، التوجيهات المرتبطة من API).
 * Uses GET /api/v1/adam-meetings/search/{title} for محضر الاجتماع (mom_pdf_base64) and actions.
 * Pure read-only view — no side effects.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AttachmentPreviewDrawer, formatDateArabic, type AttachmentPreviewItem } from '@/modules/shared';
import { searchAdamMeetingByTitle, type AdamMeetingAction } from '../../../data/meetingsApi';
import { translateDirectiveStatus } from '../utils/meetingDetailHelpers';
import { Loader2, Download, Eye } from 'lucide-react';
import pdfIcon from '../../../../shared/assets/pdf.svg';

/** Get assignees as string[] for المعينون column. API may send assignees as string[] (emails) or invitees as string[] | object[]. */
function getAssigneesList(row: AdamMeetingAction): string[] {
  const raw = row.assignees ?? row.invitees;
  if (raw == null || !Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      typeof item === 'string' ? item : (item && typeof item === 'object' && 'name' in item ? String((item as { name?: string }).name ?? item) : String(item))
    )
    .filter(Boolean);
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
  const sectionHeadingStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif", fontSize: '18px' };

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

      {/* التوجيهات المرتبطة بالاجتماع – from API actions */}
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
            <table className="w-full" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-16">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التوجيه</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">الموعد النهائي</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-28">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-[120px]">المعينون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {actions.map((row, index) => {
                  const d = row.due_date ? new Date(row.due_date) : null;
                  const assigneesList = getAssigneesList(row);
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">{row.title ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d ? formatDateArabic(d) : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{translateDirectiveStatus(row.status)}</td>
                      <td className="px-4 py-3" dir="rtl">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {assigneesList.length === 0 ? (
                            <span className="text-sm text-gray-500">—</span>
                          ) : (
                            assigneesList.map((email, i) => (
                              <span
                                key={`${email}-${i}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#008774]/15 text-[#008774] text-xs"
                              >
                                {email}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
