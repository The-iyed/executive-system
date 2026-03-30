import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MeetingOwnerType,
  MeetingStatus,
  isSubmitterEditBlockedStatus,
  SUBMITTER_EDIT_BLOCKED_MESSAGE,
} from '@/modules/shared/types';
import { PATH } from '../../routes/paths';
import { DetailPageHeader, MeetingInfo, AttachmentPreviewDrawer, StatusBadge, type MeetingInfoData, getMeetingStatusLabel } from '@/modules/shared';
import { MEETING_PREVIEW_TABS, MeetingPreviewTabs } from './constants';
import { MeetingPreviewTab, InviteesTab, ContentTab, NotesTab, RequestInfoTab } from './tabs';
import { trackEvent } from '@/lib/analytics';
import { getMeetingById } from '@/modules/shared/api';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';


function getNotesTextFromMeeting(meeting: { general_notes?: unknown; content_officer_notes?: string | null; note?: string | null }): string {
  if (meeting.note != null && typeof meeting.note === 'string' && meeting.note.trim()) return meeting.note.trim();
  if (meeting.content_officer_notes != null && typeof meeting.content_officer_notes === 'string' && meeting.content_officer_notes.trim()) return meeting.content_officer_notes.trim();
  const gn = meeting.general_notes;
  if (gn == null) return '-';
  if (typeof gn === 'string' && gn.trim()) return gn.trim();
  if (Array.isArray(gn)) {
    const parts = gn.map((n: { text?: string }) => (n && typeof n.text === 'string' ? n.text.trim() : '')).filter(Boolean) as string[];
    if (parts.length) return parts.join('\n');
  }
  return '-';
}

const PreviewMeeting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(MeetingPreviewTabs.REQUEST_INFO);
  const [previewAttachment, setPreviewAttachment] = useState<{ blob_url: string; file_name: string; file_type?: string } | null>(null);
  const [submitterOpen, setSubmitterOpen] = useState(false);
  const openEditSubmitter = () => { setSubmitterOpen(true); };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id, 'preview'],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (meeting?.id) {
      trackEvent('UC-01', 'uc01_meeting_preview_viewed', { meeting_id: meeting.id });
    }
  }, [meeting?.id]);

  const meetingInfoData = useMemo((): MeetingInfoData => {
    if (!meeting) return {};
    const m = meeting as unknown as Record<string, unknown>;
    return {
      ...meeting as MeetingInfoData,
      is_on_behalf_of: (m.is_on_behalf_of as boolean | undefined) ?? undefined,
      meeting_manager_label: (meeting as { meeting_owner_name?: string }).meeting_owner_name ?? undefined,
      meetingSubject: meeting.meeting_title ?? undefined,
      meetingDescription: meeting.description ?? undefined,
      sector: meeting.sector ?? undefined,
      meetingType: meeting.meeting_type ?? undefined,
      is_urgent: !!(m.urgent_reason as string | undefined),
      urgent_reason: (m.urgent_reason as string | undefined) ?? undefined,
      meeting_start_date: (meeting.scheduled_start ?? meeting.meeting_start_date) ?? undefined,
      meeting_end_date: (meeting as { scheduled_end?: string | null }).scheduled_end ?? undefined,
      meetingChannel: meeting.meeting_channel ?? undefined,
      meeting_location: (m.meeting_location as string | undefined) ?? (m.location as string | undefined) ?? undefined,
      meetingCategory: meeting.meeting_classification ?? undefined,
      meetingReason: meeting.meeting_justification ?? undefined,
      relatedTopic: meeting.related_topic ?? undefined,
      dueDate: meeting.deadline ?? undefined,
      meetingClassification1: meeting.meeting_classification_type ?? undefined,
      meetingConfidentiality: meeting.meeting_confidentiality ?? undefined,
      meetingAgenda: meeting.agenda_items?.map((item) => {
        const ext = item as typeof item & { minister_support_type?: string; minister_support_other?: string; support_type?: string; support_description?: string };
        return {
          id: item.id,
          agenda_item: item.agenda_item ?? '',
          presentation_duration_minutes: item.presentation_duration_minutes ?? 0,
          minister_support_type: ext.minister_support_type ?? ext.support_type,
          minister_support_other: ext.minister_support_other ?? ext.support_description,
        };
      }),
      is_based_on_directive: !!(m.is_based_on_directive === true),
      directive_method:
        (meeting.related_directive_ids && meeting.related_directive_ids.length > 0)
          ? 'DIRECT_DIRECTIVE'
          : ((meeting as { previous_meeting_attachment?: unknown }).previous_meeting_attachment != null || (m.prev_ext_id != null) || (m.previous_meeting_id != null))
            ? 'PREVIOUS_MEETING'
            : (m.directive_method as string | undefined) ?? undefined,
      directive_text: meeting.related_guidance ?? undefined,
      notes: getNotesTextFromMeeting(meeting),
    };
  }, [meeting]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  const statusLabel = getMeetingStatusLabel(meeting.status, MeetingOwnerType.SUBMITTER);

  const handleBack = () => {
    navigate(PATH.MEETINGS);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case MeetingPreviewTabs.MEETING_PREVIEW:
        return <MeetingInfo data={meetingInfoData} dir="rtl" />;
      case MeetingPreviewTabs.REQUEST_INFO:
        return <RequestInfoTab meeting={meeting} />;
      case MeetingPreviewTabs.INVITEES:
        return <InviteesTab invitees={meeting?.invitees as any} />;
      case MeetingPreviewTabs.CONTENT:
        return <ContentTab meeting={meeting as any} onPreviewAttachment={(att) => setPreviewAttachment(att)} />;
      case MeetingPreviewTabs.NOTES:
        return <NotesTab meeting={meeting as any} />;
      default:
        return <MeetingPreviewTab meeting={meeting} />;
    }
  };

  const meetingStatus = meeting?.status as MeetingStatus;
  const submitterEditBlocked = isSubmitterEditBlockedStatus(meetingStatus);

  return (
  <>
    <SubmitterModal open={submitterOpen} onOpenChange={setSubmitterOpen} editMeetingId={meeting.id} excludeColumns={["access_permission", "is_consultant"]} />
   
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-3 px-1">
        <div className="flex flex-col flex-shrink-0 min-w-0 gap-2">
          <DetailPageHeader
            title={meeting?.request_number ? `${meeting?.meeting_title ?? meeting?.meeting_subject ?? 'عرض الطلب'} (${meeting.request_number})` : (meeting?.meeting_title ?? meeting?.meeting_subject ?? 'عرض الطلب')}
            onBack={handleBack}
            statusBadge={<StatusBadge status={meeting.status} label={statusLabel} />}
            editAction={{
              visible: !submitterEditBlocked,
              hasChanges: !submitterEditBlocked,
              onClick: () => openEditSubmitter(),
              label: 'تعديل',
              tooltip: submitterEditBlocked
                ? SUBMITTER_EDIT_BLOCKED_MESSAGE
                : 'تعديل طلب الاجتماع',
            }}
            tabs={MEETING_PREVIEW_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            helpTooltip={{
              title: 'عرض تفاصيل طلب الاجتماع.',
              description: 'يمكنك الاطلاع على معلومات الطلب والاجتماع والمحتوى والمدعوين والملاحظات.',
            }}
          />
        </div>

        {/* Content card */}
        <div
          className="w-full flex-1 min-h-0 flex flex-col overflow-y-auto px-6 py-6 gap-6 rounded-2xl bg-white border border-[#E5E7EB]"
          style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex flex-col w-full flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <AttachmentPreviewDrawer
        open={!!previewAttachment}
        onOpenChange={(open) => { if (!open) setPreviewAttachment(null); }}
        attachment={previewAttachment}
      />
    </div>
  </>
  );
};

export default PreviewMeeting;
