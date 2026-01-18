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
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
      dir="rtl"
    >
      {requests.map((request) => (
        <GuidanceRequestCard
          key={request.id}
          request={request}
          onView={() => onView?.(request)}
          onDetails={() => onDetails?.(request)}
        />
      ))}
    </div>
  );
};





