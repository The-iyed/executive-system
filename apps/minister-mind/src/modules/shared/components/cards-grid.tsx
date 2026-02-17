import React from 'react';
import { MeetingCard, MeetingCardData } from './meeting-card';

export interface CardsGridProps {
  meetings: MeetingCardData[];
  onView?: (meeting: MeetingCardData) => void;
  onDetails?: (meeting: MeetingCardData) => void;
  onAction?: (meeting: MeetingCardData) => void;
  getActionLabel?: (meeting: MeetingCardData) => string | undefined;
  getActionLoading?: (meeting: MeetingCardData) => boolean;
  className?: string;
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  meetings,
  onView,
  onDetails,
  onAction,
  getActionLabel,
  getActionLoading,
  className = '',
}) => {
  return (
    <div
      className={`
        grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4
        gap-4
        w-full
        ${className}
      `}
    >
      {meetings.map((meeting) => {
        const label = getActionLabel?.(meeting);
        return (
          <div key={meeting.id} className="w-full flex justify-center">
            <MeetingCard
              meeting={meeting}
              onView={() => onView?.(meeting)}
              onDetails={() => onDetails?.(meeting)}
              onAction={onAction && label ? () => onAction(meeting) : undefined}
              actionLabel={label}
              actionLoading={getActionLoading?.(meeting)}
              className="w-full max-w-[432.79px]"
            />
          </div>
        );
      })}
    </div>
  );
};

