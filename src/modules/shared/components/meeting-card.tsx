import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
import { CalendarDays, MapPin, User, Layers, ChevronLeft } from 'lucide-react';
import { MeetingStatus, MeetingChannelLabels } from '../types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/lib/ui';
import { cn } from '@/lib/ui';

const getLocationLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  return MeetingChannelLabels[value] || value;
};

const CardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-right z-50">
        <p className="whitespace-pre-wrap break-words text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export interface MeetingCardData {
  id: string;
  requestNumber?: string;
  title: string;
  date: string;
  coordinator?: string;
  coordinatorAvatar?: string;
  status: StatusType | MeetingStatus;
  statusLabel: string;
  location?: string;
  meetingCategory?: string;
  meetingDate?: string;
  isDataComplete?: boolean | null;
}

export interface MeetingCardProps {
  meeting: MeetingCardData;
  onView?: () => void;
  onDetails?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionLoading?: boolean;
  className?: string;
  hideStatus?: boolean;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onView,
  onDetails,
  onAction,
  actionLabel,
  actionLoading,
  hideStatus = false,
  className = '',
}) => {
  const handleClick = () => onDetails?.();

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
        'border hover:shadow-lg hover:-translate-y-0.5',
        className,
      )}
      style={{
        background: 'var(--color-base-white)',
        borderColor: 'var(--color-base-gray-200)',
      }}
      dir="rtl"
      onClick={handleClick}
    >
      {/* ── Top accent line ── */}
      <div className="h-1 w-full" style={{ background: 'var(--color-primary-500)' }} />

      {/* ── Header: Request # + Status ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {meeting.requestNumber ? (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-primary-600)',
              background: 'var(--color-primary-50)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            طلب #{meeting.requestNumber}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-50 transition-colors"
              style={{ background: 'var(--color-primary-500)' }}
            >
              {actionLabel}
            </button>
          )}
          {!hideStatus && meeting.statusLabel && meeting.status && (
            <StatusBadge status={meeting.status} label={meeting.statusLabel} />
          )}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="px-4 pt-1 pb-2">
        <CardTooltip text={meeting.title}>
          <h3
            className="text-sm font-bold leading-5 line-clamp-2"
            style={{ color: 'var(--color-text-gray-900)' }}
          >
            {meeting.title}
          </h3>
        </CardTooltip>
      </div>

      {/* ── Submitter row — inline with avatar ── */}
      {meeting.coordinator && (
        <div className="flex items-center gap-2 px-4 pb-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'var(--color-primary-50)',
              border: '1.5px solid var(--color-primary-100)',
            }}
          >
            {meeting.coordinatorAvatar ? (
              <img src={meeting.coordinatorAvatar} alt={meeting.coordinator} className="w-full h-full object-cover" />
            ) : (
              <User className="w-3 h-3" style={{ color: 'var(--color-primary-400)' }} strokeWidth={1.8} />
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-gray-600)' }}>
            {meeting.coordinator}
          </span>
        </div>
      )}

      {/* ── Metadata strip ── */}
      <div
        className="flex items-center flex-wrap gap-x-4 gap-y-2 px-4 py-2.5 mt-auto"
        style={{
          background: 'var(--color-base-gray-50)',
          borderTop: '1px solid var(--color-base-gray-100)',
        }}
      >
        {/* Date */}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--color-text-gray-400)' }} strokeWidth={1.6} />
          <span className="text-[11px]" style={{ color: 'var(--color-text-gray-500)' }}>
            {meeting.date}
          </span>
        </div>

        {/* Meeting date */}
        {meeting.meetingDate && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--color-primary-500)' }} strokeWidth={1.6} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-primary-600)' }}>
              {meeting.meetingDate}
            </span>
          </div>
        )}

        {/* Category tag */}
        {meeting.meetingCategory && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}
          >
            <Layers className="w-2.5 h-2.5" strokeWidth={2} />
            {meeting.meetingCategory}
          </span>
        )}

        {/* Location tag */}
        {meeting.location && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: 'var(--color-base-gray-100)', color: 'var(--color-text-gray-600)' }}
          >
            <MapPin className="w-2.5 h-2.5" strokeWidth={2} />
            {getLocationLabel(meeting.location)}
          </span>
        )}

        {/* Arrow indicator */}
        <ChevronLeft
          className="w-4 h-4 mr-auto opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-primary-500)' }}
          strokeWidth={2}
        />
      </div>
    </div>
  );
};
