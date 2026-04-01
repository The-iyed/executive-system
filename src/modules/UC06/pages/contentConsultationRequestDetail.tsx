import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Eye, Download, Clock, User, Hash, ScrollText } from "lucide-react";
import {
  DetailPageHeader,
  StatusBadge,
  MeetingInfo,
  Mou7tawaContentTab,
  AttachmentPreviewDrawer,
  ReadOnlyField,
  type MeetingInfoData,
} from "@/modules/shared/components";
import { formatDateArabic, formatDateTimeArabic, formatTimeAgoArabic } from "@/modules/shared/utils";
import { MeetingStatus, MeetingStatusLabels, SectorLabels } from "@/modules/shared/types";
import {
  getContentConsultationRequestById,
  submitConsultation,
  completeConsultation,
  type Attachment,
} from "../data/contentConsultantApi";
import { getConsultationRecords, type ConsultationRecord } from "../../UC02/data/meetingsApi";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@/lib/ui";
import { PATH } from "../routes/paths";
import pdfIcon from "../../shared/assets/pdf.svg";
import { trackEvent } from "@/lib/analytics";
import { InviteesTableForm } from "@/modules/shared/features/invitees-table-form";

// Get status label with support for custom statuses
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  return status as string;
};

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

// Safely render notes coming as string/object/array from API
const getNotesText = (...candidates: unknown[]): string => {
  const extract = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (Array.isArray(value)) {
      const parts = value.map(extract).filter(Boolean) as string[];
      return parts.length ? parts.join("\n") : null;
    }
    if (typeof value === "object") {
      const v = value as Record<string, unknown>;
      // Try common text property names
      if (typeof v.text === "string" && v.text.trim()) return v.text.trim();
      if (typeof v.note === "string" && v.note.trim()) return v.note.trim();
      if (typeof v.content === "string" && v.content.trim()) return v.content.trim();
      if (typeof v.value === "string" && v.value.trim()) return v.value.trim();
      if (typeof v.notes === "string" && v.notes.trim()) return v.notes.trim();
      if (typeof v.note_text === "string" && v.note_text.trim()) return v.note_text.trim();
      // Don't return the object itself
      return null;
    }
    return null;
  };

  for (const candidate of candidates) {
    const text = extract(candidate);
    if (text) return text;
  }
  return "-";
};

const ContentConsultationRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("request-info");
  const [activeSubTab, setActiveSubTab] = useState<string>("presentation");
  const [consultationNotes, setConsultationNotes] = useState<string>("");
  const [isSuitableForScheduling, setIsSuitableForScheduling] = useState<boolean>(true);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    blob_url: string;
    file_name: string;
    file_type?: string;
  } | null>(null);

  // Fetch content consultation request data from API
  const {
    data: consultationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["content-consultation-request", id],
    queryFn: () => getContentConsultationRequestById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (consultationData?.consultation_id || id) {
      trackEvent('UC-06', 'uc06_content_consultation_request_detail_viewed', {
        content_consultation_request_id: consultationData?.consultation_id ?? id,
      });
    }
  }, [consultationData?.consultation_id, id]);

  // Fetch consultation records
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ["consultation-records", id],
    queryFn: () => getConsultationRecords(id!),
    enabled: !!id && activeTab === "consultations-log",
  });

  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ["consultation-records-with-drafts", id],
    queryFn: () => getConsultationRecords(id!, true),
    enabled: !!id && activeTab === "request-info",
  });

  const draftsRecords = consultationRecordsWithDrafts?.items?.filter(
      (item) =>
        item.is_draft ||
        (!item.consultation_answers?.length && !item.assignees?.some((a) => a.answers?.length)) ||
        item.consultation_answers?.some((a) => a.is_draft),
    ) || [];

  const queryClient = useQueryClient();

  const meetingRequest = consultationData?.meeting_request;
  const consultationQuestion = consultationData?.consultation_question || "";
  // Use consultation_id from response, or fallback to meeting request id from URL
  const consultationId = consultationData?.consultation_id || id;

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!meetingRequest) return {};
    const owner = meetingRequest.current_owner_user
      ? `${meetingRequest.current_owner_user.first_name ?? ""} ${meetingRequest.current_owner_user.last_name ?? ""}`.trim()
      : (meetingRequest.current_owner_role?.name_ar ?? undefined);
    return {
      is_on_behalf_of: meetingRequest.is_on_behalf_of,
      meeting_manager_label: owner ?? undefined,
      meetingSubject: meetingRequest.meeting_title ?? undefined,
      meetingDescription: meetingRequest.meeting_subject ?? undefined,
      sector: meetingRequest.sector ?? undefined,
      meetingType: meetingRequest.meeting_type ?? undefined,
      is_urgent: meetingRequest.is_direct_schedule === true,
      urgent_reason: meetingRequest.meeting_justification ?? undefined,
      meeting_start_date: meetingRequest.scheduled_at ?? undefined,
      meeting_end_date: undefined,
      meetingChannel: meetingRequest.meeting_channel ?? undefined,
      meeting_location: undefined,
      meetingCategory: meetingRequest.meeting_classification ?? undefined,
      meetingReason: meetingRequest.meeting_justification ?? undefined,
      relatedTopic: meetingRequest.related_topic ?? undefined,
      dueDate: meetingRequest.deadline ?? undefined,
      meetingClassification1:
        (meetingRequest as { meeting_classification_type?: string }).meeting_classification_type ?? undefined,
      meetingConfidentiality:
        (meetingRequest as { meeting_confidentiality?: string }).meeting_confidentiality ?? undefined,
      meetingAgenda: meetingRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(
        meetingRequest.related_directive_ids && meetingRequest.related_directive_ids.length > 0
      ),
      directive_method:
        (meetingRequest as { directive_method?: string }).directive_method ||
        ((meetingRequest as { previous_meeting_attachment?: unknown }).previous_meeting_attachment != null ||
        meetingRequest.previous_meeting_id != null
          ? 'PREVIOUS_MEETING'
          : undefined ) || undefined,
      previous_meeting_minutes_file: undefined,
      directive_text: undefined,
      notes: getNotesText(meetingRequest.general_notes, meetingRequest.content_officer_notes),
    };
  }, [meetingRequest]);

  // Filter attachments
  const presentationAttachments = meetingRequest?.attachments?.filter((att) => att.is_presentation) || [];
  const prevAttId = (meetingRequest as { previous_meeting_attachment?: { id?: string } | null })?.previous_meeting_attachment?.id ?? null;
  const additionalAttachments =
    meetingRequest?.attachments?.filter(
      (att) =>
        att.is_additional &&
        (prevAttId == null || att.id !== prevAttId)
    ) || [];

  const tabs = [
    {
      id: "request-info",
      label: "معلومات الطلب",
    },
    {
      id: "content",
      label: "المحتوى",
    },
    // {
    //   id: 'attachments',
    //   label: 'المرفقات',
    // },
    {
      id: "meeting-info",
      label: "معلومات الاجتماع",
    },
    {
      id: "invitees",
      label: "قائمة المدعوين",
    },
    {
      id: "consultations-log",
      label: "الاستشارات",
    },
  ];

  // Submit consultation mutation
  const submitMutation = useMutation({
    mutationFn: (data: { feasibility_answer: boolean; consultation_answers: string; is_draft: boolean }) => {
      if (!consultationId) throw new Error("Consultation ID is required");
      return submitConsultation(consultationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-consultation-request", id] });
      queryClient.invalidateQueries({ queryKey: ["content-consultation-requests"] });
      setConsultationNotes("");
      setIsSuitableForScheduling(true);
      setIsConsultationModalOpen(false);
      navigate(PATH.CONTENT_CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error("Error submitting consultation:", error);
      // TODO: Show error toast/notification
    },
  });

  const handleSubmitConsultation = (type: "draft" | "submit") => {
    if (!consultationNotes.trim()) {
      // TODO: Show validation error
      return;
    }
    if (!consultationId) {
      console.error("Consultation ID is required");
      return;
    }
    submitMutation.mutate({
      feasibility_answer: isSuitableForScheduling,
      consultation_answers: consultationNotes.trim(),
      is_draft: type === "draft",
    });
  };

  // Publish draft mutation
  const publishDraftMutation = useMutation({
    mutationFn: (draftId: string) => {
      return completeConsultation(draftId);
    },
    onSuccess: () => {
      navigate(PATH.CONTENT_CONSULTATION_REQUESTS);
    },
    onError: (error) => {
      console.error("Error publishing draft:", error);
      // TODO: Show error toast/notification
    },
  });

  const handlePublishDraft = (draftId: string) => {
    publishDraftMutation.mutate(draftId);
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

  // Map status to MeetingStatus enum
  const meetingStatus = (meetingRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getStatusLabel(meetingStatus);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="p-6">
        <DetailPageHeader
          title={meetingRequest.request_number ? `${meetingRequest.meeting_title} (${meetingRequest.request_number})` : meetingRequest.meeting_title}
          onBack={() => navigate(-1)}
          statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} />}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className={`overflow-y-auto h-full bg-white border border-[#E6E6E6] rounded-2xl m-6 mt-0 ${activeTab === "consultations-log" ? "" : "p-6"}`}>
        {activeTab === "request-info" && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row items-center justify-between gap-4 mb-2">
              <h2 className="text-base font-bold text-[#101828]">معلومات الطلب</h2>
              <div className="flex flex-row items-center gap-2">
                {draftsRecords && draftsRecords?.length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full p-[20px]">
              <ReadOnlyField label="رقم الطلب" value={meetingRequest.request_number ?? "-"} />
              <ReadOnlyField
                label="تاريخ الطلب"
                value={
                  formatDateArabic(
                    (meetingRequest as { submitted_at?: string; created_at?: string })?.submitted_at ??
                      (meetingRequest as { created_at?: string })?.created_at,
                  ) || "-"
                }
              />
              <ReadOnlyField label="حالة الطلب" value={statusLabel} />
              <ReadOnlyField label="مقدم الطلب" value={meetingRequest.submitter_name ?? "-"} />
              <ReadOnlyField
                label="مالك الاجتماع"
                value={
                  meetingRequest.current_owner_user
                    ? `${meetingRequest.current_owner_user.first_name} ${meetingRequest.current_owner_user.last_name}`
                    : (meetingRequest.current_owner_role?.name_ar ?? meetingRequest.current_owner_user_id ?? "-")
                }
              />
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="flex flex-col gap-6 w-full">
            <Mou7tawaContentTab
              presentationFiles={presentationAttachments.map((att) => ({
                id: att.id,
                file_name: att.file_name,
                file_size: att.file_size ?? 0,
                file_type: att.file_type ?? "",
                blob_url: att.blob_url ?? null,
              }))}
              optionalFiles={additionalAttachments.map((att) => ({
                id: att.id,
                file_name: att.file_name,
                file_size: att.file_size ?? 0,
                file_type: att.file_type ?? "",
                blob_url: att.blob_url ?? null,
              }))}
              attachmentTimingValue={
                (meetingRequest as { presentation_attachment_timing?: string | null })
                  ?.presentation_attachment_timing ?? ""
              }
              notesValue={meetingRequest?.general_notes ?? ""}
              contentOfficerNotes={meetingRequest?.content_officer_notes ?? null}
              readOnly
              formatDate={formatDateArabic}
              onView={(file) =>
                setPreviewAttachment({ blob_url: file.blob_url!, file_name: file.file_name, file_type: file.file_type })
              }
              onDownload={(file) => file.blob_url && window.open(file.blob_url!, "_blank")}
            />
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="flex flex-col gap-6" style={{ width: "100%" }}>
            {/* Sub-tabs for attachments */}
            <div className="flex flex-row gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveSubTab("presentation")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeSubTab === "presentation"
                    ? "text-[#009883] border-b-2 border-[#009883]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                العرض التقديمي
              </button>
              {additionalAttachments.length > 0 && (
                <button
                  onClick={() => setActiveSubTab("additional")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSubTab === "additional"
                      ? "text-[#009883] border-b-2 border-[#009883]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {additionalAttachments.length} مرفقات إضافية
                </button>
              )}
            </div>

            {/* Attachment Display */}
            <div className="flex flex-col gap-4" style={{ width: "100%" }}>
              {activeSubTab === "presentation" && presentationAttachments.length > 0 && (
                <div className="flex flex-col gap-4">
                  {presentationAttachments.map((att: Attachment) => (
                    <div
                      key={att.id}
                      className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                    >
                      <div className="flex flex-row items-center gap-3">
                        {att.file_type?.toLowerCase() === "pdf" ? (
                          <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                            {att.file_type?.toUpperCase() || ""}
                          </div>
                        )}
                        <div className="flex flex-col items-end">
                          <span
                            className="text-sm font-medium text-[#344054] text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            {att.file_name}
                          </span>
                          <span
                            className="text-xs text-[#475467] text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            {formatFileSize(att.file_size || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2 ml-auto">
                        {att.blob_url && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewAttachment({
                                  blob_url: att.blob_url,
                                  file_name: att.file_name,
                                  file_type: att.file_type,
                                })
                              }
                              className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                            >
                              <Eye className="w-5 h-5 text-[#475467]" />
                            </button>
                            <a
                              href={att.blob_url}
                              target="_blank"
                              rel="noreferrer"
                              className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                            >
                              <Download className="w-5 h-5 text-[#009883]" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === "additional" && additionalAttachments.length > 0 && (
                <div className="flex flex-col gap-4">
                  {additionalAttachments.map((att: Attachment) => (
                    <div
                      key={att.id}
                      className="flex flex-row items-center px-4 py-3 gap-4 bg-white border border-[#009883] rounded-[12px]"
                    >
                      <div className="flex flex-row items-center gap-3">
                        {att.file_type?.toLowerCase() === "pdf" ? (
                          <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                            {att.file_type?.toUpperCase() || ""}
                          </div>
                        )}
                        <div className="flex flex-col items-end">
                          <span
                            className="text-sm font-medium text-[#344054] text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            {att.file_name}
                          </span>
                          <span
                            className="text-xs text-[#475467] text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            {formatFileSize(att.file_size || 0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2 ml-auto">
                        {att.blob_url && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewAttachment({
                                  blob_url: att.blob_url,
                                  file_name: att.file_name,
                                  file_type: att.file_type,
                                })
                              }
                              className="inline-flex items-center justify-center w-9 h-9 bg-[rgba(71,84,103,0.08)] rounded-md hover:bg-[rgba(71,84,103,0.15)] transition-colors"
                            >
                              <Eye className="w-5 h-5 text-[#475467]" />
                            </button>
                            <a
                              href={att.blob_url}
                              target="_blank"
                              rel="noreferrer"
                              className="relative inline-flex items-center justify-center w-9 h-9 bg-[rgba(0,152,131,0.09)] rounded-md hover:bg-[rgba(0,152,131,0.15)] transition-colors"
                            >
                              <Download className="w-5 h-5 text-[#009883]" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === "presentation" && presentationAttachments.length === 0 && (
                <div className="text-center py-8 text-gray-500">لا يوجد عرض تقديمي</div>
              )}

              {activeSubTab === "additional" && additionalAttachments.length === 0 && (
                <div className="text-center py-8 text-gray-500">لا توجد مرفقات إضافية</div>
              )}
            </div>

            {/* Content Manager Notes */}
            <div className="flex flex-col gap-4">
              <h3
                className="text-lg font-semibold text-gray-900 text-right"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                ملاحظات مسؤول المحتوى
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px]">
                <p
                  className="text-sm text-gray-700 text-right whitespace-pre-wrap"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {getNotesText(meetingRequest.content_officer_notes) || "لا توجد ملاحظات"}
                </p>
              </div>
            </div>

            {/* Consultation Question */}
            {consultationQuestion && (
              <div className="flex flex-col gap-4">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  سؤال الاستشارة
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    {consultationQuestion}
                  </p>
                </div>
              </div>
            )}

            {/* Add Consultation Section */}
          </div>
        )}

        {activeTab === "meeting-info" && (
          <div className="flex flex-col gap-6">
            <MeetingInfo data={meetingInfoData} dir="rtl" />
          </div>
        )}

        {/* Invitees Tab - قائمة المدعوين */}
        {activeTab === "invitees" && (
          <InviteesTableForm initialInvitees={meetingRequest.invitees} mode='view' />
        )}

        {/* Consultations Log Tab – chat-bubble style like UC05 */}
        {activeTab === "consultations-log" && (
          <div className="flex flex-col w-full bg-white h-full" dir="rtl">
            <div className="flex-1 min-h-0">
              {isLoadingConsultationRecords ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">جاري التحميل...</div>
                </div>
              ) : consultationRecords && consultationRecords.items.length > 0 ? (
                <div className="flex flex-col pb-4">
                  {consultationRecords.items.map((row: ConsultationRecord, index: number) => {
                    const recordId = row.id || row.consultation_id || `${index}`;
                    const recordType = row.type || row.consultation_type || "";
                    const recordQuestion = row.question || row.consultation_question || "";
                    const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : "-";
                    const typeLabel =
                      recordType === "SCHEDULING" ? "السؤال" : recordType === "CONTENT" ? "محتوى" : recordType;
                    const requesterName = row.consultant_name || "-";
                    const consultationStatusLabels: Record<string, string> = {
                      PENDING: "قيد الانتظار",
                      RESPONDED: "تم الرد",
                      CANCELLED: "ملغاة",
                      COMPLETED: "مكتمل",
                      DRAFT: "مسودة",
                      SUPERSEDED: "معلق",
                    };

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
                            text: "",
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
                          name: row.consultant_name || "",
                          respondedAt: a.responded_at,
                          requestNumber: row.consultation_request_number || null,
                        }),
                      );
                    } else if (row.assignee_sections?.length) {
                      row.assignee_sections.forEach((a) =>
                        flatItems.push({
                          id: a.user_id,
                          text: a.answers?.join(" | ") || "",
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
                                  {requesterName?.charAt(0)?.toUpperCase() || "?"}
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
                                  {recordQuestion || "-"}
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
                                        {item.name?.charAt(0)?.toUpperCase() || "?"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold text-[#1F2937]">{item.name || "-"}</span>
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
                                        {item.text?.trim() || "—"}
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
                <div className="flex items-center gap-3 py-6 px-6 rounded-xl bg-[#F9FAFB] border border-dashed border-[#D1D5DB]">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#98A2B3]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#344054]">الاستشارات</p>
                    <p className="text-[13px] text-[#667085] mt-0.5">لا توجد استشارات مسجلة</p>
                  </div>
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
                  disabled={!consultationNotes.trim() || submitMutation.isPending || !consultationId}
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

        {/* Add Consultation Modal */}
        <Dialog open={isConsultationModalOpen} onOpenChange={setIsConsultationModalOpen}>
          <DialogContent className="sm:max-w-[650px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                إضافة الاستشارة
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="إضافة الاستشارة..."
                className="min-h-[200px] resize-none"
                dir="rtl"
              />

              {/* Toggle for scheduling suitability */}
              <div className="flex flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span
                  className="text-sm font-medium text-gray-900 text-right"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  هل الطلب مناسب للجدولة؟
                </span>
                <div className="flex flex-row items-center gap-3">
                  <span className="text-base text-[#667085]" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    {isSuitableForScheduling ? "نعم" : "لا"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSuitableForScheduling(!isSuitableForScheduling)}
                    className={`w-11 h-6 rounded-full flex items-center transition-all cursor-pointer ${
                      isSuitableForScheduling
                        ? "bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] justify-end"
                        : "bg-[#F2F4F7] justify-start"
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
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                disabled={submitMutation.isPending}
              >
                إلغاء
              </button>
              <div className="flex flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitConsultation("draft")}
                  disabled={submitMutation.isPending || !consultationNotes.trim() || !consultationId}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {submitMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitConsultation("submit")}
                  disabled={submitMutation.isPending || !consultationNotes.trim() || !consultationId}
                  className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {submitMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drafts Modal */}
        <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
          <DialogContent className="sm:max-w-[700px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                مسودات الاستشارات
              </DialogTitle>
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
                  const answerText = draftAnswer?.consultation_answer ?? draft.consultation_answer ?? "";
                  const draftId = draft.id || draft.consultation_id;
                  const draftQuestion = draft.question || draft.consultation_question;
                  return (
                    <div key={draftId} className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center justify-between">
                          <span
                            className="text-sm font-medium text-gray-700 text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            سؤال الاستشارة:
                          </span>
                          <span className="text-xs text-gray-500" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                            {formatDateArabic(draft.requested_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                          {draftQuestion}
                        </p>
                      </div>

                      {answerText && (
                        <div className="flex flex-col gap-2">
                          <span
                            className="text-sm font-medium text-gray-700 text-right"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            الإجابة:
                          </span>
                          <p
                            className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200"
                            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                          >
                            {answerText}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-row justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handlePublishDraft(draftId!)}
                          disabled={publishDraftMutation.isPending}
                          className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                        >
                          {publishDraftMutation.isPending ? "جاري النشر..." : "نشر"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    لا توجد مسودات
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-start gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                إغلاق
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AttachmentPreviewDrawer
          open={!!previewAttachment}
          onOpenChange={(open) => {
            if (!open) setPreviewAttachment(null);
          }}
          attachment={previewAttachment}
        />
      </div>
    </div>
  );
};

export default ContentConsultationRequestDetail;
