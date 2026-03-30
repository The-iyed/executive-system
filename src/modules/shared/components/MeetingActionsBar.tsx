import React from 'react';
import { CalendarMinus, CheckCircle, Plus, Pencil, RotateCcw, Send, X, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/ui';
import { MeetingStatus } from '../types';

export interface ActionBarItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
  disabledReason?: string;
}

export interface MeetingActionsBarProps {
  meetingStatus: MeetingStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSchedule: () => void;
  onOpenReject: () => void;
  onOpenCancel?: () => void;
  onOpenEditConfirm: () => void;
  onOpenReturnForInfo: () => void;
  onOpenSendToContent: () => void;
  onOpenApproveUpdate?: () => void;
  onAddToWaitingList: () => void;
  isAddToWaitingListPending: boolean;
  hasChanges: boolean;
  hasContent: boolean;
  hasPresentation?: boolean;
  customActions?: ActionBarItem[];
  hideEdit?: boolean;
}

export const MeetingActionsBar: React.FC<MeetingActionsBarProps> = ({
  meetingStatus,
  open,
  onOpenChange,
  onOpenSchedule,
  onOpenReject,
  onOpenCancel,
  onOpenEditConfirm,
  onOpenReturnForInfo,
  onOpenSendToContent,
  onOpenApproveUpdate,
  onAddToWaitingList,
  isAddToWaitingListPending,
  hasChanges,
  hasContent,
  hasPresentation = true,
  customActions,
  hideEdit = false,
}) => {
  const close = () => onOpenChange(false);

  const defaultUnderReviewActions: ActionBarItem[] = [
    { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.26} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
    ...(hideEdit ? [] : [{ icon: <Pencil className="w-5 h-5" strokeWidth={1.26} />, label: 'تعديل', onClick: () => { close(); onOpenEditConfirm(); }, disabled: !hasChanges, disabledReason: 'لا يوجد تغييرات لحفظها' }]),
    { icon: <RotateCcw className="w-5 h-5" strokeWidth={1.26} />, label: 'إعادة للطلب', onClick: () => { close(); onOpenReturnForInfo(); } },
    { icon: <Send className="w-5 h-5" strokeWidth={1.26} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasContent && hasPresentation && onOpenSendToContent(); }, disabled: !hasContent || !hasPresentation, disabledReason: !hasPresentation ? 'لإرسال المحتوى، يرجى تعديل الاجتماع وإرفاق عرض تقديمي في تبويب المحتوى أولاً' : 'أضف أهدافاً أو بنود أجندة في تبويب المحتوى لتفعيل الإرسال' },
    { icon: <Plus className="w-5 h-5" strokeWidth={1.26} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
    { icon: <X className="w-5 h-5" strokeWidth={1.26} />, label: 'رفض', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
  ];

  const scheduledSchedulingActions: ActionBarItem[] = [
    { icon: <RotateCcw className="w-5 h-5" strokeWidth={1.26} />, label: 'إعادة', onClick: () => { close(); onOpenReturnForInfo(); } },
    ...(onOpenApproveUpdate ? [{ icon: <CheckCircle className="w-5 h-5" strokeWidth={1.26} />, label: 'إعتماد التحديث', onClick: () => { close(); onOpenApproveUpdate(); } }] : []),
    { icon: <Send className="w-5 h-5" strokeWidth={1.26} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasPresentation && onOpenSendToContent(); }, disabled: !hasPresentation, disabledReason: 'لإرسال المحتوى، يرجى تعديل الاجتماع وإرفاق عرض تقديمي في تبويب المحتوى أولاً' },
  ];

  const actions: ActionBarItem[] =
    customActions && customActions.length > 0
      ? customActions.map((a) => ({ ...a, onClick: () => { close(); a.onClick(); } }))
      : meetingStatus === MeetingStatus.SCHEDULED_SCHEDULING
      ? scheduledSchedulingActions
      : meetingStatus === MeetingStatus.SCHEDULED
      ? [
          { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.26} />, label: 'جدولة مجدداً', onClick: () => { close(); onOpenSchedule(); } },
          { icon: <Plus className="w-5 h-5" strokeWidth={1.26} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
          { icon: <X className="w-5 h-5" strokeWidth={1.26} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenCancel ? onOpenCancel() : onOpenReject(); } },
        ]
      : meetingStatus === MeetingStatus.WAITING
        ? [
            { icon: <X className="w-5 h-5" strokeWidth={1.26} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
            { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.26} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
          ]
        : defaultUnderReviewActions;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق"
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px] animate-in fade-in-0 duration-200"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2"
        dir="rtl"
      >
        {open && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center gap-2">
            {actions.map((action, i) => {
              const isDanger = action.variant === 'danger';
              const pill = (
                <button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`
                    flex items-center gap-3 min-w-[180px] rounded-2xl px-4 py-2.5 shadow-md border
                    backdrop-blur-md transition-all duration-200 touch-manipulation
                    animate-in fade-in-0 slide-in-from-bottom-3
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDanger
                      ? 'bg-red-50/90 border-red-200/60 text-red-600 hover:bg-red-100 hover:shadow-lg hover:scale-[1.03]'
                      : 'bg-white/95 border-gray-200/60 text-gray-700 hover:bg-white hover:shadow-lg hover:scale-[1.03]'
                    }
                  `}
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <span className={`flex-shrink-0 ${isDanger ? 'text-red-500' : 'text-[#048F86]'}`}>
                    {action.icon}
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              );

              if (action.disabled && action.disabledReason) {
                return (
                  <TooltipProvider key={i} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">{pill}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-right font-sans">
                        {action.disabledReason}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return pill;
            })}
          </div>
        )}
        <button
          type="button"
          aria-label={open ? 'إغلاق القائمة' : 'إجراءات سريعة'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full shadow-lg
            transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation
            ${open
              ? 'bg-gray-100 border border-gray-200'
              : 'bg-gradient-to-br from-[#048F86] via-[#069E95] to-[#0BB5AA] border border-white/30'
            }
          `}
        >
          <Zap
            className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-45 text-gray-600' : 'text-white'}`}
            strokeWidth={2}
          />
        </button>
      </div>
    </>
  );
};

export default MeetingActionsBar;
