import React from 'react';
import { Inbox } from 'lucide-react';

interface MeetingListEmptyProps {
  message?: string;
}

export const MeetingListEmpty: React.FC<MeetingListEmptyProps> = ({
  message = 'لا توجد نتائج',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--color-base-gray-100)' }}
      >
        <Inbox className="w-7 h-7" style={{ color: 'var(--color-text-gray-400)' }} />
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-gray-500)' }}>
        {message}
      </p>
    </div>
  );
};
