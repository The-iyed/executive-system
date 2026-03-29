import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, StatusType } from '@/modules/shared/components/status-badge';
import { MeetingStatus } from '@/modules/shared/types';
import { Eye, CalendarDays, User, Hash, Layers, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/lib/ui';

const fontStyle = { fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" } as const;

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

export interface ContentRequestCardData {
  id: string;
  requestNumber: string;
  title: string;
  meetingSubject?: string;
  date: string;
  submitter?: string;
  status: StatusType | MeetingStatus;
  statusLabel: string;
  meetingCategory?: string;
  location?: string;
  meetingDate?: string;
  isDataComplete?: boolean | null;
}

export interface ContentRequestCardProps {
  request: ContentRequestCardData;
  onView?: () => void;
  onDetails?: () => void;
  className?: string;
}

export const ContentRequestCard: React.FC<ContentRequestCardProps> = ({
  request,
  onView,
  onDetails,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onDetails) {
      onDetails();
    } else {
      navigate(`/content-request/${request.id}`);
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
        {/* Row 1: Title + Status + Data Complete */}
        <div className="flex flex-row items-start justify-between gap-3">
          <CardTooltip text={request.title}>
            <h3
              className="text-right flex-1 text-[#101828] font-bold leading-6 line-clamp-2"
              style={{ ...fontStyle, fontSize: '15px' }}
            >
              {request.title}
            </h3>
          </CardTooltip>
          <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
            {request.isDataComplete != null && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium whitespace-nowrap"
                style={{
                  background: request.isDataComplete ? 'rgba(4, 143, 134, 0.08)' : 'rgba(255, 162, 162, 0.12)',
                  color: request.isDataComplete ? '#048F86' : '#D13C3C',
                  ...fontStyle,
                }}
              >
                {request.isDataComplete ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {request.isDataComplete ? 'مكتمل' : 'غير مكتمل'}
              </span>
            )}
            <StatusBadge status={request.status} label={request.statusLabel} />
          </div>
        </div>

        {/* Row 2: Submitter */}
        {request.submitter && (
          <CardTooltip text={request.submitter}>
            <div className="flex flex-row items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
                <User className="h-4 w-4 text-[#98A2B3]" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-[#344054] leading-5 truncate">{request.submitter}</span>
            </div>
          </CardTooltip>
        )}

        {/* Pills: Request Number, Date, Category, Location, Meeting Date — vertical stack */}
        <div className="flex gap-2.5 w-full">
          <CardTooltip text={request.requestNumber}>
            <div className="flex flex-col items-center gap-2.5 px-3 py-2 w-full " style={pillStyle}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                <Hash className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 items-center">
                <span className="text-[10px] text-[#98A2B3] leading-3">رقم الطلب</span>
                <span className="text-[12px] text-[#344054] leading-4">{request.requestNumber}</span>
              </div>
            </div>
          </CardTooltip>
          <CardTooltip text={request.date}>
            <div className="flex flex-col items-center gap-2.5 px-3 py-2 w-full " style={pillStyle}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 items-center">
                <span className="text-[10px] text-[#98A2B3] leading-3">التاريخ</span>
                <span className="text-[12px] text-[#344054] leading-4">{request.date}</span>
              </div>
            </div>
          </CardTooltip>
          {request.meetingCategory && (
            <CardTooltip text={request.meetingCategory}>
              <div className="flex flex-col items-center gap-2.5 px-3 py-2 w-full " style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <Layers className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center">
                  <span className="text-[10px] text-[#98A2B3] leading-3">فئة الاجتماع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{request.meetingCategory}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          {request.location && (
            <CardTooltip text={request.location}>
              <div className="flex flex-col items-center gap-2.5 px-3 py-2 w-full " style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <MapPin className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center">
                  <span className="text-[10px] text-[#98A2B3] leading-3">الموقع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{request.location}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          {request.meetingDate && (
            <CardTooltip text={request.meetingDate}>
              <div className="flex flex-col items-center gap-2.5 px-3 py-2 w-full " style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 items-center">
                  <span className="text-[10px] text-[#98A2B3] leading-3">تاريخ الاجتماع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{request.meetingDate}</span>
                </div>
              </div>
            </CardTooltip>
          )}
        </div>
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
