import { ErrorStateSVG } from "@gl/components/ui/empty-states";

interface ChatErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ChatErrorMessage({ message, onRetry }: ChatErrorMessageProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-destructive/20 bg-destructive/[0.03] px-5 py-5 text-center">
      <ErrorStateSVG className="size-20 mb-2" />
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl bg-destructive/10 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 active:scale-[0.97] transition-all"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export { ChatErrorMessage };
