/**
 * UC02 Meeting Detail Page – feature entry point.
 * Thin shell: delegates to useMeetingDetailPage hook + tab components + modal components.
 */
import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitDraft } from '@/modules/shared/features/meeting-request-form/api/submitDraft';
import { useToast } from '@/lib/ui';
import {
  MeetingStatus,
  MeetingOwnerType,
  StatusBadge,
  DetailPageHeader,
  AIGenerateButton,
  MeetingActionsBar,
  AttachmentPreviewDrawer,
} from '@/modules/shared';
import { Button } from '@/lib/ui';
import QualityModal from '../../components/qualityModal';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';
import { RequestNotesView, mapMeetingToRequestNotes } from '@/modules/shared/features/request-notes';
import { useMeetingDetailPage } from './hooks/useMeetingDetailPage';

// Tabs
import { RequestInfoTab } from './tabs/RequestInfoTab';
import { MeetingInfoTab } from './tabs/MeetingInfoTab';
import { ContentTab } from './tabs/ContentTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { InviteesTab } from './tabs/InviteesTab';
import { SchedulingConsultationChatTab } from './tabs/SchedulingConsultationChatTab';
import { DirectiveChatTab } from './tabs/DirectiveChatTab';
import { DirectivesTab } from './tabs/DirectivesTab';
import { MeetingDocumentationTab } from './tabs/MeetingDocumentationTab';

// Components (modals / drawers)
import {
  RejectDialog,
  
  EditConfirmDialog,
  SendToContentDrawer,
  ApproveUpdateDrawer,
  ReturnForInfoDrawer,
  ScheduleDrawer,
  ScheduleConfirmDialog,
} from './components';
import { ConfirmDialog } from '@/modules/shared/components/confirm-dialog';

const MeetingDetailSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto pb-16 animate-pulse" dir="rtl">
    {/* Header skeleton */}
    <div className="flex items-start justify-end gap-3" dir="ltr">
      <div className="text-right space-y-2">
        <div className="h-5 w-40 bg-muted rounded-lg" />
        <div className="h-4 w-56 bg-muted/60 rounded-lg" />
      </div>
      <div className="w-11 h-11 rounded-xl bg-muted" />
    </div>

    {/* Fields grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="h-4 w-24 bg-muted/60 rounded" />
          <div className="h-12 w-full bg-muted/40 rounded-2xl border border-border/20" />
        </div>
      ))}
    </div>

    {/* Content skeleton */}
    <div className="flex flex-col gap-3">
      <div className="h-5 w-32 bg-muted rounded-lg" />
      <div className="h-32 w-full bg-muted/30 rounded-xl border border-border/20" />
    </div>
  </div>
);

const MeetingDetailPage: React.FC = () => {
  const h = useMeetingDetailPage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Submit draft mutation
  const [isSubmitDraftConfirmOpen, setIsSubmitDraftConfirmOpen] = useState(false);
  const submitDraftMutation = useMutation({
    mutationFn: () => submitDraft(h.id!),
    onSuccess: () => {
      toast({ title: 'تم إرسال الطلب للمراجعة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['meeting', h.id] });
      queryClient.invalidateQueries({ queryKey: ['meeting-draft', h.id] });
      queryClient.invalidateQueries({ queryKey: ['work-basket', 'uc02'] });
      setIsSubmitDraftConfirmOpen(false);
    },
    onError: (err) => {
      toast({ title: err instanceof Error ? err.message : 'فشل إرسال الطلب', variant: 'destructive' });
    },
  });

  const handleSubmitSuccess = React.useCallback(() => {
    h.setActiveTab('meeting-info');
  }, [h]);

  /* ─── Loading / Error ─── */
  if (h.isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-semibold text-foreground">جاري تحميل بيانات الاجتماع</p>
            <p className="text-[13px] text-muted-foreground">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (h.error || !h.meeting) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-[15px] font-bold text-foreground">حدث خطأ أثناء تحميل البيانات</p>
          <button type="button" onClick={() => h.navigate(-1)} className="px-5 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted transition-colors shadow-sm">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const { meeting } = h;
  const hasFloatingActionsBar = !!(
    meeting && (
      meeting.status === MeetingStatus.DRAFT ||
      meeting.status === MeetingStatus.UNDER_REVIEW ||
      meeting.status === MeetingStatus.UNDER_GUIDANCE ||
      meeting.status === MeetingStatus.WAITING ||
      meeting.status === MeetingStatus.SCHEDULED ||
      meeting.status === MeetingStatus.SCHEDULED_SCHEDULING
    )
  );

  /* ─── Tab content ─── */
  const renderTabContent = () => {
    switch (h.activeTab) {
      case 'request-info':
        return <RequestInfoTab meeting={meeting} statusLabel={h.statusLabel} />;
      case 'request-notes':
        return <div className="w-full max-w-4xl mx-auto" dir="rtl"><RequestNotesView data={mapMeetingToRequestNotes(meeting)} /></div>;
      case 'meeting-info':
        return <MeetingInfoTab meeting={meeting} extraFields={h.meetingInfoExtraFields} channelOverride={h.scheduleForm.meeting_channel} locationOverride={h.scheduleForm.location} notesOverride={h.meetingInfoNotes} />;
      case 'content':
        return <ContentTab meeting={meeting} onPreviewAttachment={(att) => h.setPreviewAttachment(att)} />;
      case 'schedule':
        return h.isScheduleOfficer ? (
          <ScheduleTab
            invitees={meeting?.invitees}
            validationError={h.validationError}
          />
        ) : null;
      case 'attendees':
        return !h.isScheduleOfficer ? <InviteesTab invitees={meeting?.invitees} /> : null;
      case 'scheduling-consultation':
        return <SchedulingConsultationChatTab meetingId={h.id!} meetingStatus={h.meetingStatus} />;
      case 'directive':
        return <DirectiveChatTab meetingId={h.id!} meetingStatus={h.meetingStatus} />;
      case 'directives':
        return h.meetingStatus === MeetingStatus.CLOSED ? <DirectivesTab meeting={meeting} /> : null;
      case 'meeting-documentation':
        return <MeetingDocumentationTab meetingTitle={meeting?.meeting_title ?? undefined} />;
      default:
        return <RequestInfoTab meeting={meeting} statusLabel={h.statusLabel} />;
    }
  };

  /* ─── Render ─── */
  return (
    <div className="w-full h-full flex flex-col overflow-hidden overflow-x-hidden min-w-0" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-3 pr-5 min-w-0">
        {/* Header */}
        <div className="flex flex-col flex-shrink-0 min-w-0 gap-2">
          <DetailPageHeader
            title={meeting.request_number ? `${meeting.meeting_title} (${meeting.request_number})` : meeting.meeting_title}
            subtitle="مراجعة وإدارة الجدول الزمني للاجتماعات والأنشطة."
            onBack={() => h.navigate(-1)}
            statusBadge={<StatusBadge status={h.meetingStatus} label={h.statusLabel} className="flex-shrink-0" />}
            hasChanges={h.hasChanges}
            editAction={{
              visible: true,
              hasChanges: h.hasChanges,
              opensForm: true,
              tooltip: 'فتح نموذج التعديل',
              onClick: () => h.setMeetingFormOpen(true),
            }}
            secondaryAction={
              h.meetingStatus === MeetingStatus.DRAFT ? (
                <button type="button" onClick={() => h.setIsDeleteDraftModalOpen(true)} disabled={h.deleteDraftMutation.isPending} className="flex items-center gap-2 px-5 py-2 rounded-xl text-red-500 text-sm font-semibold bg-white border border-red-300 hover:bg-red-50 hover:border-red-400 hover:text-red-600 hover:shadow-md hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                  {h.deleteDraftMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                </button>
              ) : undefined
            }
            primaryAction={<AIGenerateButton label="تقييم جاهزية الاجتماع" onClick={() => h.setIsQualityModalOpen(true)} />}
            tabs={h.tabs}
            activeTab={h.activeTab}
            onTabChange={h.setActiveTab}
            helpTooltip={h.permissionTooltip}
          />
        </div>

        {/* Content card */}
        <div className="w-full flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-background px-8 pt-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="mx-auto flex w-full min-w-0 flex-col items-center">
            <div className="w-full">
              {(h.isFetching || h.isRefreshingAfterEdit) && !h.isLoading ? <MeetingDetailSkeleton /> : renderTabContent()}
            </div>
            <div aria-hidden="true" className={hasFloatingActionsBar ? 'h-28 md:h-32 flex-shrink-0' : 'h-8 flex-shrink-0'} />
          </div>
        </div>

        {/* Actions bar */}
        {hasFloatingActionsBar && (
          <MeetingActionsBar
            meetingStatus={h.meetingStatus}
            open={h.actionsBarOpen}
            onOpenChange={h.setActionsBarOpen}
            onOpenSchedule={h.isScheduleOfficer ? () => h.setScheduleConfirmModalOpen(true) : () => h.setIsScheduleModalOpen(true)}
            onOpenReject={() => h.setIsRejectModalOpen(true)}
            onOpenCancel={meeting.status === MeetingStatus.SCHEDULED ? () => h.setIsCancelModalOpen(true) : undefined}
            onOpenEditConfirm={() => h.setIsEditConfirmOpen(true)}
            onOpenReturnForInfo={() => h.setIsReturnForInfoModalOpen(true)}
            onOpenSendToContent={() => h.setIsSendToContentModalOpen(true)}
            onOpenApproveUpdate={meeting.status === MeetingStatus.SCHEDULED_SCHEDULING ? () => h.setIsApproveUpdateModalOpen(true) : undefined}
            onAddToWaitingList={() => h.setIsWaitingListConfirmOpen(true)}
            isAddToWaitingListPending={h.moveToWaitingListMutation.isPending}
            hasChanges={h.hasChanges}
            hasContent={true}
            hasPresentation={meeting?.attachments?.some(a => a.is_presentation) ?? false}
            hideEdit
          />
        )}
      </div>

      {/* ─── Modals / Drawers ─── */}
      <QualityModal isOpen={h.isQualityModalOpen} onOpenChange={h.setIsQualityModalOpen} meetingId={meeting.id} />
      <SubmitterModal callerRole={MeetingOwnerType.SCHEDULING} open={h.meetingFormOpen} onOpenChange={h.setMeetingFormOpen} editMeetingId={meeting.id} showAiSuggest onSubmitSuccess={handleSubmitSuccess} />

      <ConfirmDialog
        open={h.isDeleteDraftModalOpen}
        onOpenChange={h.setIsDeleteDraftModalOpen}
        title="حذف المسودة"
        description="هل أنت متأكد من حذف هذه المسودة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="تأكيد الحذف"
        loadingLabel="جاري الحذف..."
        onConfirm={() => h.id && h.deleteDraftMutation.mutate(h.id)}
        isLoading={h.deleteDraftMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={h.isWaitingListConfirmOpen}
        onOpenChange={h.setIsWaitingListConfirmOpen}
        title="إضافة إلى قائمة الانتظار"
        description="هل أنت متأكد من إضافة هذا الاجتماع إلى قائمة الانتظار؟"
        confirmLabel="تأكيد الإضافة"
        loadingLabel="جاري الإضافة..."
        onConfirm={() => h.moveToWaitingListMutation.mutate()}
        isLoading={h.moveToWaitingListMutation.isPending}
        variant="warning"
      />


      <RejectDialog
        open={h.isRejectModalOpen}
        onOpenChange={h.setIsRejectModalOpen}
        form={h.rejectForm}
        onFormChange={h.setRejectForm}
        onSubmit={(data) => h.rejectMutation.mutate(data)}
        isPending={h.rejectMutation.isPending}
      />

      <ConfirmDialog
        open={h.isCancelModalOpen}
        onOpenChange={h.setIsCancelModalOpen}
        title="إلغاء الاجتماع"
        description="هل أنت متأكد من إلغاء هذا الاجتماع؟"
        confirmLabel="تأكيد الإلغاء"
        loadingLabel="جاري الإلغاء..."
        onConfirm={() => h.cancelMutation.mutate({})}
        isLoading={h.cancelMutation.isPending}
        variant="danger"
      />

      <EditConfirmDialog
        open={h.isEditConfirmOpen}
        onOpenChange={(open) => { h.setIsEditConfirmOpen(open); if (!open) { h.setValidationError(null); h.setUpdateErrorMessage(null); } }}
        changedPayload={h.changedPayload}
        hasChanges={h.hasChanges}
        validationError={h.validationError}
        updateErrorMessage={h.updateErrorMessage}
        onConfirm={() => { h.setValidationError(null); h.updateMutation.mutate({ payload: h.changedPayload }); }}
        onClose={() => h.setIsEditConfirmOpen(false)}
        isPending={h.updateMutation.isPending}
      />

      <SendToContentDrawer
        open={h.isSendToContentModalOpen}
        onOpenChange={h.setIsSendToContentModalOpen}
        form={h.sendToContentForm}
        onFormChange={h.setSendToContentForm}
        onSubmit={(data) => h.sendToContentMutation.mutate(data)}
        isPending={h.sendToContentMutation.isPending}
        meetingStatus={meeting?.status}
      />

      <ApproveUpdateDrawer
        open={h.isApproveUpdateModalOpen}
        onOpenChange={h.setIsApproveUpdateModalOpen}
        form={h.approveUpdateForm}
        onFormChange={h.setApproveUpdateForm}
        onSubmit={(data) => h.approveUpdateMutation.mutate(data)}
        isPending={h.approveUpdateMutation.isPending}
      />

      <ReturnForInfoDrawer
        open={h.isReturnForInfoModalOpen}
        onOpenChange={h.setIsReturnForInfoModalOpen}
        notes={h.returnForInfoNotes}
        onNotesChange={h.setReturnForInfoNotes}
        onSubmit={(data) => h.returnForInfoMutation.mutate(data)}
        isPending={h.returnForInfoMutation.isPending}
        notesError={h.returnForInfoNotesError}
        onNotesErrorChange={h.setReturnForInfoNotesError}
      />

      {!h.isScheduleOfficer && (
        <ScheduleDrawer
          open={h.isScheduleModalOpen}
          onOpenChange={h.setIsScheduleModalOpen}
          form={h.scheduleForm}
          onFormChange={h.setScheduleForm}
          onSubmit={h.handleScheduleSubmit}
          isPending={h.scheduleMutation.isPending}
          validationError={h.validationError}
          initialForm={h.INITIAL_SCHEDULE_FORM}
        />
      )}

      <ScheduleConfirmDialog
        open={h.scheduleConfirmModalOpen}
        onOpenChange={h.setScheduleConfirmModalOpen}
        startDate={(() => { const { start } = h.getEffectiveScheduleDates(meeting, h.scheduleForm); return start; })()}
        endDate={(() => { const { end } = h.getEffectiveScheduleDates(meeting, h.scheduleForm); return end; })()}
        meetingChannel={meeting?.meeting_channel as string}
        scheduleFormChannel={h.scheduleForm.meeting_channel}
        requiresProtocol={h.scheduleForm.requires_protocol}
        isDataComplete={h.scheduleForm.is_data_complete}
        location={h.scheduleForm.location || h.scheduleForm.location_option || ''}
        onConfirm={() => h.handleScheduleSubmit({ preventDefault: () => {} } as any)}
        isPending={h.scheduleMutation.isPending}
        validationError={h.validationError}
        notes={h.scheduleForm.notes}
        onNotesChange={(v) => h.setScheduleForm(prev => ({ ...prev, notes: v }))}
        onRequiresProtocolChange={(v) => h.setScheduleForm(prev => ({ ...prev, requires_protocol: v }))}
        onDataCompleteChange={(v) => h.setScheduleForm(prev => ({ ...prev, is_data_complete: v }))}
      />

      <AttachmentPreviewDrawer open={!!h.previewAttachment} onOpenChange={(open) => { if (!open) h.setPreviewAttachment(null); }} attachment={h.previewAttachment} />
    </div>
  );
};

export default MeetingDetailPage;
