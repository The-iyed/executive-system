import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, User, Clock } from 'lucide-react';
import {
  DetailPageHeader,
  StatusBadge,
  MeetingInfo,
  Mou7tawaContentTab,
  AttachmentPreviewDrawer,
  ReadOnlyField,
  type MeetingInfoData,
} from '@/modules/shared/components';
import { formatDateArabic, formatTimeAgoArabic } from '@/modules/shared/utils';
import { MeetingStatus, SectorLabels } from '@/modules/shared/types';
import { getMeetingStatusLabel } from '@/modules/shared';
import { getConsultationRequestById, submitConsultationResponse, saveConsultationAsDraft, getPendingConsultations } from '../data/consultationsApi';
import { getConsultationRecords, type ConsultationRecord } from '../../UC02/data/meetingsApi';
import { Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/lib/ui';
import { PATH } from '../routes/paths';


/** Safely format related_guidance which may be a string or a directive object/array from the API */
function formatRelatedGuidance(value: unknown): string {
  if (value == null) return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '-';
  }
  if (Array.isArray(value)) {
    const texts = value
      .map((d: { directive_text?: string }) => (d?.directive_text != null ? String(d.directive_text) : ''))
      .filter(Boolean);
    return texts.length > 0 ? texts.join(' ') : '-';
  }
  if (typeof value === 'object' && value !== null && 'directive_text' in value) {
    const text = (value as { directive_text?: string }).directive_text;
    return text != null && String(text).trim() !== '' ? String(text).trim() : '-';
  }
  return '-';
}

/** Safely get notes text (string or array of objects with .text) */
function getNotesText(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (Array.isArray(c)) {
      const parts = c.map((n: unknown) => (n && typeof n === 'object' && 'text' in n && typeof (n as { text: string }).text === 'string' ? (n as { text: string }).text.trim() : null)).filter(Boolean) as string[];
      if (parts.length) return parts.join('\n');
    }
  }
  return '-';
}

const ConsultationRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('request-info');
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [queriesDisabled, setQueriesDisabled] = useState<boolean>(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);

  // Fetch consultation request data from API
  const { data: consultationData, isLoading, error } = useQuery({
    queryKey: ['consultation-request', id],
    queryFn: () => getConsultationRequestById(id!),
    enabled: !!id && !queriesDisabled,
  });

  // Fetch pending consultation data
  const { data: pendingConsultation, isLoading: isLoadingConsultation } = useQuery({
    queryKey: ['pending-consultation', id],
    queryFn: () => getPendingConsultations(id!),
    enabled: !!id && !queriesDisabled,
  });

  // Fetch consultation records for the log tab
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === 'consultations-log',
  });

  // Fetch consultation records with drafts for request-info drafts button
  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ['consultation-records-with-drafts', id],
    queryFn: () => getConsultationRecords(id!, true),
    enabled: !!id && activeTab === 'request-info',
  });

  const draftsRecords =
    consultationRecordsWithDrafts?.items?.filter(
      (item) =>
        item.is_draft ||
        (!item.consultation_answers?.length && !item.assignees?.some((a) => a.answers?.length)) ||
        item.consultation_answers?.some((a) => a.is_draft),
    ) || [];

  const meetingRequest = consultationData?.meeting_request;

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!meetingRequest) return {};
    const owner = meetingRequest.current_owner_user
      ? `${(meetingRequest.current_owner_user.first_name ?? '').trim()} ${(meetingRequest.current_owner_user.last_name ?? '').trim()}`.trim()
      : meetingRequest.current_owner_role?.name_ar ?? meetingRequest.submitter_name ?? undefined;
    const alt1 = (meetingRequest as { alternative_time_slot_1?: { start?: string; end?: string } }).alternative_time_slot_1;
    const alt2 = (meetingRequest as { alternative_time_slot_2?: { start?: string; end?: string } }).alternative_time_slot_2;
    return {
      ...meetingRequest as MeetingInfoData,
      is_on_behalf_of: meetingRequest.is_on_behalf_of,
      meeting_manager_label: owner || undefined,
      meetingSubject: meetingRequest.meeting_title ?? undefined,
      meetingDescription: meetingRequest.meeting_subject ?? undefined,
      sector: meetingRequest.sector ?? undefined,
      meetingType: meetingRequest.meeting_type ?? undefined,
      is_urgent: meetingRequest.is_urgent ?? !!meetingRequest.urgent_reason,
      urgent_reason: meetingRequest.urgent_reason ?? undefined,
      meeting_start_date: meetingRequest.scheduled_at ?? undefined,
      meeting_end_date: undefined,
      alternative_1_start_date: alt1?.start ?? undefined,
      alternative_1_end_date: alt1?.end ?? undefined,
      alternative_2_start_date: alt2?.start ?? undefined,
      alternative_2_end_date: alt2?.end ?? undefined,
      meetingChannel: meetingRequest.meeting_channel ?? undefined,
      meeting_location: meetingRequest.location ?? (meetingRequest as { selected_time_slot?: { location?: string } }).selected_time_slot?.location ?? undefined,
      meetingCategory: (meetingRequest as { meeting_classification_type?: string }).meeting_classification_type ?? meetingRequest.meeting_classification ?? undefined,
      meetingReason: meetingRequest.meeting_justification ?? undefined,
      relatedTopic: meetingRequest.related_topic ?? undefined,
      dueDate: meetingRequest.deadline ?? undefined,
      meetingClassification1: meetingRequest.meeting_classification ?? undefined,
      meetingConfidentiality: (meetingRequest as { meeting_confidentiality?: string }).meeting_confidentiality ?? undefined,
      meetingAgenda: meetingRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0),
      directive_method: (meetingRequest as { directive_method?: string }).directive_method ?? undefined,
      previous_meeting_minutes_file: undefined,
      directive_text: formatRelatedGuidance(meetingRequest.related_guidance),
      notes: getNotesText(meetingRequest.general_notes, meetingRequest.content_officer_notes),
    };
  }, [meetingRequest]);

  // Show consultation_question from pending API response; fallback to detail API
  const consultationQuestion =
    pendingConsultation?.consultation_question ??
    consultationData?.consultation_question ??
    '';

  // Attachments grouping
  const presentationAttachments =
    meetingRequest?.attachments?.filter((att) => att.is_presentation) || [];
  const optionalAttachments =
    meetingRequest?.attachments?.filter((att) => !att.is_presentation) || [];

  const tabs = [
    { id: 'request-info', label: 'معلومات الطلب' },
    { id: 'meeting-info', label: 'معلومات الاجتماع' },
    { id: 'content', label: 'المحتوى' },
    { id: 'invitees', label: 'قائمة المدعوين' },
    { id: 'consultations-log', label: 'سجل الإستشارات' },
  ];

  const queryClient = useQueryClient();

  // Submit consultation mutation
  const submitMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string }) => {
      if (!pendingConsultation?.id) throw new Error('Consultation ID is required');
      return submitConsultationResponse(pendingConsultation.id, data);
    },
    onSuccess: () => {
      setQueriesDisabled(true);
      queryClient.cancelQueries({ queryKey: ['consultation-request', id] });
      queryClient.cancelQueries({ queryKey: ['pending-consultation', id] });
      queryClient.removeQueries({ queryKey: ['consultation-request', id] });
      queryClient.removeQueries({ queryKey: ['pending-consultation', id] });
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      setConsultationNotes('');
      setIsSuitableForScheduling(false);
      setIsConsultationModalOpen(false);
      navigate(PATH.CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error('Error submitting consultation:', error);
    },
  });

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string }) => {
      if (!pendingConsultation?.id) throw new Error('Consultation ID is required');
      return saveConsultationAsDraft(pendingConsultation.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-request', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-consultation', id] });
      setIsConsultationModalOpen(false);
    },
    onError: (error) => {
      console.error('Error saving draft:', error);
    },
  });

  const handleSubmitConsultation = (type: 'draft' | 'submit') => {
    if (!consultationNotes.trim()) return;
    if (!pendingConsultation?.id) {
      console.error('Consultation ID is required');
      return;
    }
    if (type === 'draft') {
      saveDraftMutation.mutate({
        feasibility_answer: isSuitableForScheduling,
        consultation_answers: consultationNotes.trim(),
      });
    } else {
      submitMutation.mutate({
        feasibility_answer: isSuitableForScheduling,
        consultation_answers: consultationNotes.trim(),
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  // Error state
  if (error || !meetingRequest) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  // Map status
  const meetingStatus = (meetingRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getMeetingStatusLabel(meetingStatus);

  const consultationStatusLabels: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    RESPONDED: 'تم الرد',
    CANCELLED: 'ملغاة',
    COMPLETED: 'مكتمل',
    DRAFT: 'مسودة',
    SUPERSEDED: 'معلق',
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="p-6">
        <DetailPageHeader
          title={`${meetingRequest.meeting_title} (${meetingRequest.request_number})`}
          onBack={() => navigate(-1)}
          statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} />}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className={`overflow-y-auto h-full bg-white border border-[#E6E6E6] rounded-2xl m-6 mt-0 ${activeTab === 'consultations-log' ? '' : 'p-6'}`}>
        
        {/* ═══ Request Info Tab ═══ */}
        {activeTab === 'request-info' && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row items-center justify-between gap-4 mb-2">
              <h2 className="text-base font-bold text-[#101828]">معلومات الطلب</h2>
              <div className="flex flex-row items-center gap-2">
                {draftsRecords && draftsRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDraftsModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2 bg-[#F2F4F7] text-[#344054] rounded-full border-2 border-[#D0D5DD] transition-opacity hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    مسودات ({draftsRecords.length})
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <ReadOnlyField label="رقم الطلب" value={meetingRequest.request_number ?? '-'} />
              <ReadOnlyField
                label="تاريخ الطلب"
                value={
                  formatDateArabic(
                    (meetingRequest as { submitted_at?: string; created_at?: string })?.submitted_at ??
                      (meetingRequest as { created_at?: string })?.created_at,
                  ) || '-'
                }
              />
              <ReadOnlyField label="حالة الطلب" value={statusLabel} />
              <ReadOnlyField label="مقدم الطلب" value={meetingRequest.submitter_name ?? '-'} />
              <ReadOnlyField
                label="مالك الاجتماع"
                value={
                  meetingRequest.current_owner_user
                    ? `${meetingRequest.current_owner_user.first_name} ${meetingRequest.current_owner_user.last_name}`
                    : (meetingRequest.current_owner_role?.name_ar ?? meetingRequest.current_owner_user_id ?? '-')
                }
              />
            </div>
          </div>
        )}

        {/* ═══ Meeting Info Tab ═══ */}
        {activeTab === 'meeting-info' && (
          <div className="flex flex-col gap-6">
            <MeetingInfo data={meetingInfoData} dir="rtl" />
          </div>
        )}

        {/* ═══ Content Tab ═══ */}
        {activeTab === 'content' && (
          <div className="flex flex-col gap-6">
            <Mou7tawaContentTab
              presentationFiles={presentationAttachments.map((att) => ({
                id: att.id,
                file_name: att.file_name,
                file_size: att.file_size ?? 0,
                file_type: att.file_type ?? '',
                blob_url: att.blob_url ?? null,
              }))}
              optionalFiles={optionalAttachments.map((att) => ({
                id: att.id,
                file_name: att.file_name,
                file_size: att.file_size ?? 0,
                file_type: att.file_type ?? '',
                blob_url: att.blob_url ?? null,
              }))}
              attachmentTimingValue={meetingRequest?.presentation_attachment_timing ?? ''}
              notesValue=""
              readOnly
              formatDate={formatDateArabic}
              onView={(file) => setPreviewAttachment({ blob_url: file.blob_url!, file_name: file.file_name, file_type: file.file_type })}
              onDownload={(file) => file.blob_url && window.open(file.blob_url!, '_blank')}
            />
          </div>
        )}

        {/* ═══ Invitees Tab — Table Layout ═══ */}
        {activeTab === 'invitees' && (
          <div className="flex flex-col gap-6 w-full" dir="rtl">
            {/* ─── قائمة المدعوين (مقدّم الطلب) ─── */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                    <User className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-bold text-[#1F2937]">قائمة المدعوين (مقدّم الطلب)</span>
                    {(meetingRequest.invitees?.length ?? 0) > 0 && (
                      <span className="text-xs text-[#6B7280] bg-[#F3F4F6] rounded-full px-2.5 py-0.5 font-medium">
                        {meetingRequest.invitees!.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-0">
                {meetingRequest.invitees && meetingRequest.invitees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                          <th className="px-5 py-3 text-right font-semibold text-[#6B7280] w-10">#</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الاسم</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">المنصب</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجهة</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">البريد</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجوال</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الحضور</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">صلاحية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F9FAFB]">
                        {meetingRequest.invitees.map((invitee: any, idx: number) => {
                          const isConsultant = invitee.is_consultant === true;
                          const name = invitee.external_name || invitee.user_id || '-';
                          const position = invitee.position || '-';
                          const sector =
                            (invitee.sector && SectorLabels[invitee.sector as keyof typeof SectorLabels]) ||
                            invitee.sector || '-';
                          const email = invitee.external_email || '-';
                          const mobile = invitee.mobile || '-';
                          const v = invitee.attendance_mechanism;
                          const attendanceLabel =
                            v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                          const accessLabel =
                            invitee.access_permission === 'VIEW' ? 'اطلاع' : invitee.access_permission === 'EDIT' ? 'تعديل' : invitee.access_permission || 'اطلاع';
                          return (
                            <tr key={invitee.id || idx} className={`transition-colors ${isConsultant ? 'bg-[#F0FDF9]' : 'hover:bg-[#F9FAFB]'}`}>
                              <td className="px-5 py-3 text-[#9CA3AF] font-medium">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isConsultant ? 'bg-[#ECFDF5] border border-[#048F86]/20' : 'bg-[#F3F4F6]'}`}>
                                    <User className={`h-3.5 w-3.5 ${isConsultant ? 'text-[#048F86]' : 'text-[#9CA3AF]'}`} strokeWidth={1.8} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-[#1F2937] truncate">{name}</span>
                                    {isConsultant && <span className="text-[10px] text-[#048F86] font-medium">مستشار</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#374151]">{position}</td>
                              <td className="px-4 py-3 text-sm text-[#374151]">{sector}</td>
                              <td className="px-4 py-3 text-sm text-[#374151] truncate max-w-[180px]">{email}</td>
                              <td className="px-4 py-3 text-sm text-[#374151]" dir="ltr">{mobile}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${v === 'VIRTUAL' || v === 'عن بعد' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#EFF6FF] text-[#3B82F6]'}`}>
                                  {attendanceLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#ECFDF5] text-[#059669]">
                                  {accessLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-[#6B7280] text-sm">
                    لا توجد قائمة مدعوين من مقدّم الطلب
                  </div>
                )}
              </div>
            </section>

            {/* ─── الحضور من جهة الوزير ─── */}
            <section className="rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#048F86]/10 flex items-center justify-center">
                    <User className="w-[18px] h-[18px] text-[#048F86]" strokeWidth={1.8} />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-bold text-[#1F2937]">الحضور من جهة الوزير</span>
                    {(meetingRequest.minister_attendees?.length ?? 0) > 0 && (
                      <span className="text-xs text-[#6B7280] bg-[#F3F4F6] rounded-full px-2.5 py-0.5 font-medium">
                        {meetingRequest.minister_attendees!.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-0">
                {meetingRequest.minister_attendees && meetingRequest.minister_attendees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                          <th className="px-5 py-3 text-right font-semibold text-[#6B7280] w-10">#</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الاسم</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">المنصب</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجهة</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">البريد</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الجوال</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">الحضور</th>
                          <th className="px-4 py-3 text-right font-semibold text-[#6B7280]">صلاحية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F9FAFB]">
                        {meetingRequest.minister_attendees.map((invitee: any, idx: number) => {
                          const isConsultant = invitee.is_consultant === true;
                          const name = invitee.external_name || invitee.user_id || '-';
                          const position = invitee.position || '-';
                          const sector =
                            (invitee.sector && SectorLabels[invitee.sector as keyof typeof SectorLabels]) ||
                            invitee.sector || '-';
                          const email = invitee.external_email || '-';
                          const mobile = invitee.mobile || '-';
                          const v = invitee.attendance_mechanism;
                          const attendanceLabel =
                            v === 'VIRTUAL' || v === 'عن بعد' ? 'عن بعد' : v === 'PHYSICAL' || v === 'حضوري' ? 'حضوري' : v || '-';
                          const accessLabel =
                            invitee.access_permission === 'VIEW' ? 'اطلاع' : invitee.access_permission === 'EDIT' ? 'تعديل' : invitee.access_permission || 'اطلاع';
                          return (
                            <tr key={invitee.id || idx} className={`transition-colors ${isConsultant ? 'bg-[#F0FDF9]' : 'hover:bg-[#F9FAFB]'}`}>
                              <td className="px-5 py-3 text-[#9CA3AF] font-medium">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isConsultant ? 'bg-[#ECFDF5] border border-[#048F86]/20' : 'bg-[#F3F4F6]'}`}>
                                    <User className={`h-3.5 w-3.5 ${isConsultant ? 'text-[#048F86]' : 'text-[#9CA3AF]'}`} strokeWidth={1.8} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-[#1F2937] truncate">{name}</span>
                                    {isConsultant && <span className="text-[10px] text-[#048F86] font-medium">مستشار</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#374151]">{position}</td>
                              <td className="px-4 py-3 text-sm text-[#374151]">{sector}</td>
                              <td className="px-4 py-3 text-sm text-[#374151] truncate max-w-[180px]">{email}</td>
                              <td className="px-4 py-3 text-sm text-[#374151]" dir="ltr">{mobile}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${v === 'VIRTUAL' || v === 'عن بعد' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#EFF6FF] text-[#3B82F6]'}`}>
                                  {attendanceLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#ECFDF5] text-[#059669]">
                                  {accessLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-[#6B7280] text-sm">
                    لا يوجد حضور من جهة الوزير
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ Consultations Log Tab — Chat-style ═══ */}
        {activeTab === 'consultations-log' && (
          <div className="flex flex-col w-full bg-white" dir="rtl">
            <div className="flex-1 min-h-0">
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                <div className="flex flex-col pb-4">
                  {[...consultationRecords.items].reverse().map((row: ConsultationRecord, index: number) => {
                    const recordId = row.id || row.consultation_id || `${index}`;
                    const recordType = row.type || row.consultation_type || '';
                    const recordQuestion = row.question || row.consultation_question || '';
                    const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : '-';
                    const requesterName = row.consultant_name || '-';

                    const flatItems: Array<{
                      id: string;
                      text: string;
                      status: string;
                      name: string;
                      respondedAt: string | null;
                      requestNumber: string | null;
                    }> = [];
                    if (row.assignees?.length) {
                      row.assignees.forEach((a) => {
                        if (a.answers?.length) {
                          a.answers.forEach((ans) =>
                            flatItems.push({
                              id: ans.answer_id,
                              text: ans.text,
                              status: a.status,
                              name: a.name,
                              respondedAt: ans.responded_at,
                              requestNumber: a.request_number,
                            }),
                          );
                        } else {
                          flatItems.push({
                            id: a.user_id,
                            text: '',
                            status: a.status,
                            name: a.name,
                            respondedAt: a.responded_at,
                            requestNumber: a.request_number,
                          });
                        }
                      });
                    } else if (row.consultation_answers?.length) {
                      row.consultation_answers.forEach((a) =>
                        flatItems.push({
                          id: a.consultation_id || a.external_id || `ans-${index}`,
                          text: a.consultation_answer,
                          status: a.status,
                          name: row.consultant_name || '',
                          respondedAt: a.responded_at,
                          requestNumber: row.consultation_request_number || null,
                        }),
                      );
                    } else if (row.assignee_sections?.length) {
                      row.assignee_sections.forEach((a) =>
                        flatItems.push({
                          id: a.user_id,
                          text: a.answers?.join(' | ') || '',
                          status: a.status,
                          name: a.assignee_name,
                          respondedAt: a.responded_at,
                          requestNumber: a.consultation_record_number || null,
                        }),
                      );
                    }

                    return (
                      <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                        {/* Question bubble (sent – right-aligned teal) */}
                        <div className="px-5 pt-5 pb-3">
                          <div className="flex items-start gap-3" dir="rtl">
                            <div className="flex-shrink-0">
                              <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-[#048F86]">
                                  {requesterName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[#1F2937]">{requesterName}</span>
                                <span className="text-[11px] text-[#9CA3AF]">{requestDate}</span>
                                {row.round_number != null && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 font-medium">
                                    الجولة {row.round_number}
                                  </span>
                                )}
                                {row.status && (
                                  <StatusBadge
                                    status={row.status}
                                    label={consultationStatusLabels[row.status] || row.status}
                                  />
                                )}
                              </div>
                              <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                                  {recordQuestion || '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Response bubbles (received – left-aligned gray) */}
                        <div className="px-5 pb-5 pt-1">
                          {flatItems.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {flatItems.map((item) => (
                                <div key={item.id} className="flex items-start gap-3" dir="ltr">
                                  <div className="flex-shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                                      <span className="text-xs font-bold text-[#92400E]">
                                        {item.name?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold text-[#1F2937]">{item.name || '-'}</span>
                                      {item.respondedAt && (
                                        <span className="text-[11px] text-[#9CA3AF]">
                                          {formatTimeAgoArabic(item.respondedAt)}
                                        </span>
                                      )}
                                      <StatusBadge
                                        status={item.status}
                                        label={consultationStatusLabels[item.status] || item.status}
                                      />
                                    </div>
                                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                      <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                                        {item.text?.trim() || '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit"
                              dir="ltr"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                              <p className="text-sm text-[#9CA3AF]">لا يوجد رد بعد</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#98A2B3]" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#344054]">سجل الإستشارات</p>
                  <p className="text-[13px] text-[#667085]">لا توجد استشارات مسجلة</p>
                </div>
              )}
            </div>

            {/* Sticky chat input at bottom of consultation tab */}
            <div className="sticky bottom-0 z-10 border-t border-[#F3F4F6] bg-[#FAFAFA] rounded-b-2xl mt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitConsultation('submit');
                }}
                className="flex items-end gap-3 px-5 py-4"
                dir="rtl"
              >
                <Textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitConsultation('submit');
                    }
                  }}
                  placeholder="اكتب استشارتك هنا..."
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-right focus:border-[#048F86] focus:ring-1 focus:ring-[#048F86] placeholder:text-[#9CA3AF]"
                  dir="rtl"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!consultationNotes.trim() || submitMutation.isPending || !pendingConsultation?.id}
                  className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white flex items-center justify-center transition-opacity disabled:opacity-40"
                >
                  {submitMutation.isPending ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Drafts Modal */}
      <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
        <DialogContent className="sm:max-w-[700px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">مسودات الاستشارات</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            {isLoadingConsultationRecordsWithDrafts ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : draftsRecords.length > 0 ? (
              draftsRecords.map((draft) => {
                const draftAnswer =
                  draft.consultation_answers?.find((a) => a.is_draft) ?? draft.consultation_answers?.[0];
                const answerText = draftAnswer?.consultation_answer ?? draft.consultation_answer ?? '';
                const draftId = draft.id || draft.consultation_id;
                const draftQuestion = draft.question || draft.consultation_question;
                return (
                  <div key={draftId} className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 text-right">سؤال الاستشارة:</span>
                        <span className="text-xs text-gray-500">{formatDateArabic(draft.requested_at)}</span>
                      </div>
                      <p className="text-sm text-gray-900 text-right">{draftQuestion}</p>
                    </div>
                    {answerText && (
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-700 text-right">الإجابة:</span>
                        <p className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                          {answerText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500 text-right">لا توجد مسودات</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row justify-start gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
            >
              إغلاق
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Consultation Modal */}
      <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
        <DialogContent className="sm:max-w-[650px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة الاستشارة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder="إضافة الاستشارة..."
              className="min-h-[200px] resize-none"
              dir="rtl"
            />
            <div className="flex flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-900 text-right">هل الطلب مناسب للجدولة؟</span>
              <div className="flex flex-row items-center gap-3">
                <span className="text-base text-[#667085]">{isSuitableForScheduling ? 'نعم' : 'لا'}</span>
                <button
                  type="button"
                  onClick={() => setIsSuitableForScheduling(!isSuitableForScheduling)}
                  className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                    isSuitableForScheduling
                      ? 'bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end'
                      : 'bg-[#F2F4F7] justify-start'
                  } px-0.5`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
            <button
              type="button"
              onClick={() => setIsConsultationModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
              disabled={submitMutation.isPending}
            >
              إلغاء
            </button>
            <div className="flex flex-row justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitConsultation('draft')}
                disabled={saveDraftMutation.isPending || !consultationNotes.trim() || !pendingConsultation?.id}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveDraftMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmitConsultation('submit')}
                disabled={submitMutation.isPending || !consultationNotes.trim() || !pendingConsultation?.id}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDrawer
        open={!!previewAttachment}
        onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}
        attachment={previewAttachment}
      />
    </div>
  );
};

export default ConsultationRequestDetail;
