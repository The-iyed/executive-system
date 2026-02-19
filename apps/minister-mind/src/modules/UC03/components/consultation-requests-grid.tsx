import React from 'react';
import { ConsultationRequestCard, ConsultationRequestCardData } from './consultation-request-card';

export interface ConsultationRequestsGridProps {
  requests: ConsultationRequestCardData[];
  onView?: (request: ConsultationRequestCardData) => void;
  onDetails?: (request: ConsultationRequestCardData) => void;
  className?: string;
}

export const ConsultationRequestsGrid: React.FC<ConsultationRequestsGridProps> = ({
  requests,
  onView,
  onDetails,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 min-[1440px]:grid-cols-3 gap-4 ${className}`}
      dir="rtl"
    >
      {requests.map((request) => (
        <ConsultationRequestCard
          key={request.id}
          request={request}
          onView={() => onView?.(request)}
          onDetails={() => onDetails?.(request)}
        />
      ))}
    </div>
  );
};

