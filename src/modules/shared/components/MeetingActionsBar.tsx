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
    { icon: <CalendarMinus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
    ...(hideEdit ? [] : [{ icon: <Pencil className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'تعديل', onClick: () => { close(); onOpenEditConfirm(); }, disabled: !hasChanges, disabledReason: 'لا يوجد تغييرات لحفظها' }]),
    { icon: <RotateCcw className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إعادة للطلب', onClick: () => { close(); onOpenReturnForInfo(); } },
    { icon: <Send className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasContent && hasPresentation && onOpenSendToContent(); }, disabled: !hasContent || !hasPresentation, disabledReason: !hasPresentation ? 'لإرسال المحتوى، يرجى تعديل الاجتماع وإرفاق عرض تقديمي في تبويب المحتوى أولاً' : 'أضف أهدافاً أو بنود أجندة في تبويب المحتوى لتفعيل الإرسال' },
    { icon: <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
    { icon: <X className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'رفض', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
  ];

  const scheduledSchedulingActions: ActionBarItem[] = [
    { icon: <RotateCcw className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إعادة', onClick: () => { close(); onOpenReturnForInfo(); } },
    ...(onOpenApproveUpdate ? [{ icon: <CheckCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إعتماد التحديث', onClick: () => { close(); onOpenApproveUpdate(); } }] : []),
    { icon: <Send className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasPresentation && onOpenSendToContent(); }, disabled: !hasPresentation, disabledReason: 'لإرسال المحتوى، يرجى تعديل الاجتماع وإرفاق عرض تقديمي في تبويب المحتوى أولاً' },
  ];

  const actions: ActionBarItem[] =
    customActions && customActions.length > 0
      ? customActions.map((a) => ({ ...a, onClick: () => { close(); a.onClick(); } }))
      : meetingStatus === MeetingStatus.SCHEDULED_SCHEDULING
      ? scheduledSchedulingActions
      : meetingStatus === MeetingStatus.SCHEDULED
      ? [
          { icon: <CalendarMinus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'جدولة مجدداً', onClick: () => { close(); onOpenSchedule(); } },
          { icon: <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'إضافة إلى قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
          { icon: <X className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenCancel ? onOpenCancel() : onOpenReject(); } },
        ]
      : meetingStatus === MeetingStatus.WAITING
        ? [
            { icon: <X className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
            { icon: <CalendarMinus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
          ]
        : defaultUnderReviewActions;

  // Separate danger actions from normal ones
  const normalActions = actions.filter(a => a.variant !== 'danger');
  const dangerActions = actions.filter(a => a.variant === 'danger');

  const renderActionItem = (action: ActionBarItem, i: number, isDanger: boolean, isLast: boolean) => {
    const item = (
      <button
        key={i}
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className={`
          flex items-center gap-3 w-full rounded-xl px-4 py-3
          transition-colors duration-150 touch-manipulation
          disabled:opacity-40 disabled:cursor-not-allowed
          ${isDanger
            ? 'bg-red-50/50 hover:bg-red-100/70 text-red-600'
            : 'hover:bg-gray-50/80 text-gray-800'
          }
        `}
        style={{
          animationDelay: `${i * 30}ms`,
          animationFillMode: 'both',
        }}
      >
        <span className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${isDanger ? 'bg-red-100' : 'bg-[#048F86]/10'}
        `}>
          <span className={isDanger ? 'text-red-500' : 'text-[#048F86]'}>
            {action.icon}
          </span>
        </span>
        <span className="text-[13px] font-medium whitespace-nowrap">
          {action.label}
        </span>
      </button>
    );

    const wrappedItem = (
      <div key={i} className="animate-in fade-in-0 slide-in-from-bottom-2" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
        {!isLast && !isDanger && (
          <div className="mx-3 border-b border-gray-100/80" />
        )}
        {item}
      </div>
    );

    if (action.disabled && action.disabledReason) {
      return (
        <TooltipProvider key={i} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {wrappedItem}
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[260px] text-right font-sans">
              {action.disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return wrappedItem;
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[6px] animate-in fade-in-0 duration-200"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2"
        dir="rtl"
      >
        {open && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[220px] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{ transformOrigin: 'bottom center' }}
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 p-2 flex flex-col">
              {normalActions.map((action, i) =>
                renderActionItem(action, i, false, i === normalActions.length - 1)
              )}
              {dangerActions.length > 0 && (
                <div className="mt-1">
                  {dangerActions.map((action, i) =>
                    renderActionItem(action, normalActions.length + i, true, true)
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label={open ? 'إغلاق القائمة' : 'إجراءات سريعة'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            hover:scale-105 active:scale-95 touch-manipulation
            ${open
              ? 'bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 shadow-lg'
              : 'bg-white border-2 border-[#048F86]/20 shadow-[0_2px_16px_rgba(4,143,134,0.15)]'
            }
          `}
        >
          {open ? (
            <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
          ) : (
            <Zap className="w-5 h-5 text-white" strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  );
};

export default MeetingActionsBar;
