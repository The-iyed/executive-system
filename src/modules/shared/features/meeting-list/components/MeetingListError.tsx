import React from 'react';
import { RefreshCw } from 'lucide-react';

interface MeetingListErrorProps {
  message?: string;
  onRetry?: () => void;
}

function ErrorIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="60" cy="58" r="48" className="fill-destructive/[0.04]" />
      {/* Cloud shape */}
      <ellipse cx="60" cy="52" rx="32" ry="20" className="fill-background stroke-destructive/15" strokeWidth="1.5" />
      <ellipse cx="40" cy="54" rx="16" ry="14" className="fill-background stroke-destructive/10" strokeWidth="1" />
      <ellipse cx="80" cy="54" rx="14" ry="12" className="fill-background stroke-destructive/10" strokeWidth="1" />
      {/* Cover overlap */}
      <ellipse cx="60" cy="56" rx="30" ry="16" className="fill-background" />
      {/* Lightning bolt */}
      <path d="M58 44 l-3 10 h6 l-3 10" className="stroke-destructive/35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Rain drops */}
      <line x1="46" y1="74" x2="46" y2="80" className="stroke-destructive/12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="72" x2="60" y2="80" className="stroke-destructive/15" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="74" y1="74" x2="74" y2="80" className="stroke-destructive/12" strokeWidth="1.5" strokeLinecap="round" />
      {/* Warning badge */}
      <circle cx="82" cy="38" r="8" className="fill-destructive/[0.06] stroke-destructive/20" strokeWidth="1" />
      <line x1="82" y1="34" x2="82" y2="39" className="stroke-destructive/40" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="82" cy="42" r="1" className="fill-destructive/40" />
    </svg>
  );
}

export const MeetingListError: React.FC<MeetingListErrorProps> = ({
  message = 'حدث خطأ أثناء تحميل البيانات',
  onRetry,
}) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.02] backdrop-blur-sm px-10 py-10 max-w-sm w-full text-center">
        <div className="mb-4">
          <ErrorIllustration />
        </div>
        <h3 className="text-[15px] font-semibold text-destructive mb-1">
          حدث خطأ
        </h3>
        <p className="text-[13px] text-destructive/60 leading-relaxed mb-4">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/15 active:scale-[0.97] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
};
