import React from 'react';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@shared/components';

export interface GoBackHeaderProps {
  title: string;
  status?: string;
  statusLabel?: string;
  onBack: () => void;
  className?: string;
}

export const GoBackHeader: React.FC<GoBackHeaderProps> = ({
  title,
  status,
  statusLabel,
  onBack,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button
        onClick={onBack}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="العودة إلى القائمة"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-[28px] font-semibold text-[#101828] flex justify-center items-center">
          {title}
        </h1>
        {status && statusLabel && (
          <StatusBadge status={status} label={statusLabel} className="px-5" />
        )}
      </div>
    </div>
  );
};
