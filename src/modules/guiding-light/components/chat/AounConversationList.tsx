import { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { Search, Mic, Loader2, ChevronLeft, Hash, Plus } from "lucide-react";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";
import { useConversations } from "@gl/hooks/chat/useConversations";
import { useConversation } from "@gl/hooks/chat/useConversation";
import { CONVERSATIONS_PAGE_LIMIT } from "@gl/api/constants";
import { transcribeAudio } from "@gl/api/legislator/conversations";
import type { Conversation } from "@gl/api/types";
import { ConversationListSkeleton } from "@gl/components/skeletons/ChatSkeleton";
import { EmptyState, EmptyChatSVG } from "@gl/components/ui/empty-states";

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const y = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  if (d.getTime() === t.getTime()) return "اليوم";
  if (d.getTime() === y.getTime()) return "أمس";
  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface Group { date: string; conversations: Conversation[]; }

function groupConversationsByDate(conversations: Conversation[]): Group[] {
  const groups: Record<string, Conversation[]> = {};
  conversations.forEach((c) => {
    const key = formatDateGroup(c.updated_at || c.created_at);
    (groups[key] ??= []).push(c);
  });
  Object.values(groups).forEach((g) => g.sort((a, b) =>
    new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  ));
  const order = ["اليوم", "أمس"];
  const rest = Object.entries(groups).filter(([k]) => !order.includes(k)).sort(([a], [b]) => b.localeCompare(a));
  return [
    ...order.filter((k) => groups[k]).map((date) => ({ date, conversations: groups[date] })),
    ...rest.map(([date, conversations]) => ({ date, conversations })),
  ];
}

interface AounConversationListProps {
  activeConversationId: string | undefined;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onCollapse?: () => void;
}

function AounConversationList({ activeConversationId, onSelectConversation, onNewChat, onCollapse }: AounConversationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchValue]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversations(CONVERSATIONS_PAGE_LIMIT, "updated_at", debouncedSearch);

  const conversationExists = useMemo(() => {
    if (!activeConversationId || !data?.pages) return false;
    return data.pages.some((p) => p.conversations.some((c) => c.conversation_id === activeConversationId));
  }, [activeConversationId, data]);

  const { data: singleConversation } = useConversation(
    activeConversationId && !conversationExists ? activeConversationId : undefined
  );

  const allConversations = useMemo(() => {
    const list = data?.pages ? data.pages.flatMap((p) => p.conversations) : [];
    if (singleConversation && !list.some((c) => c.conversation_id === singleConversation.conversation_id)) {
      return [singleConversation, ...list].sort((a, b) =>
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );
    }
    return list;
  }, [data, singleConversation]);

  const groups = useMemo(() => groupConversationsByDate(allConversations), [allConversations]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleVoiceClick = useCallback(async () => {
    if (isTranscribing) return;
    if (isRecording) {
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current!.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!audioChunksRef.current.length) { setIsRecording(false); return; }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (!blob.size) { setTranscriptionError("لم يُسجّل أي صوت"); setIsRecording(false); return; }
        setIsTranscribing(true); setTranscriptionError(null);
        try {
          const res = await transcribeAudio({ audio_file: new File([blob], "recording.webm", { type: "audio/webm" }), lang: "ar" });
          if (res.transcript?.trim()) { setSearchValue(res.transcript.trim()); setTimeout(() => searchInputRef.current?.focus(), 100); }
          else setTranscriptionError("لم يُرجع التحويل نصاً");
        } catch (err) { setTranscriptionError(err instanceof Error ? err.message : "فشل التحويل"); setTimeout(() => setTranscriptionError(null), 3000); }
        finally { setIsTranscribing(false); setIsRecording(false); }
      };
      mr.start(); setIsRecording(true);
    } catch { setTranscriptionError("تعذّر الوصول إلى الميكروفون"); setTimeout(() => setTranscriptionError(null), 3000); }
  }, [isRecording, isTranscribing]);

  return (
    <aside className="conversation-sidebar flex w-[300px] shrink-0 flex-col min-h-0 h-full" dir="rtl">
      {/* ─── Header ─── */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4">
        <span className="text-[17px] font-bold text-foreground tracking-tight">المحادثات</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:brightness-105 active:scale-95 transition-all duration-200 shadow-sm shadow-primary/20"
            title="محادثة جديدة"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="size-9 rounded-full text-muted-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 flex items-center justify-center transition-all duration-200"
              title="إغلاق"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="shrink-0 px-4 pb-4">
        <div className={`conversation-search flex items-center gap-2.5 rounded-2xl px-4 py-3 transition-all duration-200 ${
          isRecording ? "ring-1 ring-destructive/30 bg-destructive/5" :
          transcriptionError ? "ring-1 ring-destructive/20 bg-destructive/5" :
          ""
        }`}>
          <Search className="size-4 shrink-0 text-muted-foreground/30" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={transcriptionError || (isTranscribing ? "جاري التحويل..." : isRecording ? "جاري التسجيل..." : "ابحث في محادثاتك...")}
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); if (transcriptionError) setTranscriptionError(null); }}
            className="min-w-0 flex-1 bg-transparent text-right text-[13px] text-foreground/80 outline-none placeholder:text-muted-foreground/35 font-normal"
            dir="rtl"
            disabled={isTranscribing}
          />
          <button
            onClick={handleVoiceClick}
            disabled={isTranscribing}
            className="shrink-0 text-muted-foreground/30 hover:text-primary/70 disabled:opacity-50 transition-colors duration-200"
          >
            {isTranscribing ? <Loader2 className="size-4 animate-spin" /> :
             isRecording ? <span className="flex size-4 items-center justify-center"><span className="size-2 rounded-full bg-destructive animate-pulse" /></span> :
             <Mic className="size-4" />}
          </button>
        </div>
      </div>

      {/* ─── Conversation List ─── */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-4 scrollbar-hide" role="list">
        {isLoading && <ConversationListSkeleton />}

        {!isLoading && groups.length === 0 && (
          <EmptyState
            icon={<EmptyChatSVG className="size-24" />}
            title="لا توجد محادثات بعد"
            description="ابدأ محادثة جديدة مع عون"
            className="py-16"
          />
        )}

        {!isLoading && groups.map((group, gi) => (
          <div key={group.date} className="mb-2">
            {/* Date header with line */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[12px] font-semibold text-muted-foreground/45 shrink-0">{group.date}</span>
            </div>

            {/* Conversation items */}
            <div className="space-y-1">
              {group.conversations.map((c) => {
                const isActive = activeConversationId === c.conversation_id;
                const title = c.name || "محادثة جديدة";
                const time = formatTime(c.updated_at || c.created_at);

                return (
                  <button
                    key={c.conversation_id}
                    onClick={() => onSelectConversation(c.conversation_id)}
                    className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-3.5 text-right transition-all duration-200 ${
                      isActive
                        ? "conversation-item-active"
                        : "conversation-item-inactive"
                    }`}
                    title={title}
                  >
                    {/* Hash icon */}
                    <div className={`size-10 rounded-full shrink-0 flex items-center justify-center transition-colors duration-200 ${
                      isActive ? "bg-primary/10" : "bg-foreground/[0.04]"
                    }`}>
                      <Hash className={`size-4 ${isActive ? "text-primary/60" : "text-muted-foreground/25"}`} />
                    </div>

                    {/* Title */}
                    <span className={`text-[14px] truncate flex-1 leading-normal ${
                      isActive ? "font-bold text-foreground" : "font-medium text-foreground/60"
                    }`}>
                      {title}
                    </span>

                    {/* Time */}
                    <span className="text-[11px] text-muted-foreground/30 shrink-0 tabular-nums font-normal">
                      {time}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground/20" />
          </div>
        )}
      </div>
    </aside>
  );
}

export { AounConversationList };
