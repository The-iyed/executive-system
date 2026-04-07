/**
 * UC05 Content Request Detail Page – feature entry point.
 * Thin shell: delegates to useContentRequestDetailPage hook + tab components + modal components.
 */
import React from 'react';
import { Send, RotateCcw, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '@/modules/shared/components/confirm-dialog/ConfirmDialog';
import { MeetingStatus, StatusBadge, DetailPageHeader, MeetingActionsBar, AttachmentPreviewDrawer } from '@/modules/shared';
import { useContentRequestDetailPage } from './hooks/useContentRequestDetailPage';
import { RequestInfoTab } from './tabs/RequestInfoTab';
import { MeetingInfoTab } from './tabs/MeetingInfoTab';
import { ContentTab } from './tabs/ContentTab';
import { ConsultationsTab } from './tabs/ConsultationsTab';
import { InviteesTab } from './tabs/InviteesTab';
import { NotesTab } from './tabs/NotesTab';
import { ReturnModal, DraftsModal } from './components';

const ContentRequestDetailPage: React.FC = () => {
  const h = useContentRequestDetailPage();

  if (h.isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-semibold text-foreground">جاري تحميل البيانات</p>
            <p className="text-[13px] text-muted-foreground">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (h.error || !h.contentRequest) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="text-[15px] font-bold text-foreground">حدث خطأ أثناء تحميل البيانات</p>
          <button type="button" onClick={() => h.navigate(-1)} className="px-5 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors shadow-sm">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const { contentRequest } = h;
  const showActionsBar = h.meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT && h.meetingStatus !== MeetingStatus.SCHEDULED_ADDITIONAL_INFO;

  const renderTabContent = () => {
    switch (h.activeTab) {
      case 'request-info': return <RequestInfoTab contentRequest={contentRequest} />;
      case 'meeting-info': return <MeetingInfoTab contentRequest={contentRequest} />;
      case 'content': return <ContentTab h={h} />;
      case 'directives-log': return <ConsultationsTab h={h} />;
      case 'invitees': return <InviteesTab invitees={contentRequest.invitees} />;
      case 'notes': return <NotesTab schedulingContentNote={h.schedulingContentNote} />;
      default: return <RequestInfoTab contentRequest={contentRequest} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden overflow-x-hidden min-w-0" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-3 pr-5 min-w-0">
        {/* Header */}
        <div className="flex flex-col flex-shrink-0 min-w-0 gap-2">
          <DetailPageHeader
            title={contentRequest.request_number ? `${contentRequest.meeting_title} (${contentRequest.request_number})` : contentRequest.meeting_title}
            onBack={() => h.navigate(-1)}
            statusBadge={<StatusBadge status={h.meetingStatus} label={h.statusLabel} className="flex-shrink-0" />}
            tabs={h.tabs}
            activeTab={h.activeTab}
            onTabChange={h.setActiveTab}
          />
        </div>

        {/* Content card */}
        <div className="w-full flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-background px-8 pt-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="mx-auto flex w-full min-w-0 flex-col items-center">
            <div className="w-full">{renderTabContent()}</div>
            <div aria-hidden="true" className={showActionsBar ? 'h-28 md:h-32 flex-shrink-0' : 'h-8 flex-shrink-0'} />
          </div>
        </div>

        {/* Actions bar */}
        {showActionsBar && (
          <MeetingActionsBar
            meetingStatus={MeetingStatus.UNDER_REVIEW}
            open={h.actionsBarOpen}
            onOpenChange={h.setActionsBarOpen}
            onOpenSchedule={() => {}}
            onOpenReject={() => {}}
            onOpenEditConfirm={() => {}}
            onOpenReturnForInfo={() => {}}
            onOpenSendToContent={() => {}}
            onAddToWaitingList={() => {}}
            isAddToWaitingListPending={false}
            hasChanges={false}
            hasContent={false}
            customActions={[
              {
                icon: h.sendToSchedulingMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.26} /> : <Send className="w-5 h-5" strokeWidth={1.26} />,
                label: h.sendToSchedulingMutation.isPending ? 'جاري الإرسال...' : 'إرسال إلى مسؤول الجدولة',
                onClick: h.handleSendToScheduling,
                disabled: h.sendToSchedulingMutation.isPending || !h.hasDirectives,
                disabledReason: !h.hasDirectives
                  ? 'يرجى إضافة توجيه واحد على الأقل أولاً'
                  : undefined,
              },
              {
                icon: <RotateCcw className="w-5 h-5" strokeWidth={1.26} />,
                label: 'إعادة للطلب',
                onClick: () => h.setIsReturnModalOpen(true),
                disabled: h.submitReturnMutation.isPending,
              },
              ...(h.draftsRecords.length > 0
                ? [{
                    icon: <MessageSquare className="w-5 h-5" strokeWidth={1.26} />,
                    label: `مسودات (${h.draftsRecords.length})`,
                    onClick: () => h.setIsDraftsModalOpen(true),
                  }]
                : []),
            ]}
          />
        )}
      </div>

      {/* Modals */}
      <ReturnModal
        open={h.isReturnModalOpen}
        onOpenChange={h.setIsReturnModalOpen}
        returnNotes={h.returnNotes}
        onNotesChange={h.setReturnNotes}
        onSubmit={h.handleSubmitReturn}
        isPending={h.submitReturnMutation.isPending}
      />

      <DraftsModal
        open={h.isDraftsModalOpen}
        onOpenChange={h.setIsDraftsModalOpen}
        draftsRecords={h.draftsRecords}
        isLoading={h.isLoadingConsultationRecordsWithDrafts}
        onPublishDraft={h.handlePublishDraft}
        isPublishing={h.publishDraftMutation.isPending}
      />

      <AttachmentPreviewDrawer
        open={!!h.previewAttachment}
        onOpenChange={(open) => { if (!open) h.setPreviewAttachment(null); }}
        attachment={h.previewAttachment}
      />
    </div>
  );
};

export default ContentRequestDetailPage;
