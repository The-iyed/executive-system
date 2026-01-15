import React from 'react';
import { cn } from '@sanad-ai/ui';

export type EventType = 'reserved' | 'optional' | 'compulsory' | 'available';

export interface CalendarEventProps {
  type: EventType;
  label: string;
  startTime: string;
  endTime: string;
  date: Date;
  onClick?: (e: React.MouseEvent) => void;
  onHover?: (e: React.MouseEvent) => void;
  className?: string;
}

const eventTypeStyles: Record<EventType, { bg: string; border: string; text: string; borderStyle: string }> = {
  reserved: {
    bg: 'bg-[#F2F4F7]',
    border: 'border-[#D0D5DD]',
    text: 'text-[#344054]',
    borderStyle: 'border-solid',
  },
  optional: {
    bg: 'bg-[#FFF4ED]',
    border: 'border-[#FEDF89]',
    text: 'text-[#B93815]',
    borderStyle: 'border-dashed',
  },
  compulsory: {
    bg: 'bg-[#ECFDF3]',
    border: 'border-[#32D583]',
    text: 'text-[#027A48]',
    borderStyle: 'border-solid',
  },
  available: {
    bg: 'bg-white',
    border: 'border-[#D0D5DD]',
    text: 'text-[#344054]',
    borderStyle: 'border-dashed',
  },
};

const eventTypeLabels: Record<EventType, string> = {
  reserved: 'محجوز',
  optional: 'اختياري',
  compulsory: 'إجباري',
  available: 'متاح',
};

export const CalendarEvent: React.FC<CalendarEventProps> = ({
  type,
  label,
  startTime,
  endTime,
  date,
  onClick,
  onHover,
  className,
}) => {
  const styles = eventTypeStyles[type];
  const typeLabel = eventTypeLabels[type];

  return (
    <div
      className={cn(
        'relative rounded-lg border-[0.6px] p-2 cursor-pointer transition-all',
        styles.bg,
        styles.border,
        styles.borderStyle,
        'hover:shadow-md',
        className
      )}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseMove={onHover}
    >
      <span className={cn('text-[12px] font-medium', styles.text)}>
        {typeLabel}
      </span>
    </div>
  );
};
