import { useState, useRef, useEffect, useCallback } from "react";
import type { MeetingRequestType } from "@gl/types/meeting-request";
import { AnimatedOrb } from "./AnimatedOrb";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { MeetingSummaryCard } from "./MeetingSummaryCard";

interface WrittenRequestTabProps {
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Step = "idle" | "title" | "goal" | "type" | "complete";

const AI_RESPONSES: Record<Exclude<Step, "complete">, string> = {
  idle: "ممتاز، من فضلكم زودوني بالاسم الرسمي للاجتماع.",
  title: "شكرًا معالي الوزير. وما الهدف الرئيسي من هذا الاجتماع؟",
  goal: "مفهوم. هل هذا الاجتماع خاص، داخلي، أم خارجي؟",
  type: "تم تسجيل المعلومات، معالي الوزير. طلب الاجتماع جاهز للإرسال.",
};

function detectType(text: string): MeetingRequestType {
  if (text.includes("خارجي")) return "external";
  if (text.includes("خاص")) return "private";
  return "internal";
}

function WrittenRequestTab({ onClose }: WrittenRequestTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [meetingData, setMeetingData] = useState({
    title: "",
    goal: "",
    type: "internal" as MeetingRequestType,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role, content },
      ]);
    },
    []
  );

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    addMessage("user", trimmed);
    setText("");

    const currentStep = step;
    const nextStep: Step =
      currentStep === "idle"
        ? "title"
        : currentStep === "title"
          ? "goal"
          : currentStep === "goal"
            ? "type"
            : "complete";

    if (currentStep === "title") {
      setMeetingData((prev) => ({ ...prev, title: trimmed }));
    } else if (currentStep === "goal") {
      setMeetingData((prev) => ({ ...prev, goal: trimmed }));
    } else if (currentStep === "type") {
      setMeetingData((prev) => ({ ...prev, type: detectType(trimmed) }));
    }

    setIsTyping(true);
    setTimeout(() => {
      addMessage("assistant", AI_RESPONSES[currentStep as keyof typeof AI_RESPONSES]);
      setStep(nextStep);
      setIsTyping(false);
    }, 600);
  }

  function handleSubmitMeeting() {
    // Future: submit meetingData to API
    onClose();
  }

  const hasMessages = messages.length > 0;

  if (!hasMessages) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <AnimatedOrb isActive={false} />

        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            مرحبًا معالي الوزير،
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            أنا المساعد الذكي لمكتبكم، رهن إشارتكم لتقديم الدعم المطلوب.
          </p>
        </div>

        <div className="w-full max-w-md px-4">
          <ChatInput
            value={text}
            onChange={setText}
            onSend={handleSend}
            disabled={isTyping}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-112 flex-col pt-4">
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 scrollbar-hide"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content}>
            {msg.role === "assistant" &&
              step === "complete" &&
              msg === messages[messages.length - 1] && (
                <MeetingSummaryCard
                  title={meetingData.title}
                  goal={meetingData.goal}
                  type={meetingData.type}
                  onSend={handleSubmitMeeting}
                />
              )}
          </ChatMessage>
        ))}

        {isTyping && (
          <div className="self-end flex items-center gap-2 text-sm text-muted-foreground">
            <span className="animate-pulse">يكتب...</span>
            <div
              className="size-7 shrink-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 35% 35%, #9CE0DB, #6DCDCD, #048F86)",
              }}
            />
          </div>
        )}
      </div>

      <div className="shrink-0 px-2 pt-3">
        <ChatInput
          value={text}
          onChange={setText}
          onSend={handleSend}
          disabled={isTyping || step === "complete"}
        />
      </div>
    </div>
  );
}

export { WrittenRequestTab };
