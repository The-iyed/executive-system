import React from 'react';
import { GuidanceRequestCard, GuidanceRequestCardData } from './guidance-request-card';

export interface GuidanceRequestsGridProps {
  requests: GuidanceRequestCardData[];
  onView?: (request: GuidanceRequestCardData) => void;
  onDetails?: (request: GuidanceRequestCardData) => void;
  className?: string;
}

export const GuidanceRequestsGrid: React.FC<GuidanceRequestsGridProps> = ({
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
        <GuidanceRequestCard
          hideStatus={false}
          key={request.id}
          request={request}
          onView={() => onView?.(request)}
          onDetails={() => onDetails?.(request)}
        />
      ))}
    </div>
  );
};





