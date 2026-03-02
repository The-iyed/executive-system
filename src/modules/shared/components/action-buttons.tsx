import React from 'react';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/ui';

export interface ActionButtonsProps {
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onNext?: () => void;
  onBack?: () => void;
  cancelLabel?: string;
  saveDraftLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  className?: string;
  disabled?: boolean;
}

const getSecondaryButtonClass = (disabled: boolean) =>
  cn(
    'flex items-center justify-center gap-2',
    'py-2 h-[45px] rounded-lg',
    'w-full md:min-w-[175px] md:max-w-[220px]',
    'border border-[#D0D5DD] bg-white',
    'text-[16px] font-bold text-[#344054]',
    'transition-colors',
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F9FAFB]'
  );

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSaveDraft,
  onNext,
  onBack,
  cancelLabel = 'إلغاء',
  saveDraftLabel = 'حفظ كمسودة',
  nextLabel = 'التالي',
  backLabel = 'السابق',
  className,
  disabled = false,
}) => {
  const hasSecondaryActions = !!onCancel;
  return (
    <div
      className={cn(
        'w-full max-w-[1200px] mx-auto pt-4',
        'flex flex-col-reverse gap-4',
        'md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="flex flex-col gap-3 w-full md:flex-row md:w-auto md:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className={getSecondaryButtonClass(disabled)}
            aria-label={backLabel}
          >
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
            {backLabel}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center gap-2',
              'px-4 py-2 h-[45px] rounded-lg',
              'w-full md:min-w-[190px]',
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
            aria-label={nextLabel}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
            ) : (
              <>
                {nextLabel}
                <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden />
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
              'px-4 py-2 h-[45px] rounded-lg',
              'w-full md:min-w-[190px]',
              'text-[16px] font-bold transition-colors',
              disabled
                ? 'bg-[#E4E7EC] text-[#9CA3AF] opacity-50 cursor-not-allowed'
                : 'bg-[#F2F4F7] text-[#494A4D] hover:bg-[#E4E7EC]'
            )}
            aria-label={saveDraftLabel}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 shrink-0" aria-hidden />
            )}
            {saveDraftLabel}
          </button>
        )}
      </div>

      {hasSecondaryActions && (
        <div className="flex flex-col gap-3 w-full md:flex-row md:w-auto md:gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className={getSecondaryButtonClass(disabled)}
              aria-label={cancelLabel}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};