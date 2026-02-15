import React, { useCallback, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@sanad-ai/ui';
import { SelectMenuPortalContext } from './SelectMenuPortalContext';

const BACKDROP_DURATION_MS = 300;
const CONTENT_DURATION_MS = 300;
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  side?: 'left' | 'right';
  closeAriaLabel?: string;
  showDecoration?: boolean;
  className?: string;
  bodyClassName?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = 850,
  side = 'right',
  closeAriaLabel = 'إغلاق',
  showDecoration = true,
  className,
  bodyClassName,
}: DrawerProps) {
  const maxWidth = typeof width === 'number' ? `${width}px` : width;
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    setMenuPortalTarget(node);
  }, []);

  return (
    <>
      <style>{`
        @keyframes shared-drawer-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shared-drawer-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes shared-drawer-content-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes shared-drawer-content-out-right {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes shared-drawer-content-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes shared-drawer-content-out-left {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .shared-drawer-backdrop[data-state="open"] {
          animation: shared-drawer-backdrop-in ${BACKDROP_DURATION_MS}ms ${EASING} forwards;
        }
        .shared-drawer-backdrop[data-state="closed"] {
          animation: shared-drawer-backdrop-out ${BACKDROP_DURATION_MS}ms ${EASING} forwards;
        }
        .shared-drawer-content[data-state="open"] {
          animation: shared-drawer-content-in-${side} ${CONTENT_DURATION_MS}ms ${EASING} forwards;
        }
        .shared-drawer-content[data-state="closed"] {
          animation: shared-drawer-content-out-${side} ${CONTENT_DURATION_MS}ms ${EASING} forwards;
        }
      `}</style>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'shared-drawer-backdrop fixed inset-0 z-50',
              'bg-black/10',
              'data-[state=closed]:opacity-0'
            )}
          />
          <DialogPrimitive.Content
            ref={contentRef}
            className={cn(
              'shared-drawer-content fixed top-0 bottom-0 z-50',
              'flex flex-col',
              'w-[100vw] h-[100vh]',
              'bg-white/38 backdrop-blur-[5.95px]',
              'focus:outline-none',
              side === 'right' && 'right-0 data-[state=closed]:translate-x-full',
              side === 'left' && 'left-0 data-[state=closed]:-translate-x-full'
            )}
            aria-describedby={undefined}
          >
            <div
              className={cn(
                'flex flex-col flex-1 min-h-0',
                'mt-6 mb-6 mx-6 mr-8',
                className
              )}
            >
              <div
                className={cn(
                  'pointer-events-auto relative flex-1 flex flex-col min-h-0',
                  'w-full overflow-hidden',
                  'bg-[#FFFFFF] rounded-[16px]',
                  'shadow-[0px_4px_59.2px_rgba(0,0,0,0.05)]'
                )}
                style={{ maxWidth }}
              >
                {/* Decorative background - soft flower-like abstract shape */}
                {showDecoration && (
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]"
                    aria-hidden
                  >
                    <div
                      className="absolute -top-[20%] -right-[15%] w-[60%] aspect-square rounded-full opacity-[0.06]"
                      style={{
                        background: 'radial-gradient(circle, #008774 0%, transparent 70%)',
                      }}
                    />
                    <div
                      className="absolute top-[10%] -left-[10%] w-[45%] aspect-square rounded-full opacity-[0.05]"
                      style={{
                        background: 'radial-gradient(circle, #009883 0%, transparent 65%)',
                      }}
                    />
                    <div
                      className="absolute bottom-[5%] right-[20%] w-[35%] aspect-square rounded-full opacity-[0.04]"
                      style={{
                        background: 'radial-gradient(circle, #008774 0%, transparent 60%)',
                      }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 w-[80%] aspect-square -translate-x-1/2 -translate-y-1/2 opacity-[0.03]"
                      style={{
                        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, #009883 0%, transparent 70%)',
                      }}
                    />
                  </div>
                )}

                <DialogPrimitive.Close
                  className={cn(
                    'absolute right-5 top-5 z-20',
                    'flex h-7 w-7 items-center justify-center rounded-lg',
                    'bg-white border-0 border-[#E4E7EC]',
                    'shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
                    'text-[#475467]',
                    'hover:bg-[#F9FAFB] hover:border-[#D0D5DD] hover:text-[#101828] hover:shadow-[0_1px_3px_rgba(16,24,40,0.08)]',
                    'active:scale-[0.98]',
                    'outline-none',
                    'transition-colors transition-shadow duration-150',
                    'hover:scale-90'
                  )}
                  aria-label={closeAriaLabel}
                >
                  <X className="h-5 w-5 shrink-0" />
                </DialogPrimitive.Close>

                {title != null && (
                  <div className="relative z-[1] shrink-0 px-4 pt-4 pb-2">
                    {typeof title === 'string' ? (
                      <h2 className="text-lg font-semibold text-[#101828]">{title}</h2>
                    ) : (
                      title
                    )}
                  </div>
                )}

                <SelectMenuPortalContext.Provider value={menuPortalTarget}>
                  <div
                    className={cn(
                      'relative z-[1] flex-1 overflow-y-auto overflow-x-hidden min-h-0',
                      'py-3 px-4 mt-4 mb-4',
                      bodyClassName
                    )}
                  >
                    {children}
                  </div>
                </SelectMenuPortalContext.Provider>

                {footer != null && (
                  <div className="relative z-[1] shrink-0 border-t border-[#EAECF0] px-4 py-4">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

export default Drawer;
