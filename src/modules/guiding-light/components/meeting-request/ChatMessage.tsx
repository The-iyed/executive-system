import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@gl/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  children?: React.ReactNode;
}

function ChatMessage({ role, content, children }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="max-w-[80%] rounded-2xl bg-[#F3F9FF] px-4 py-3 text-sm text-foreground">
        {content}
      </div>
    );
  }

  return (
    <div className="self-end max-w-[90%]">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-foreground">{content}</p>
          {children}
        </div>
        <div
          className="size-7 shrink-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #9CE0DB, #6DCDCD, #048F86)",
          }}
        />
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        <Button size="icon" variant="ghost" className="size-7 rounded-full">
          <Copy className="size-3.5 text-muted-foreground" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7 rounded-full">
          <ThumbsUp className="size-3.5 text-muted-foreground" />
        </Button>
        <Button size="icon" variant="ghost" className="size-7 rounded-full">
          <ThumbsDown className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

export { ChatMessage };
