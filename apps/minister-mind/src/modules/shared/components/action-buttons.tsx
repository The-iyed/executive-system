import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSaveDraft,
  onNext,
  cancelLabel = 'إلغاء',
  saveDraftLabel = 'حفظ كمسودة',
  nextLabel = 'التالي',
  className,
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
          className="flex items-center justify-center gap-2
          box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)]
          px-4 py-2 h-[48px] rounded-[8px] whitespace-nowrap min-w-[188px]
          hover:bg-[#E4E7EC] 
          transition-colors 
          text-[16px] font-bold text-white"
          style={{
            background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)',
            transition: 'background 0.3s ease',
          }}
        >
          {nextLabel}
          <ArrowLeft className="w-5 h-5 text-white mt-[4px]" />
        </button>
      )}
      {onSaveDraft && (
        <button
          type="button"
          onClick={onSaveDraft}
          className="
          flex items-center justify-center gap-2
          px-4 py-2 w-[188px] h-[48px] rounded-[8px]
          bg-[#F2F4F7]
          hover:bg-[#E4E7EC] 
          transition-colors 
          text-[16px] font-bold text-[#494A4D]"
        >
          <ArchiveIcon className="w-4 h-4 mt-[2px]" />
          {saveDraftLabel}
        </button>
      )}
       </div>
       {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="
          flex items-center justify-center 
          px-4 py-2 w-[188px] h-[48px] 
          bg-white border border-[#D0D5DD] rounded-lg 
          hover:bg-[#F9FAFB] 
          transition-colors 
          box-shadow-[0px_1px_2px_rgba(16,24,40,0.05)]
          text-[16px] font-bold text-[#344054]"
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
};