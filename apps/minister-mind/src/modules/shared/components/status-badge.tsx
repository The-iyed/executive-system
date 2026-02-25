import React from 'react';
import { MeetingStatus } from '../types';

export type StatusType = MeetingStatus | 'redirected' | 'monitoring-review' | string;

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusConfig: Record<StatusType, { bgClass: string; textClass: string }> = {
  [MeetingStatus.DRAFT]: {
    bgClass: 'bg-[rgba(126,126,126,0.12)]',
    textClass: 'text-[#636363]',
  },
  [MeetingStatus.ADDITIONAL_INFO]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.UNDER_REVIEW]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.SCHEDULED]: {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  [MeetingStatus.SCHEDULED_SCHEDULING]: {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  [MeetingStatus.SCHEDULED_CONTENT]: {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  [MeetingStatus.SCHEDULED_CONTENT_CONSULTATION]: {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  [MeetingStatus.SCHEDULED_UPDATE_CONTENT]: {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  [MeetingStatus.SCHEDULED_ADDITIONAL_INFO]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.SCHEDULED_DELAYED]: {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  [MeetingStatus.REJECTED]: {
    bgClass: 'bg-[rgba(255,162,162,0.12)]',
    textClass: 'text-[#D13C3C]',
  },
  [MeetingStatus.CANCELLED]: {
    bgClass: 'bg-[rgba(255,162,162,0.12)]',
    textClass: 'text-[#D13C3C]',
  },
  [MeetingStatus.CLOSED]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.RETURNED_FROM_SCHEDULING]: {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  [MeetingStatus.RETURNED_FROM_CONTENT]: {
    bgClass: 'bg-[rgba(184,60,120,0.04)]',
    textClass: 'text-[#B83C78]',
  },
  [MeetingStatus.WAITING]: {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  'redirected': {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  'monitoring-review': {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  'UNDER_CONSULTATION_SCHEDULING': {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  'UNDER_GUIDANCE': {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  [MeetingStatus.UNDER_CONTENT_REVIEW]: {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  },
  [MeetingStatus.UNDER_CONTENT_CONSULTATION]: {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  [MeetingStatus.READY]: {
    bgClass: 'bg-[rgba(4,143,134,0.08)]',
    textClass: 'text-[#048F86]',
  },
  'PENDING': {
    bgClass: 'bg-[rgba(255,211,89,0.12)]',
    textClass: 'text-[#BE8E0B]',
  },
  'RESPONDED': {
    bgClass: 'bg-[rgba(4,143,134,0.08)]',
    textClass: 'text-[#048F86]',
  },
  'COMPLETED': {
    bgClass: 'bg-[rgba(236,253,243,1)]',
    textClass: 'text-[#027A48]',
  },
  'SUPERSEDED': {
    bgClass: 'bg-[rgba(126,126,126,0.12)]',
    textClass: 'text-[#636363]',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const config = statusConfig[status] || {
    bgClass: 'bg-[rgba(89,146,255,0.12)]',
    textClass: 'text-[#3C6FD1]',
  };

  return (
    <div
      className={`
        flex flex-row justify-center items-center
        px-2 py-0.5
        rounded-[77px]
        text-[12px]
        font-weight-500
        whitespace-nowrap
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