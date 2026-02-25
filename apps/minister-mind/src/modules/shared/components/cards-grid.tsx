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
  hideStatus?: boolean;
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  meetings,
  onView,
  onDetails,
  onAction,
  getActionLabel,
  getActionLoading,
  className = '',
  hideStatus = false,
}) => {
  return (
    <div
      className={`
        grid grid-cols-1 lg:grid-cols-2 min-[1640px]:grid-cols-3
        gap-4
        w-full
        ${className}
      `}
    >
      {meetings.map((meeting) => {
        const label = getActionLabel?.(meeting);
        return (
          <div key={meeting.id} className="w-full">
            <MeetingCard
              meeting={meeting}
              onView={() => onView?.(meeting)}
              onDetails={() => onDetails?.(meeting)}
              onAction={onAction && label ? () => onAction(meeting) : undefined}
              actionLabel={label}
              hideStatus={hideStatus}
              actionLoading={getActionLoading?.(meeting)}
              className="w-full h-full"
            />
          </div>
        );
      })}
    </div>
  );
};

