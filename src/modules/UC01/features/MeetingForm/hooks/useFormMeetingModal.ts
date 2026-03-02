import { useState } from 'react';

export const useFormMeetingModal = () => {
  const [open, setOpen] = useState(true);
  
  const onOpenChange = (open: boolean) => {
    setOpen(open);
  };
  
  return { 
    open, 
    onOpenChange 
  };
};