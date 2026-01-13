import React from 'react';
import { MeetingCard, MeetingCardData } from './meeting-card';

export interface CardsGridProps {
  meetings: MeetingCardData[];
  onView?: (meeting: MeetingCardData) => void;
  onDetails?: (meeting: MeetingCardData) => void;
  className?: string;
}

export const CardsGrid: React.FC<CardsGridProps> = ({
  meetings,
  onView,
  onDetails,
  className = '',
}) => {
  return (
    <div
      className={`
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        gap-4
        w-full
        ${className}
      `}
    >
      {meetings.map((meeting) => (
        <div key={meeting.id} className="w-full flex justify-center">
          <MeetingCard
            meeting={meeting}
            onView={() => onView?.(meeting)}
            onDetails={() => onDetails?.(meeting)}
            className="w-full max-w-[432.79px]"
          />
        </div>
      ))}
    </div>
  );
};

