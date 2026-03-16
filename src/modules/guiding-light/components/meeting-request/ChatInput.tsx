import { Send, AudioLines, Paperclip } from "lucide-react";
import { Button } from "@gl/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="تفضّل بطلب اجتماع.."
        rows={1}
        disabled={disabled}
        className="min-w-0 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
      />
      <Button
        size="icon"
        className="size-10 shrink-0 rounded-full bg-linear-to-l from-[#048F86] to-[#6DCDCD] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        onClick={onSend}
        disabled={!value.trim() || disabled}
      >
        <Send className="size-4" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="size-10 shrink-0 rounded-full"
        disabled={disabled}
      >
        <AudioLines className="size-5 text-muted-foreground" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="size-10 shrink-0 rounded-full"
        disabled={disabled}
      >
        <Paperclip className="size-5 text-muted-foreground" />
      </Button>
    </div>
  );
}

export { ChatInput };
