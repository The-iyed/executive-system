import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@sanad-ai/ui';
import ArchiveIcon from '@shared/assets/archive.svg?react';

export interface ActionButtonsProps {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onNext?: () => void;
  cancelLabel?: string;
  saveDraftLabel?: string;
  nextLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSaveDraft,
  onNext,
  cancelLabel = 'إلغاء',
  saveDraftLabel = 'حفظ كمسودة',
  nextLabel = 'التالي',
  className,
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        'w-full max-w-[1200px] mx-auto pt-4 px-4',
        'flex flex-col-reverse gap-4',
        'md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      {/* Left side (Next + Save Draft) */}
      <div className="flex flex-col gap-3 w-full md:flex-row md:w-auto">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center gap-2',
              'px-4 py-2 h-[48px] rounded-lg',
              'w-full md:min-w-[188px]',
              'text-[16px] font-bold text-white whitespace-nowrap',
              'transition-colors',
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            )}
            style={{
              background: disabled
                ? 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 0.01%, #4B5563 100%)'
                : 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)',
            }}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {nextLabel}
                <ArrowLeft className="w-5 h-5 mt-[3px]" />
              </>
            )}
          </button>
        )}

        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center gap-2',
              'px-4 py-2 h-[48px] rounded-lg',
              'w-full md:min-w-[188px]',
              'text-[16px] font-bold transition-colors',
              disabled
                ? 'bg-[#E4E7EC] text-[#9CA3AF] opacity-50 cursor-not-allowed'
                : 'bg-[#F2F4F7] text-[#494A4D] hover:bg-[#E4E7EC]'
            )}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArchiveIcon className="w-4 h-4 mt-[2px]" />
            )}
            {saveDraftLabel}
          </button>
        )}
      </div>

      {/* Right side (Cancel) */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center',
            'px-4 py-2 h-[48px] rounded-lg',
            'w-full md:min-w-[188px] md:max-w-[220px]',
            'border border-[#D0D5DD] bg-white',
            'text-[16px] font-bold text-[#344054]',
            'transition-colors',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-[#F9FAFB]'
          )}
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
};