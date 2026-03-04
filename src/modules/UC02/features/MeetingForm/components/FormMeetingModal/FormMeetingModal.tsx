import React from 'react';
import { Drawer } from '@/modules/shared';

export interface FormMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

export function FormMeetingModal({
  open,
  onOpenChange,
  className,
  children,
}: FormMeetingModalProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      width='100%'
      className={className}
      bodyClassName="p-4 min-w-0"
    >
      {children}
    </Drawer>
  );
}

export default FormMeetingModal;
