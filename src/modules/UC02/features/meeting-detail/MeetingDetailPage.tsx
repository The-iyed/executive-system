/**
 * UC02 Meeting Detail Page – feature entry point.
 * Thin shell: delegates to useMeetingDetailPage hook + tab components + modals.
 */
import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import {
  MeetingStatus,
  MeetingChannelLabels,
  MeetingOwnerType,
  StatusBadge,
  DetailPageHeader,
  AIGenerateButton,
  FormField,
  FormSwitch,
  FormTextArea,
  formatDateArabic,
  MeetingActionsBar,
  Drawer,
  AttachmentPreviewDrawer,
} from '@/modules/shared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, DateTimePicker,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/lib/ui';
import QualityModal from '../../components/qualityModal';
import { SubmitterModal } from '@/modules/shared/features/meeting-request-form';
import { NotesTab } from '@/modules/UC01/features/PreviewMeeting/tabs/NotesTab';
import { fieldLabels, EDITABLE_FIELD_IDS } from './constants';
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

const MeetingDetailPage: React.FC = () => {
  const h = useMeetingDetailPage();

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

  /* ─── Tab content ─── */
  const renderTabContent = () => {
    switch (h.activeTab) {
      case 'request-info':
        return <RequestInfoTab meeting={meeting} statusLabel={h.statusLabel} />;
      case 'request-notes':
        return <div className="w-full max-w-4xl mx-auto" dir="rtl"><NotesTab meeting={meeting} /></div>;
      case 'meeting-info':
        return <MeetingInfoTab data={h.meetingInfoData} canEdit={false} extraGridSpecs={h.extraGridSpecs} />;
      case 'content':
        return <ContentTab meeting={meeting} onPreviewAttachment={(att) => h.setPreviewAttachment(att)} />;
      case 'schedule':
        return h.isScheduleOfficer ? (
          <ScheduleTab
            scheduleForm={{ requires_protocol: h.scheduleForm.requires_protocol, is_data_complete: h.scheduleForm.is_data_complete, notes: h.scheduleForm.notes }}
            onScheduleFormChange={(updates) => h.setScheduleForm((prev) => ({ ...prev, ...updates }))}
            invitees={meeting?.invitees}
            validationError={h.validationError}
            scheduleMutationSuccess={h.scheduleMutation.isSuccess}
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
            title={`${meeting.meeting_title} (${meeting.request_number})`}
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
                <Button type="button" variant="outline" onClick={() => h.setIsDeleteDraftModalOpen(true)} disabled={h.deleteDraftMutation.isPending} className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  {h.deleteDraftMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                </Button>
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
        <div className="w-full flex-1 min-h-0 min-w-0 flex flex-row overflow-y-auto overflow-x-hidden px-8 py-8 gap-6 rounded-2xl bg-background justify-center border border-border" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-full flex-1 min-h-0 min-w-0 flex flex-row justify-center">
            {renderTabContent()}
          </div>
        </div>

        {/* Actions bar */}
        {meeting && (meeting.status === MeetingStatus.UNDER_REVIEW || meeting.status === MeetingStatus.UNDER_GUIDANCE || meeting.status === MeetingStatus.WAITING || meeting.status === MeetingStatus.SCHEDULED || meeting.status === MeetingStatus.SCHEDULED_SCHEDULING) && (
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
            onAddToWaitingList={() => h.moveToWaitingListMutation.mutate()}
            isAddToWaitingListPending={h.moveToWaitingListMutation.isPending}
            hasChanges={h.hasChanges}
            hasContent={true}
            hideEdit
          />
        )}
      </div>

      {/* ─── Modals / Drawers ─── */}
      <SubmitterModal callerRole={MeetingOwnerType.SCHEDULING} open={h.meetingFormOpen} onOpenChange={h.setMeetingFormOpen} editMeetingId={meeting.id} showAiSuggest />

      {/* Delete draft */}
      <Dialog open={h.isDeleteDraftModalOpen} onOpenChange={(open) => !h.deleteDraftMutation.isPending && h.setIsDeleteDraftModalOpen(open)}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-border bg-background shadow-xl" dir="rtl">
          <DialogHeader className="text-right gap-2">
            <DialogTitle className="text-xl font-semibold text-foreground">حذف المسودة</DialogTitle>
            <DialogDescription className="text-right text-base text-muted-foreground pt-1">هل أنت متأكد من حذف هذه المسودة؟</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-start sm:justify-start mt-6">
            <Button type="button" variant="outline" onClick={() => h.setIsDeleteDraftModalOpen(false)} className="min-w-[100px]" disabled={h.deleteDraftMutation.isPending}>إلغاء</Button>
            <Button type="button" onClick={() => h.id && h.deleteDraftMutation.mutate(h.id)} className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white" disabled={h.deleteDraftMutation.isPending}>
              {h.deleteDraftMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quality modal */}
      <QualityModal isOpen={h.isQualityModalOpen} onOpenChange={h.setIsQualityModalOpen} meetingId={h.id || ''} />

      {/* Reject */}
      <Dialog open={h.isRejectModalOpen} onOpenChange={h.setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">رفض طلب الاجتماع</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (h.rejectForm.reason.trim()) h.rejectMutation.mutate({ reason: h.rejectForm.reason, notes: h.rejectForm.notes }); }}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">سبب الرفض <span className="text-red-500">*</span></label>
                <Input type="text" value={h.rejectForm.reason} onChange={(e) => h.setRejectForm((p) => ({ ...p, reason: e.target.value }))} placeholder="الطلب غير مناسب للجدولة" className="w-full text-right" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">ملاحظات إضافية</label>
                <Textarea value={h.rejectForm.notes} onChange={(e: any) => h.setRejectForm((p) => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية" className="w-full min-h-[100px] text-right" />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button type="button" onClick={() => h.setIsRejectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">تراجع</button>
              <button type="submit" disabled={!h.rejectForm.reason.trim() || h.rejectMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{h.rejectMutation.isPending ? 'جاري الإرسال...' : 'رفض'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={h.isCancelModalOpen} onOpenChange={h.setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إلغاء الاجتماع</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); h.cancelMutation.mutate({ reason: h.cancelForm.reason.trim() || undefined, notes: h.cancelForm.notes.trim() || undefined }); }}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">سبب الإلغاء</label>
                <Input type="text" value={h.cancelForm.reason} onChange={(e) => h.setCancelForm((p) => ({ ...p, reason: e.target.value }))} placeholder="سبب إلغاء الاجتماع" className="w-full text-right" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-right">ملاحظات إضافية</label>
                <Textarea value={h.cancelForm.notes} onChange={(e: any) => h.setCancelForm((p) => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية" className="w-full min-h-[100px] text-right" />
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <button type="button" onClick={() => { h.setIsCancelModalOpen(false); h.setCancelForm({ reason: '', notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">تراجع</button>
              <button type="submit" disabled={h.cancelMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{h.cancelMutation.isPending ? 'جاري الإلغاء...' : 'إلغاء الاجتماع'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit confirm */}
      <Dialog open={h.isEditConfirmOpen} onOpenChange={(open) => { h.setIsEditConfirmOpen(open); if (!open) { h.setValidationError(null); h.setUpdateErrorMessage(null); } }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تأكيد التعديلات</DialogTitle></DialogHeader>
          <div className="py-4">
            {(h.validationError || h.updateErrorMessage) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-right text-sm text-red-600">{h.updateErrorMessage || h.validationError}</p>
              </div>
            )}
            <p className="text-right text-sm text-muted-foreground">سيتم إرسال الحقول التالية للتعديل:</p>
            <ul className="mt-3 list-disc list-inside text-right text-sm text-foreground">
              {Object.keys(h.changedPayload).map((k) => <li key={k}>{fieldLabels[k] || k}</li>)}
            </ul>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={() => h.setIsEditConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-border text-foreground bg-background hover:bg-muted transition-colors">إلغاء</button>
            <button type="button" onClick={() => { h.setValidationError(null); h.updateMutation.mutate({ payload: h.changedPayload }); }} disabled={!h.hasChanges || h.updateMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50">
              {h.updateMutation.isPending ? 'جاري الإرسال...' : 'تأكيد الإرسال'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to content drawer */}
      <Drawer open={h.isSendToContentModalOpen} onOpenChange={h.setIsSendToContentModalOpen} title={<span className="text-right">إرسال للمحتوى</span>} side="left" width={500} bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { h.setIsSendToContentModalOpen(false); h.setSendToContentForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            {meeting?.status !== MeetingStatus.SCHEDULED_SCHEDULING && (
              <button type="button" onClick={() => h.sendToContentMutation.mutate({ notes: h.sendToContentForm.notes, is_draft: true })} disabled={h.sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50">{h.sendToContentMutation.isPending ? 'جاري الإرسال...' : 'حفظ كمسودة'}</button>
            )}
            <button type="submit" form="send-to-content-form" disabled={h.sendToContentMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{h.sendToContentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}</button>
          </div>
        }
      >
        <form id="send-to-content-form" onSubmit={(e) => { e.preventDefault(); h.sendToContentMutation.mutate({ notes: h.sendToContentForm.notes }); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات</label>
            <Textarea value={h.sendToContentForm.notes} onChange={(e: any) => h.setSendToContentForm({ notes: e.target.value })} placeholder="يرجى مراجعة المحتوى قبل الجدولة" className="w-full min-h-[100px] text-right" />
          </div>
        </form>
      </Drawer>

      {/* Approve update drawer */}
      <Drawer open={h.isApproveUpdateModalOpen} onOpenChange={(open) => { if (!open) h.setApproveUpdateForm({ notes: '' }); h.setIsApproveUpdateModalOpen(open); }} title={<span className="text-right">إعتماد التحديث</span>} side="left" width={500} bodyClassName="dir-rtl"
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => { h.setIsApproveUpdateModalOpen(false); h.setApproveUpdateForm({ notes: '' }); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="submit" form="approve-update-form" disabled={h.approveUpdateMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{h.approveUpdateMutation.isPending ? 'جاري الإرسال...' : 'إعتماد التحديث'}</button>
          </div>
        }
      >
        <form id="approve-update-form" onSubmit={(e) => { e.preventDefault(); h.approveUpdateMutation.mutate({ notes: h.approveUpdateForm.notes.trim() || undefined }); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات (اختياري)</label>
            <Textarea value={h.approveUpdateForm.notes} onChange={(e: any) => h.setApproveUpdateForm({ notes: e.target.value })} placeholder="تم اعتماد التحديث" className="w-full min-h-[100px] text-right" />
          </div>
        </form>
      </Drawer>

      {/* Return for info drawer */}
      <Drawer open={h.isReturnForInfoModalOpen} onOpenChange={(open) => { h.setIsReturnForInfoModalOpen(open); if (!open) h.setReturnForInfoNotesError(null); }} title={<span className="text-right">إعادة للطلب</span>} side="left" width={500}
        footer={
          <div className="flex flex-row-reverse gap-2">
            <button type="button" onClick={() => h.setIsReturnForInfoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="submit" form="return-for-info-form" disabled={h.returnForInfoMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{h.returnForInfoMutation.isPending ? 'جاري الإرسال...' : 'إعادة'}</button>
          </div>
        }
      >
        <form id="return-for-info-form" onSubmit={(e) => { e.preventDefault(); const notesTrimmed = h.returnForInfoForm.notes.trim(); if (!notesTrimmed) { h.setReturnForInfoNotesError('الملاحظات مطلوبة'); return; } h.setReturnForInfoNotesError(null); h.returnForInfoMutation.mutate({ notes: notesTrimmed, editable_fields: EDITABLE_FIELD_IDS.filter((fid) => h.returnForInfoForm.editable_fields[fid]) }); }} className="flex flex-col gap-4" dir="rtl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">ملاحظات <span className="text-red-500">*</span></label>
            <Textarea value={h.returnForInfoForm.notes} onChange={(e: any) => h.setReturnForInfoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="يرجى تعديل البيانات المطلوبة" className="w-full min-h-[100px] text-right" />
            {h.returnForInfoNotesError && <p className="text-sm text-red-600 text-right">{h.returnForInfoNotesError}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground text-right">الحقول المطلوب تعديلها</label>
            <div className="grid grid-cols-2 gap-2">
              {EDITABLE_FIELD_IDS.map((fid) => (
                <label key={fid} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={h.returnForInfoForm.editable_fields[fid] ?? false} onChange={(e) => h.setReturnForInfoForm((p) => ({ ...p, editable_fields: { ...p.editable_fields, [fid]: e.target.checked } }))} className="rounded border-border" />
                  {fieldLabels[fid] || fid}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Schedule drawer (non-schedule-officer) */}
      {!h.isScheduleOfficer && (
        <Drawer open={h.isScheduleModalOpen} onOpenChange={h.setIsScheduleModalOpen} title={<span className="text-right">جدولة الاجتماع</span>} side="left" width={500} bodyClassName="dir-rtl"
          footer={
            <div className="flex flex-row-reverse gap-2">
              <button type="button" onClick={() => { h.setIsScheduleModalOpen(false); h.setScheduleForm(h.INITIAL_SCHEDULE_FORM); }} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
              <button type="submit" form="schedule-meeting-form" disabled={!h.scheduleForm.scheduled_at || !h.scheduleForm.scheduled_end_at || h.scheduleMutation.isPending} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">{h.scheduleMutation.isPending ? 'جاري التحميل...' : 'جدولة'}</button>
            </div>
          }
        >
          <form id="schedule-meeting-form" onSubmit={h.handleScheduleSubmit} className="flex flex-col gap-6">
            {h.validationError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-right text-sm text-red-600">{h.validationError}</p></div>}
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت البداية <span className="text-red-500">*</span></label>
                <DateTimePicker value={h.scheduleForm.scheduled_at ? new Date(h.scheduleForm.scheduled_at).toISOString() : undefined} onChange={(iso) => { const d = new Date(iso); const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; h.setScheduleForm((p) => ({ ...p, scheduled_at: dtl, ...((!p.scheduled_end_at || new Date(p.scheduled_end_at) < d) ? { scheduled_end_at: `${new Date(d.getTime()+3600000).getFullYear()}-${String(new Date(d.getTime()+3600000).getMonth()+1).padStart(2,'0')}-${String(new Date(d.getTime()+3600000).getDate()).padStart(2,'0')}T${String(new Date(d.getTime()+3600000).getHours()).padStart(2,'0')}:${String(new Date(d.getTime()+3600000).getMinutes()).padStart(2,'0')}` } : {}) })); }} placeholder="اختر تاريخ ووقت البداية" className="w-full" required minDate={(() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-foreground text-right">تاريخ ووقت النهاية <span className="text-red-500">*</span></label>
                <DateTimePicker value={h.scheduleForm.scheduled_end_at ? new Date(h.scheduleForm.scheduled_end_at).toISOString() : undefined} onChange={(iso) => { const d = new Date(iso); const dtl = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; h.setScheduleForm((p) => ({ ...p, scheduled_end_at: dtl })); }} placeholder="اختر تاريخ ووقت النهاية" className="w-full" required minDate={h.scheduleForm.scheduled_at ? new Date(h.scheduleForm.scheduled_at) : undefined} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-2">
              <label className="text-[14px] font-medium text-foreground text-right">قناة الاجتماع <span className="text-red-500">*</span></label>
              <Select value={h.scheduleForm.meeting_channel} onValueChange={(v) => h.setScheduleForm((p) => ({ ...p, meeting_channel: v as any }))}>
                <SelectTrigger className="w-full h-11 bg-background border border-border rounded-lg text-right flex-row-reverse"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="PHYSICAL">حضوري</SelectItem>
                  <SelectItem value="VIRTUAL">عن بُعد</SelectItem>
                  <SelectItem value="HYBRID">مختلط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-4">
              <FormField label="مبدئي" className="w-full max-w-none h-auto"><FormSwitch checked={!h.scheduleForm.requires_protocol} onCheckedChange={(c) => h.setScheduleForm((p) => ({ ...p, requires_protocol: !c }))} /></FormField>
              <FormField label="البيانات مكتملة" className="w-full max-w-none h-auto"><FormSwitch checked={h.scheduleForm.is_data_complete} onCheckedChange={(c) => h.setScheduleForm((p) => ({ ...p, is_data_complete: c }))} /></FormField>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <FormTextArea label="ملاحظات" value={h.scheduleForm.notes} onChange={(e: any) => h.setScheduleForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Meeting scheduled successfully" containerClassName="!px-0 !mx-0" fullWidth={false} />
            </div>
          </form>
        </Drawer>
      )}

      {/* Schedule confirm modal (schedule officer) */}
      <Dialog open={h.scheduleConfirmModalOpen} onOpenChange={h.setScheduleConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تأكيد الجدولة</DialogTitle></DialogHeader>
          <div className="py-4">
            {(() => {
              const { start, end } = h.getEffectiveScheduleDates(meeting, h.scheduleForm);
              return (
                <div className="flex flex-col gap-2 text-sm text-foreground">
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">البداية</span><span>{start ? formatDateArabic(start) : '—'}</span></div>
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">النهاية</span><span>{end ? formatDateArabic(end) : '—'}</span></div>
                  <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">القناة</span><span>{MeetingChannelLabels[meeting?.meeting_channel as string] ?? MeetingChannelLabels[h.scheduleForm.meeting_channel] ?? '—'}</span></div>
                </div>
              );
            })()}
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button type="button" onClick={() => h.setScheduleConfirmModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">إلغاء</button>
            <button type="button" disabled={h.scheduleMutation.isPending} onClick={() => h.handleScheduleSubmit({ preventDefault: () => {} } as any)} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50">
              {h.scheduleMutation.isPending ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDrawer open={!!h.previewAttachment} onOpenChange={(open) => { if (!open) h.setPreviewAttachment(null); }} attachment={h.previewAttachment} />
    </div>
  );
};

export default MeetingDetailPage;
