import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
import { Eye, CalendarDays, MapPin, User, Hash, Layers, Send } from 'lucide-react';
import { MeetingStatus, MeetingChannelLabels } from '../types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

const getLocationLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  return MeetingChannelLabels[value] || value;
};

const pillStyle = {
  borderRadius: '12px',
  background: '#FFFFFF',
  boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)',
} as const;

const iconCircleStyle = {
  background: '#FFFFFF',
  border: '1px solid #EAECF0',
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
} as const;

/** Tooltip wrapper for card values */
const CardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-right z-50">
        <p className="whitespace-pre-wrap break-words text-[12px]">{text}</p>
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
  const handleCardClick = () => {
    if (onDetails) {
      onDetails();
    }
  };

  return (
    <div
      className={`
        group relative
        flex flex-col
        bg-white
        w-full
        overflow-hidden
        cursor-pointer
        hover:shadow-[0px_4px_16px_rgba(16,24,40,0.12)]
        transition-all duration-200
        border-[1.5px] border-[rgba(230,236,245,1)]
        ${className}
      `}
      style={{
        borderRadius: '16px',
        boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
      }}
      dir="rtl"
      onClick={handleCardClick}
    >
      {/* Card Body */}
      <div className="flex flex-col gap-4 p-5" style={fontStyle}>
        {/* Row 1: Title + Status Badge */}
        <div className="flex flex-row items-start justify-between gap-3">
          <CardTooltip text={meeting.title}>
            <h3
              className="text-right flex-1 text-[#101828] font-bold leading-6 line-clamp-2 whitespace-nowrap whitespace-nowrap"
              style={{ ...fontStyle, fontSize: '15px' }}
            >
              {meeting.title}
            </h3>
          </CardTooltip>
          <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
            {meeting.statusLabel != null && !hideStatus && (
              <StatusBadge status={meeting.status} label={meeting.statusLabel} />
            )}
          </div>
        </div>

        {/* Row 2: Coordinator */}
        <CardTooltip text={meeting.coordinator ?? '-'}>
          <div className="flex flex-row items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
              {meeting.coordinatorAvatar ? (
                <img src={meeting.coordinatorAvatar} alt={meeting.coordinator} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-[#98A2B3]" strokeWidth={1.5} />
              )}
            </div>
            <span className="text-[13px] font-medium text-[#344054] leading-5 truncate">{meeting.coordinator ?? '-'}</span>
          </div>
        </CardTooltip>

        {/* Row 3: Request Number + Date pills */}
        <div className="flex flex-row items-center gap-2.5 w-full">
          {meeting.requestNumber && (
            <CardTooltip text={meeting.requestNumber}>
              <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2 max-w-[49%]" style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <Hash className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-[#98A2B3] leading-3">رقم الطلب</span>
                  <span className="text-[12px] text-[#344054] truncate leading-4">{meeting.requestNumber}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          <CardTooltip text={meeting.date}>
            <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2 max-w-[49%]" style={pillStyle}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] text-[#98A2B3] leading-3">التاريخ</span>
                <span className="text-[12px] text-[#344054] truncate leading-4">{meeting.date}</span>
              </div>
            </div>
          </CardTooltip>
        </div>

        {/* Row 4: Category + Location / Meeting Date pills */}
        {(meeting.meetingCategory || meeting.location || meeting.meetingDate) && (
          <div className="flex flex-row items-center gap-2.5 w-full">
            {meeting.meetingCategory && (
              <CardTooltip text={meeting.meetingCategory}>
                <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2 max-w-[49%] min-w-[49%] max-w-[49%]" style={pillStyle}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                    <Layers className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-[#98A2B3] leading-3">فئة الاجتماع</span>
                    <span className="text-[12px] text-[#344054] truncate leading-4">{meeting.meetingCategory}</span>
                  </div>
                </div>
              </CardTooltip>
            )}
            {meeting.location && (
              <CardTooltip text={getLocationLabel(meeting.location) ?? meeting.location}>
                <div className="flex flex-1 flex-row items-center min-w-[49%] max-w-[49%] gap-2.5 px-3 py-2" style={pillStyle}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                    <MapPin className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-[#98A2B3] leading-3">الموقع</span>
                    <span className="text-[12px] text-[#344054] truncate leading-4">{getLocationLabel(meeting.location)}</span>
                  </div>
                </div>
              </CardTooltip>
            )}
            {meeting.meetingDate && !meeting.location && (
              <CardTooltip text={meeting.meetingDate}>
                <div className="flex flex-1 flex-row items-center gap-2.5 px-3 py-2 max-w-[49%]" style={pillStyle}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                    <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-[#98A2B3] leading-3">تاريخ الاجتماع</span>
                    <span className="text-[12px] text-[#344054] truncate leading-4">{meeting.meetingDate}</span>
                  </div>
                </div>
              </CardTooltip>
            )}
          </div>
        )}

        {/* Action Button (e.g. إرسال المسودة) */}
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            disabled={actionLoading}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#048F86] hover:bg-[#037a72] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={fontStyle}
          >
            <span>{actionLabel}</span>
            <Send className="w-4 h-4 rotate-[-90deg] flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Hover Action Bar - glass overlay from left */}
      <div
        className="absolute top-0 left-0 z-10 flex w-12 h-full items-center justify-center -translate-x-full transition-transform duration-200 ease-in-out group-hover:translate-x-0"
        style={{ background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(16.62px)' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onView ? onView() : handleCardClick(); }}
          className="flex items-center justify-center rounded-full w-8 h-8 bg-white shadow-md hover:bg-[#F2F4F7] transition-colors"
        >
          <Eye className="w-[18px] h-[18px] text-[#475467]" strokeWidth={1.67} />
        </button>
      </div>
    </div>
  );
};
