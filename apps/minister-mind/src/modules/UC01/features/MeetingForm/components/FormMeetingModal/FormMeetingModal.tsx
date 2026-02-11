import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@sanad-ai/ui';

const BACKDROP_DURATION_MS = 300;
const CONTENT_DURATION_MS = 300;
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

export interface FormMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?:string
  children?: React.ReactNode;
}

export function FormMeetingModal({
  open,
  onOpenChange,
  className,
  children,
}: FormMeetingModalProps) {
  return (
    <>
      <style>{`
        @keyframes form-meeting-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes form-meeting-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes form-meeting-drawer-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes form-meeting-drawer-out {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .form-meeting-backdrop[data-state="open"] {
          animation: form-meeting-backdrop-in ${BACKDROP_DURATION_MS}ms ${EASING} forwards;
        }
        .form-meeting-backdrop[data-state="closed"] {
          animation: form-meeting-backdrop-out ${BACKDROP_DURATION_MS}ms ${EASING} forwards;
        }
        .form-meeting-drawer[data-state="open"] {
          animation: form-meeting-drawer-in ${CONTENT_DURATION_MS}ms ${EASING} forwards;
        }
        .form-meeting-drawer[data-state="closed"] {
          animation: form-meeting-drawer-out ${CONTENT_DURATION_MS}ms ${EASING} forwards;
        }
      `}</style>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'form-meeting-backdrop fixed inset-0 z-50',
              'bg-black/10',
              'data-[state=closed]:opacity-0'
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              'form-meeting-drawer fixed right-0 top-0 bottom-0 z-50',
              'flex flex-col',
              'w-[100vw]',
              'h-[100vh]',
              'bg-white/38 backdrop-blur-[5.95px]',
              'focus:outline-none',
              'data-[state=closed]:translate-x-full'
            )}
            aria-describedby={undefined}
          >
            <div
              className={cn(
                'flex flex-col flex-1 min-h-0',
                'm-[30px] mt-[20px] mb-[20px] mr-[30px]',
                className
              )}
            >
              <div
                className={cn(
                  'pointer-events-auto relative flex-1 flex flex-col min-h-0',
                  'w-full max-w-[850px]',
                  'bg-[#FFFFFF]',
                  'rounded-[16px]',
                  'overflow-hidden',
                  'shadow-[0px_4px_59.2px_rgba(0,0,0,0.05)]'
                )}
              >
                <DialogPrimitive.Close
                  className={cn(
                    'absolute right-5 top-5 z-10',
                    'flex h-8 w-8 items-center justify-center rounded-md',
                    'text-[#475467] hover:bg-[#F2F4F7] hover:text-[#101828] outline-none',
                  )}
                  aria-label="إغلاق"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
                <div className="flex-1 p-[10px] overflow-y-auto overflow-x-hidden min-h-0">
                  {children}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

export default FormMeetingModal;