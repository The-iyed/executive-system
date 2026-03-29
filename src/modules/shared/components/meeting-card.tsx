import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
import { CalendarDays, MapPin, User, Layers, Tag, Shield } from 'lucide-react';
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
  meetingType?: string;
  meetingClassificationType?: string;
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
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionLoading?: boolean;
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
  onSecondaryAction,
  secondaryActionLabel,
  secondaryActionLoading,
  hideStatus = false,
  className = '',
}) => {
  const handleClick = () => onDetails?.();

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
        'border hover:shadow-md',
        className,
      )}
      style={{
        background: 'var(--color-base-white)',
        borderColor: 'var(--color-base-gray-200)',
      }}
      dir="rtl"
      onClick={handleClick}
    >
      {/* ── Row 1: Request number + Status ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        {meeting.requestNumber ? (
          <span
            className="text-xs font-medium tracking-wide"
            style={{ color: 'var(--color-text-gray-500)', fontVariantNumeric: 'tabular-nums' }}
          >
            #{meeting.requestNumber}
          </span>
        ) : (
          <span />
        )}

        {!hideStatus && meeting.statusLabel && meeting.status && (
          <StatusBadge status={meeting.status} label={meeting.statusLabel} />
        )}
      </div>

      {/* ── Row 2: Title ── */}
      <div className="px-5 pb-1">
        <CardTooltip text={meeting.title}>
          <h3
            className="text-[15px] font-bold leading-6 line-clamp-2"
            style={{ color: 'var(--color-text-gray-900)' }}
          >
            {meeting.title}
          </h3>
        </CardTooltip>
      </div>

      {/* ── Row 3: Dates ── */}
      <div className="flex items-center gap-3 px-5 py-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--color-text-gray-500)' }} strokeWidth={1.6} />
          <span className="text-xs" style={{ color: 'var(--color-text-gray-600)' }}>{meeting.date}</span>
        </div>
        {meeting.meetingDate && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--color-primary-500)' }} strokeWidth={1.6} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary-500)' }}>{meeting.meetingDate}</span>
          </div>
        )}
      </div>

      {/* ── Row 4: Tags (Type, Category, Classification, Location) ── */}
      <div className="flex items-center gap-1.5 px-5 py-1.5 flex-wrap">
        {meeting.meetingType && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}
          >
            <Tag className="w-2.5 h-2.5" strokeWidth={1.8} />
            {meeting.meetingType}
          </span>
        )}
        {meeting.meetingCategory && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{ background: 'var(--color-base-gray-100)', color: 'var(--color-text-gray-600)' }}
          >
            <Layers className="w-2.5 h-2.5" strokeWidth={1.8} />
            {meeting.meetingCategory}
          </span>
        )}
        {meeting.meetingClassificationType && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{ background: 'hsl(210 40% 96%)', color: 'hsl(210 40% 40%)' }}
          >
            <Shield className="w-2.5 h-2.5" strokeWidth={1.8} />
            {meeting.meetingClassificationType}
          </span>
        )}
        {meeting.location && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{ background: 'var(--color-base-gray-100)', color: 'var(--color-text-gray-600)' }}
          >
            <MapPin className="w-2.5 h-2.5" strokeWidth={1.8} />
            {getLocationLabel(meeting.location)}
          </span>
        )}
      </div>

      {/* ── Row 5: Submitter + Actions ── */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3 mt-auto"
        style={{
          background: 'var(--color-base-gray-50)',
          borderTop: '1px solid var(--color-base-gray-100)',
        }}
      >
        {/* Submitter info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'var(--color-base-gray-200)',
              border: '1.5px solid var(--color-base-gray-300)',
            }}
          >
            {meeting.coordinatorAvatar ? (
              <img src={meeting.coordinatorAvatar} alt={meeting.coordinator} className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5" style={{ color: 'var(--color-base-gray-500)' }} strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] leading-3" style={{ color: 'var(--color-text-gray-500)' }}>مقدم الطلب</span>
            <span className="text-xs font-medium truncate max-w-[180px]" style={{ color: 'var(--color-text-gray-700)' }}>
              {meeting.coordinator || '-'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {(onAction || onSecondaryAction) && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onSecondaryAction && secondaryActionLabel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSecondaryAction(); }}
                disabled={secondaryActionLoading}
                className="px-3 py-1 rounded-lg border text-[11px] font-medium disabled:opacity-50 transition-colors"
                style={{
                  borderColor: 'hsl(0 60% 85%)',
                  color: 'hsl(0 60% 45%)',
                  background: 'hsl(0 60% 97%)',
                }}
              >
                {secondaryActionLabel}
              </button>
            )}
            {onAction && actionLabel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                disabled={actionLoading}
                className="px-3 py-1 rounded-lg text-white text-[11px] font-medium disabled:opacity-50 transition-colors"
                style={{ background: 'var(--color-primary-500)' }}
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
