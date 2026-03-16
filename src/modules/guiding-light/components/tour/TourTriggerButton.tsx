import { HelpCircle } from "lucide-react";

interface TourTriggerButtonProps {
  onClick: () => void;
}

function TourTriggerButton({ onClick }: TourTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
      aria-label="جولة تعريفية"
    >
      <HelpCircle className="size-4" />
      جولة تعريفية
    </button>
  );
}

export { TourTriggerButton };
