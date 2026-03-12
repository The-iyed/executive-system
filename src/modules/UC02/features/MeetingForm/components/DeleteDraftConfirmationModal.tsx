import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/lib/ui';

interface DeleteDraftConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteDraftConfirmationModal: React.FC<DeleteDraftConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="items-start">
          <DialogTitle
            className="font-bold text-lg text-[#101828]"
          >
            تأكيد الحذف
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 mb-4">
          <p
            className="text-right text-sm text-[#475467] line-height-normal"
          >
            هل أنت متأكد من حذف هذه المسودة؟
          </p>
        </div>
        <DialogFooter className="flex-row-reverse gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-[#CA4545] text-white hover:bg-[#B63D3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};