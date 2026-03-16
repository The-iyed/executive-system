import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@gl/components/ui/button";
import type { AgentResponse } from "@gl/api/agents/types";
import { useQueryAgent } from "@gl/hooks/agents/useAgentsApi";

interface AgentChatViewProps {
  agent: AgentResponse;
  onBack: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
}

export function AgentChatView({ agent, onBack }: AgentChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryMutation = useQueryAgent();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, queryMutation.isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || queryMutation.isPending) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");

    queryMutation.mutate(
      { agentId: agent.id, data: { query: text } },
      {
        onSuccess: (res) => {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", text: res.answer, citations: res.citations },
          ]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", text: `حدث خطأ: ${err.message}` },
          ]);
        },
      }
    );
  }, [input, agent.id, queryMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background" dir="rtl">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-card/80 backdrop-blur-sm px-5 py-3.5">
        <Button variant="ghost" size="icon" onClick={onBack} className="size-9 rounded-xl">
          <ArrowRight className="size-4" />
        </Button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="size-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate text-foreground">{agent.name}</h2>
            <p className="text-[11px] text-muted-foreground truncate">{agent.description || "وكيل ذكي"}</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="relative mb-5">
              <div className="absolute -inset-3 rounded-full bg-primary/5 blur-lg" />
              <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
                <Sparkles className="size-7 text-primary/60" />
              </div>
            </div>
            <p className="text-base font-medium text-foreground mb-1">ابدأ المحادثة</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              اكتب رسالتك وسيرد عليك <span className="font-medium text-foreground/70">{agent.name}</span> بناءً على تعليماته
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-1 ml-2.5">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
                <div className="max-w-[78%] flex flex-col gap-1.5">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "aoun-user-msg rounded-br-lg"
                        : "bg-muted/60 text-foreground rounded-bl-lg"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {msg.citations.map((c, i) => (
                        <span key={i} className="text-[10px] text-primary/60 bg-primary/5 rounded-md px-1.5 py-0.5 border border-primary/10">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {queryMutation.isPending && (
              <div className="flex justify-end">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-1 ml-2.5">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-lg bg-muted/60 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/30 bg-card/50 backdrop-blur-sm px-4 pb-5 pt-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2.5">
          <div className="flex-1 aoun-input-container rounded-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
              style={{ maxHeight: 120 }}
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || queryMutation.isPending}
            className="size-11 shrink-0 rounded-xl shadow-sm"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
