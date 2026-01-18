import React from 'react';
import { ContentRequestCard, ContentRequestCardData } from './content-request-card';

export interface ContentRequestsGridProps {
  requests: ContentRequestCardData[];
  onView?: (request: ContentRequestCardData) => void;
  onDetails?: (request: ContentRequestCardData) => void;
  className?: string;
}

export const ContentRequestsGrid: React.FC<ContentRequestsGridProps> = ({
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
        <ContentRequestCard
          key={request.id}
          request={request}
          onView={() => onView?.(request)}
          onDetails={() => onDetails?.(request)}
        />
      ))}
    </div>
  );
};



