import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
import { CalendarDays, MapPin, User, Hash, Layers, ArrowLeft } from 'lucide-react';
import { MeetingStatus, MeetingChannelLabels } from '../types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/lib/ui';
import { cn } from '@/lib/ui';

const getLocationLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  return MeetingChannelLabels[value] || value;
};

/** Tooltip wrapper for card values */
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

/** Single info item inside the card */
const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: IconComp, label, value }) => (
  <CardTooltip text={value}>
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-[var(--color-base-gray-50)] border border-[var(--color-base-gray-100)] flex items-center justify-center flex-shrink-0">
        <IconComp className="w-4 h-4 text-[var(--color-text-gray-500)]" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-[var(--color-text-gray-500)] leading-3">{label}</span>
        <span className="text-xs font-medium text-[var(--color-text-gray-700)] leading-4 truncate">{value}</span>
      </div>
    </div>
  </CardTooltip>
);

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
  const handleCardClick = () => onDetails?.();

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-white rounded-2xl border border-[var(--color-base-gray-100)] overflow-hidden cursor-pointer transition-all duration-200',
        'hover:border-[var(--color-primary-200)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
        className
      )}
      dir="rtl"
      onClick={handleCardClick}
    >
      {/* Top accent line */}
      <div className="h-[3px] bg-gradient-to-l from-[var(--color-primary-500)] to-[var(--color-primary-300)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col gap-4 p-5">
        {/* Row 1: Status + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!hideStatus && meeting.statusLabel && meeting.status && (
              <StatusBadge status={meeting.status} label={meeting.statusLabel} />
            )}
            {onAction && actionLabel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {actionLabel}
              </button>
            )}
          </div>

          {/* View button */}
          <button
            onClick={(e) => { e.stopPropagation(); onView ? onView() : onDetails?.(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-gray-500)] hover:bg-[var(--color-base-gray-50)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Title */}
        <CardTooltip text={meeting.title}>
          <h3 className="text-[15px] font-bold text-[var(--color-text-gray-900)] leading-6 line-clamp-2">
            {meeting.title}
          </h3>
        </CardTooltip>

        {/* Row 3: Coordinator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--color-base-gray-100)] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {meeting.coordinatorAvatar ? (
              <img src={meeting.coordinatorAvatar} alt={meeting.coordinator} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-[var(--color-text-gray-500)]" strokeWidth={1.5} />
            )}
          </div>
          <span className="text-sm text-[var(--color-text-gray-600)] truncate">{meeting.coordinator ?? '-'}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--color-base-gray-100)]" />

        {/* Row 4: Info items */}
        <div className="grid grid-cols-2 gap-3">
          {meeting.requestNumber && (
            <InfoItem icon={Hash} label="رقم الطلب" value={meeting.requestNumber} />
          )}
          <InfoItem icon={CalendarDays} label="تاريخ الطلب" value={meeting.date} />
          {meeting.meetingCategory && (
            <InfoItem icon={Layers} label="فئة الاجتماع" value={meeting.meetingCategory} />
          )}
          {meeting.location && (
            <InfoItem icon={MapPin} label="الموقع" value={getLocationLabel(meeting.location) ?? meeting.location} />
          )}
          {meeting.meetingDate && (
            <InfoItem icon={CalendarDays} label="تاريخ الاجتماع" value={meeting.meetingDate} />
          )}
        </div>
      </div>
    </div>
  );
};
