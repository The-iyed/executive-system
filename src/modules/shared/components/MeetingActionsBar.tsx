import React, { useEffect, useState } from 'react';
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

  if (compact) {
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
          <TooltipContent side="top" className="max-w-[260px] text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-end gap-2 rtl:flex-row-reverse rtl:justify-start w-full touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-1 pr-1 pl-0"
    >
      <span
        className={`min-w-[11rem] text-end text-sm font-medium whitespace-nowrap rounded-lg px-2 py-1 bg-white/90 shadow-sm border border-gray-200/80 ${
          variant === 'danger' ? 'text-red-600' : 'text-gray-800'
        }`}
        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
      >
        {label}
      </span>
      {iconCircle}
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex w-full min-w-0">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
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
  /** When provided and status is SCHEDULED, "إلغاء" opens cancel modal and uses cancel API instead of reject. */
  onOpenCancel?: () => void;
  onOpenEditConfirm: () => void;
  onOpenReturnForInfo: () => void;
  onOpenSendToContent: () => void;
  /** مجدول - الجدولة → إعتماد التحديث → مجدول */
  onOpenApproveUpdate?: () => void;
  onAddToWaitingList: () => void;
  isAddToWaitingListPending: boolean;
  hasChanges: boolean;
  hasContent: boolean;
  /** Whether the meeting has at least one presentation attachment */
  hasPresentation?: boolean;
  /** When provided, use these actions instead of status-based ones (same FAB + arc UI). */
  customActions?: ActionBarItem[];
  /** When true, do not show the "تعديل" action in the FAB (e.g. when edit is moved to a separate button). */
  hideEdit?: boolean;
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
  hasPresentation = true,
  customActions,
  hideEdit = false,
}) => {
  // Track visibility for staggered animation
  const [visible, setVisible] = useState(false);
  const [showArc, setShowArc] = useState(false);

  useEffect(() => {
    if (open) {
      setShowArc(true);
      // Small delay to allow DOM mount before triggering CSS transition
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
      // Keep mounted briefly for exit animation
      const t = setTimeout(() => setShowArc(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

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

  const n = actions.length;

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: open ? 'blur(2px)' : 'blur(0px)' }}
      >
        <button
          type="button"
          aria-label="إغلاق"
          className="w-full h-full"
          onClick={() => onOpenChange(false)}
        />
      </div>

      <div
        className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 w-14 h-14"
        dir="ltr"
      >
        {/* Arc container – stays mounted for exit animation */}
        {showArc && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3"
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
                // Stagger: first item appears first, each next +60ms
                const delay = i * 60;
                return (
                  <div
                    key={i}
                    className="absolute transition-all ease-out"
                    style={{
                      left: leftPx,
                      top: topPx,
                      transform: visible
                        ? 'translate(-50%, -50%) scale(1)'
                        : 'translate(-50%, 20px) scale(0.3)',
                      opacity: visible ? 1 : 0,
                      transitionDuration: '320ms',
                      transitionDelay: visible ? `${delay}ms` : `${(n - 1 - i) * 40}ms`,
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

        {/* FAB button with rotation */}
        <button
          type="button"
          aria-label={open ? 'إغلاق القائمة' : 'إجراءات سريعة'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 touch-manipulation"
          style={{
            background: open ? 'rgb(229 231 235)' : 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: open
              ? '0 0 0 1px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)'
              : '0 0 0 1px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Zap
            className="w-6 h-6 text-[#048F86] transition-transform duration-300 ease-out"
            strokeWidth={2}
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>
    </>
  );
};

export default MeetingActionsBar;
