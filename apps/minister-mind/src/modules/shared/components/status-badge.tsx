import React from 'react';
import { MeetingStatus } from '../types';

export type StatusType = MeetingStatus | 'redirected' | 'monitoring-review' | string;

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusConfig: Record<StatusType, { bgClass: string; textClass: string }> = {
  [MeetingStatus.UNDER_REVIEW]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.REJECTED]: {
    bgClass: 'bg-[rgba(255,162,162,0.12)]',
    textClass: 'text-[#D13C3C]',
  },
  [MeetingStatus.DRAFT]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.SCHEDULED]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.CANCELLED]: {
    bgClass: 'bg-[rgba(255,162,162,0.12)]',
    textClass: 'text-[#D13C3C]',
  },
  [MeetingStatus.CLOSED]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  'redirected': {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  'monitoring-review': {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const config = statusConfig[status];

  return (
    <div
      className={`
        flex flex-row justify-center items-center
        px-2 py-0.5
        rounded-[77px]
        ${config.bgClass}
        ${className}
      `}
    >
      <span className={`text-xs font-medium leading-4 text-right ${config.textClass}`}>
        {label}
      </span>
    </div>
  );
};

