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
      className={cn('flex items-center justify-between gap-3 w-[1085px] pt-4', className)}
    >
<div className="flex items-center gap-3">
{onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center gap-2",
            "box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)]",
            "px-4 py-2 h-[48px] rounded-[8px] whitespace-nowrap min-w-[188px]",
            "transition-colors text-[16px] font-bold text-white",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#E4E7EC]"
          )}
          style={{
            background: disabled 
              ? 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 0.01%, #4B5563 100%)'
              : 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)',
            transition: 'background 0.3s ease',
          }}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ArrowLeft className="w-5 h-5 text-white mt-[4px]" />
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
            "flex items-center justify-center gap-2",
            "px-4 py-2 w-[188px] h-[48px] rounded-[8px]",
            "transition-colors text-[16px] font-bold",
            disabled 
              ? "opacity-50 cursor-not-allowed bg-[#E4E7EC] text-[#9CA3AF]"
              : "bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#494A4D]"
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
       {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center",
            "px-4 py-2 w-[188px] h-[48px]",
            "bg-white border border-[#D0D5DD] rounded-lg",
            "transition-colors box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)]",
            "text-[16px] font-bold text-[#344054]",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F9FAFB]"
          )}
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
};