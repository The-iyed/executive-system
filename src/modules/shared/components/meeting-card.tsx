import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
import { CalendarDays, MapPin, User, Hash, Layers, ChevronLeft } from 'lucide-react';
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

/* ─── Compact meta chip ─── */
const MetaChip: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: IC, label, value }) => (
  <CardTooltip text={value}>
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-base-gray-100)' }}
      >
        <IC className="w-3.5 h-3.5" style={{ color: 'var(--color-base-gray-500)' }} strokeWidth={1.6} />
      </div>
      <div className="flex flex-col min-w-0 gap-px">
        <span className="text-[10px] leading-3" style={{ color: 'var(--color-text-gray-500)' }}>{label}</span>
        <span className="text-[11px] font-medium leading-4 truncate" style={{ color: 'var(--color-text-gray-700)' }}>{value}</span>
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
  const handleClick = () => onDetails?.();

  /* Collect meta items dynamically */
  const metaItems: { icon: React.ElementType; label: string; value: string }[] = [];
  if (meeting.requestNumber) metaItems.push({ icon: Hash, label: 'رقم الطلب', value: meeting.requestNumber });
  metaItems.push({ icon: CalendarDays, label: 'تاريخ الطلب', value: meeting.date });
  if (meeting.meetingCategory) metaItems.push({ icon: Layers, label: 'فئة الاجتماع', value: meeting.meetingCategory });
  if (meeting.location) metaItems.push({ icon: MapPin, label: 'الموقع', value: getLocationLabel(meeting.location) ?? meeting.location });
  if (meeting.meetingDate) metaItems.push({ icon: CalendarDays, label: 'تاريخ الاجتماع', value: meeting.meetingDate });

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
      {/* ── Header strip ── */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-base-gray-100)' }}
      >
        {/* Status */}
        <div className="flex items-center gap-2">
          {!hideStatus && meeting.statusLabel && meeting.status && (
            <StatusBadge status={meeting.status} label={meeting.statusLabel} />
          )}
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
        </div>

        {/* Arrow – always visible on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onView ? onView() : onDetails?.(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: 'var(--color-primary-500)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-3.5 px-5 py-4">
        {/* Title */}
        <CardTooltip text={meeting.title}>
          <h3
            className="text-sm font-bold leading-6 line-clamp-2"
            style={{ color: 'var(--color-text-gray-900)' }}
          >
            {meeting.title}
          </h3>
        </CardTooltip>

        {/* Coordinator row */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: 'var(--color-base-gray-100)',
              border: '1.5px solid var(--color-base-gray-200)',
            }}
          >
            {meeting.coordinatorAvatar ? (
              <img src={meeting.coordinatorAvatar} alt={meeting.coordinator} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" style={{ color: 'var(--color-base-gray-500)' }} strokeWidth={1.5} />
            )}
          </div>
          <span className="text-xs truncate" style={{ color: 'var(--color-text-gray-600)' }}>
            {meeting.coordinator ?? '-'}
          </span>
        </div>
      </div>

      {/* ── Footer meta chips ── */}
      <div
        className="px-5 py-3 grid gap-x-4 gap-y-2"
        style={{
          background: 'var(--color-base-gray-50)',
          borderTop: '1px solid var(--color-base-gray-100)',
          gridTemplateColumns: `repeat(${Math.min(metaItems.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {metaItems.map((item) => (
          <MetaChip key={item.label} icon={item.icon} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
};
