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
    { icon: <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
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
          { icon: <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
          { icon: <X className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenCancel ? onOpenCancel() : onOpenReject(); } },
        ]
      : meetingStatus === MeetingStatus.WAITING
        ? [
            { icon: <X className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
            { icon: <CalendarMinus className="w-[18px] h-[18px]" strokeWidth={1.5} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
          ]
        : defaultUnderReviewActions;

  const normalActions = actions.filter(a => a.variant !== 'danger');
  const dangerActions = actions.filter(a => a.variant === 'danger');
  const allOrdered = [...normalActions, ...dangerActions];
  const total = allOrdered.length;
  const RADIUS = 120;

  const getArcPosition = (index: number) => {
    const angle = Math.PI - (Math.PI * (index + 0.5)) / total;
    const x = RADIUS * Math.cos(angle);
    const y = RADIUS * Math.sin(angle);
    return { x, y };
  };

  const renderCircleAction = (action: ActionBarItem, index: number) => {
    const isDanger = action.variant === 'danger';
    const { x, y } = getArcPosition(index);

    const circle = (
      <div
        key={index}
        className="absolute flex flex-col items-center"
        style={{
          left: `calc(50% + ${x}px - 24px)`,
          bottom: `calc(100% + ${y}px - 24px)`,
          transition: `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          transitionDelay: open ? `${index * 40}ms` : `${(total - index) * 20}ms`,
          transform: open ? 'scale(1)' : 'scale(0)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-200 touch-manipulation
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isDanger
              ? 'bg-red-50 border border-red-200 shadow-lg hover:scale-110 hover:shadow-xl hover:bg-red-100'
              : 'bg-white border border-gray-100/80 shadow-lg hover:scale-110 hover:shadow-xl hover:bg-[#048F86]/5'
            }
          `}
        >
          <span className={isDanger ? 'text-red-500' : 'text-[#048F86]'}>
            {action.icon}
          </span>
        </button>
        <span className={`
          text-[11px] font-medium mt-1.5 max-w-[70px] text-center leading-tight
          ${isDanger ? 'text-red-500' : 'text-gray-600'}
        `}>
          {action.label}
        </span>
      </div>
    );

    if (action.disabled && action.disabledReason) {
      return (
        <TooltipProvider key={index} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {circle}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-right font-sans">
              {action.disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return circle;
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
        {/* Radial action circles */}
        <div className="relative w-14 h-14">
          {allOrdered.map((action, i) => renderCircleAction(action, i))}
        </div>

        {/* FAB */}
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
              ? 'bg-white/90 backdrop-blur-xl border-2 border-gray-200/60 shadow-lg'
              : 'bg-white border-2 border-[#048F86]/20 shadow-[0_2px_16px_rgba(4,143,134,0.15)]'
            }
          `}
        >
          {open ? (
            <X className="w-5 h-5 text-gray-600 transition-transform duration-300" strokeWidth={2} />
          ) : (
            <Zap className="w-5 h-5 text-[#048F86] transition-transform duration-300" strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  );
};

export default MeetingActionsBar;
