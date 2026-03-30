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
    { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.8} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
    ...(hideEdit ? [] : [{ icon: <Pencil className="w-5 h-5" strokeWidth={1.8} />, label: 'تعديل', onClick: () => { close(); onOpenEditConfirm(); }, disabled: !hasChanges, disabledReason: 'لا يوجد تغييرات لحفظها' }]),
    { icon: <RotateCcw className="w-5 h-5" strokeWidth={1.8} />, label: 'إعادة للطلب', onClick: () => { close(); onOpenReturnForInfo(); } },
    { icon: <Send className="w-5 h-5" strokeWidth={1.8} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasContent && hasPresentation && onOpenSendToContent(); }, disabled: !hasContent || !hasPresentation, disabledReason: !hasPresentation ? 'يرجى إرفاق عرض تقديمي أولاً' : 'أضف أهدافاً أو بنود أجندة أولاً' },
    { icon: <Plus className="w-5 h-5" strokeWidth={1.8} />, label: isAddToWaitingListPending ? 'جاري...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة' },
    { icon: <X className="w-5 h-5" strokeWidth={1.8} />, label: 'رفض', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
  ];

  const scheduledSchedulingActions: ActionBarItem[] = [
    { icon: <RotateCcw className="w-5 h-5" strokeWidth={1.8} />, label: 'إعادة', onClick: () => { close(); onOpenReturnForInfo(); } },
    ...(onOpenApproveUpdate ? [{ icon: <CheckCircle className="w-5 h-5" strokeWidth={1.8} />, label: 'إعتماد التحديث', onClick: () => { close(); onOpenApproveUpdate(); } }] : []),
    { icon: <Send className="w-5 h-5" strokeWidth={1.8} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasPresentation && onOpenSendToContent(); }, disabled: !hasPresentation, disabledReason: 'يرجى إرفاق عرض تقديمي أولاً' },
  ];

  const actions: ActionBarItem[] =
    customActions && customActions.length > 0
      ? customActions.map((a) => ({ ...a, onClick: () => { close(); a.onClick(); } }))
      : meetingStatus === MeetingStatus.SCHEDULED_SCHEDULING
      ? scheduledSchedulingActions
      : meetingStatus === MeetingStatus.SCHEDULED
      ? [
          { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.8} />, label: 'جدولة مجدداً', onClick: () => { close(); onOpenSchedule(); } },
          { icon: <Plus className="w-5 h-5" strokeWidth={1.8} />, label: isAddToWaitingListPending ? 'جاري...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة' },
          { icon: <X className="w-5 h-5" strokeWidth={1.8} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenCancel ? onOpenCancel() : onOpenReject(); } },
        ]
      : meetingStatus === MeetingStatus.WAITING
        ? [
            { icon: <X className="w-5 h-5" strokeWidth={1.8} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
            { icon: <CalendarMinus className="w-5 h-5" strokeWidth={1.8} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
          ]
        : defaultUnderReviewActions;

  const normalActions = actions.filter(a => a.variant !== 'danger');
  const dangerActions = actions.filter(a => a.variant === 'danger');
  const allOrdered = [...normalActions, ...dangerActions];
  const total = allOrdered.length;
  const RADIUS = 140;

  const getArcPosition = (index: number) => {
    const angle = Math.PI - (Math.PI * (index + 0.5)) / total;
    const x = RADIUS * Math.cos(angle);
    const y = RADIUS * Math.sin(angle);
    return { x, y };
  };

  const renderCircleAction = (action: ActionBarItem, index: number) => {
    const isDanger = action.variant === 'danger';
    const { x, y } = getArcPosition(index);

    const circleButton = (
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className={`
          group relative w-[52px] h-[52px] rounded-full flex items-center justify-center
          transition-all duration-200 touch-manipulation
          disabled:opacity-40 disabled:cursor-not-allowed
          ${isDanger
            ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200/60 shadow-[0_4px_16px_rgba(239,68,68,0.15)] hover:shadow-[0_6px_24px_rgba(239,68,68,0.25)] hover:scale-110'
            : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_24px_rgba(4,143,134,0.2)] hover:scale-110 hover:border-[#048F86]/30'
          }
        `}
      >
        <span className={isDanger ? 'text-red-500' : 'text-[#048F86]'}>
          {action.icon}
        </span>
        {/* Tooltip label on hover */}
        <span className={`
          pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
          px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap
          opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
          transition-all duration-200 ease-out
          ${isDanger
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-gray-800 text-white shadow-lg'
          }
        `}>
          {action.label}
          <span className={`
            absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45
            ${isDanger ? 'bg-red-600' : 'bg-gray-800'}
          `} />
        </span>
      </button>
    );

    const wrapper = (
      <div
        key={index}
        className="absolute"
        style={{
          left: `calc(50% + ${x}px - 26px)`,
          bottom: `calc(100% + ${y}px - 26px)`,
          transition: open
            ? `transform 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 60}ms, opacity 300ms ease-out ${index * 60}ms`
            : `transform 250ms cubic-bezier(0.6, -0.28, 0.735, 0.045) ${(total - index - 1) * 30}ms, opacity 200ms ease-in ${(total - index - 1) * 30}ms`,
          transform: open ? 'scale(1)' : 'scale(0)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {circleButton}
      </div>
    );

    if (action.disabled && action.disabledReason) {
      return (
        <TooltipProvider key={index} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {wrapper}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-right font-sans text-[12px]">
              {action.disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return wrapper;
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق"
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[4px] animate-in fade-in-0 duration-200"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2"
        dir="rtl"
      >
        <div className="relative w-14 h-14">
          {allOrdered.map((action, i) => renderCircleAction(action, i))}
        </div>

        <button
          type="button"
          aria-label={open ? 'إغلاق القائمة' : 'إجراءات سريعة'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className={`
            absolute bottom-0 left-0
            flex items-center justify-center w-14 h-14 rounded-full
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            hover:scale-105 active:scale-95 touch-manipulation
            ${open
              ? 'bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.1)] rotate-90'
              : 'bg-gradient-to-br from-[#048F86] via-[#069E95] to-[#0BB5AA] border border-white/20 shadow-[0_4px_20px_rgba(4,143,134,0.35)]'
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
