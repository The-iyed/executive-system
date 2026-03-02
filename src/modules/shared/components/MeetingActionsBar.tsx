import React from 'react';
import { CalendarMinus, CheckCircle, Plus, Pencil, RotateCcw, Send, X, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/ui';
import { MeetingStatus } from '../types';

function ActionBubble({
  icon,
  label,
  onClick,
  disabled,
  variant,
  disabledReason,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
  disabledReason?: string;
  compact?: boolean;
}) {
  if (compact) {
    const iconCircle = (
      <span
        className={`flex items-center justify-center w-11 h-11 rounded-full shadow-md border flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 ${
          variant === 'danger'
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-white border-gray-200/80 text-gray-800'
        }`}
      >
        {icon}
      </span>
    );
    const btn = (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {iconCircle}
      </button>
    );
    const tooltipText = disabled && disabledReason ? disabledReason : label;
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{btn}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Inline button style
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50 border border-red-200'
          : 'text-[#344054] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
      }`}
      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-right" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
            {disabledReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

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
  customActions?: ActionBarItem[];
  hideEdit?: boolean;
  /** Render as inline toolbar instead of floating FAB */
  inline?: boolean;
}

const R = 100;
const ARC_SPAN = 200;

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
  customActions,
  hideEdit = false,
  inline = false,
}) => {
  const close = () => onOpenChange(false);

  const defaultUnderReviewActions: ActionBarItem[] = [
    { icon: <CalendarMinus className="w-4 h-4" strokeWidth={1.26} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
    ...(hideEdit ? [] : [{ icon: <Pencil className="w-4 h-4" strokeWidth={1.26} />, label: 'تعديل', onClick: () => { close(); onOpenEditConfirm(); }, disabled: !hasChanges, disabledReason: 'لا يوجد تغييرات لحفظها' }]),
    { icon: <RotateCcw className="w-4 h-4" strokeWidth={1.26} />, label: 'إعادة للطلب', onClick: () => { close(); onOpenReturnForInfo(); } },
    { icon: <Send className="w-4 h-4" strokeWidth={1.26} />, label: 'إرسال للمحتوى', onClick: () => { close(); hasContent && onOpenSendToContent(); }, disabled: !hasContent, disabledReason: 'أضف أهدافاً أو بنود أجندة وعرضاً تقديمياً في تبويب المحتوى لتفعيل الإرسال' },
    { icon: <Plus className="w-4 h-4" strokeWidth={1.26} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
    { icon: <X className="w-4 h-4" strokeWidth={1.26} />, label: 'رفض', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
  ];

  const scheduledSchedulingActions: ActionBarItem[] = [
    { icon: <RotateCcw className="w-4 h-4" strokeWidth={1.26} />, label: 'إعادة', onClick: () => { close(); onOpenReturnForInfo(); } },
    ...(onOpenApproveUpdate ? [{ icon: <CheckCircle className="w-4 h-4" strokeWidth={1.26} />, label: 'إعتماد التحديث', onClick: () => { close(); onOpenApproveUpdate(); } }] : []),
    { icon: <Send className="w-4 h-4" strokeWidth={1.26} />, label: 'إرسال للمحتوى', onClick: () => { close(); onOpenSendToContent(); } },
  ];

  const actions: ActionBarItem[] =
    customActions && customActions.length > 0
      ? customActions.map((a) => ({ ...a, onClick: () => { close(); a.onClick(); } }))
      : meetingStatus === MeetingStatus.SCHEDULED_SCHEDULING
      ? scheduledSchedulingActions
      : meetingStatus === MeetingStatus.SCHEDULED
      ? [
          { icon: <CalendarMinus className="w-4 h-4" strokeWidth={1.26} />, label: 'جدولة مجدداً', onClick: () => { close(); onOpenSchedule(); } },
          { icon: <Plus className="w-4 h-4" strokeWidth={1.26} />, label: isAddToWaitingListPending ? 'جاري الإضافة...' : 'قائمة الانتظار', onClick: () => { close(); onAddToWaitingList(); }, disabled: isAddToWaitingListPending, disabledReason: 'جاري المعالجة، انتظر قليلاً' },
          { icon: <X className="w-4 h-4" strokeWidth={1.26} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenCancel ? onOpenCancel() : onOpenReject(); } },
        ]
      : meetingStatus === MeetingStatus.WAITING
        ? [
            { icon: <X className="w-4 h-4" strokeWidth={1.26} />, label: 'إلغاء', variant: 'danger' as const, onClick: () => { close(); onOpenReject(); } },
            { icon: <CalendarMinus className="w-4 h-4" strokeWidth={1.26} />, label: 'جدولة', onClick: () => { close(); onOpenSchedule(); } },
          ]
        : defaultUnderReviewActions;

  const n = actions.length;

  // ─── Inline toolbar mode ───
  if (inline) {
    return (
      <div className="flex flex-row items-center gap-2 flex-wrap" dir="rtl">
        {actions.map((action, i) => (
          <ActionBubble
            key={i}
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.variant}
            disabledReason={action.disabledReason}
          />
        ))}
      </div>
    );
  }

  // ─── Floating FAB mode (legacy) ───
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 w-14 h-14"
        dir="ltr"
      >
        {open && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out"
            style={{ width: R * 2, height: R + 28 }}
          >
            <div className="absolute inset-0">
              {actions.map((action, i) => {
                const angle = 170 + (i / Math.max(1, n - 1)) * ARC_SPAN;
                const rad = (angle * Math.PI) / 180;
                const x = R * Math.cos(rad);
                const y = R * Math.sin(rad);
                const leftPx = R + x;
                const topPx = R + y;
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: leftPx,
                      top: topPx,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <ActionBubble
                      compact
                      icon={action.icon}
                      label={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      variant={action.variant}
                      disabledReason={action.disabledReason}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label={open ? 'إغلاق القائمة' : 'إجراءات سريعة'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
          style={{
            background: open ? 'rgb(229 231 235)' : 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Zap className="w-6 h-6 text-[#048F86]" strokeWidth={2} />
        </button>
      </div>
    </>
  );
};

export default MeetingActionsBar;
