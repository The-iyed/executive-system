import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface MeetingListErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const MeetingListError: React.FC<MeetingListErrorProps> = ({
  message = 'حدث خطأ أثناء تحميل البيانات',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 mt-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            color: 'var(--color-primary-600)',
            background: 'var(--color-primary-50)',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};
