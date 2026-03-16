import { useRef, useCallback, useState, useEffect } from "react";
import { Paperclip, ArrowUp, Mic, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@gl/components/ui/select";
import { transcribeAudio } from "@gl/api/legislator/conversations";
import type { ChatMode } from "@gl/api/types";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";
import { isViewableInIframe } from "@gl/api/pdf-viewer";
import type { FileUploadState } from "./AounChatView";

const TEXTAREA_MAX_HEIGHT = 200;
const TEXTAREA_MIN_HEIGHT = 24;

const CHAT_MODE_OPTIONS: { value: ChatMode; label: string }[] = [
  { value: "normal", label: "عام" },
  { value: "deepSearch", label: "البحث المعمّق" },
  { value: "webSearch", label: "البحث على الويب" },
  { value: "stats", label: "الإحصائيات" },
  { value: "benchmarking", label: "المقارنة المعيارية" },
];

interface AounChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  attachedFiles?: File[];
  onAttach?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  fileUploadStates?: Map<File, FileUploadState>;
}

function AounChatInput({
  value, onChange, onSend, disabled = false,
  placeholder = "اسأل عون أي شيء...",
  selectedMode = "normal", onModeChange,
  attachedFiles = [], onAttach, onRemoveFile,
  fileUploadStates,
}: AounChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { openViewerWithFile } = useDocumentViewer();
  const canSend = value.trim() || attachedFiles.length > 0;

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT)}px`;
    ta.style.overflowY = ta.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => { adjustHeight(); }, [value, adjustHeight]);

  const handleVoiceClick = useCallback(async () => {
    if (isTranscribing) return;
    if (isRecording) {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
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
        if (!blob.size) { setIsRecording(false); return; }
        setIsTranscribing(true);
        try {
          const res = await transcribeAudio({ audio_file: new File([blob], "recording.webm", { type: "audio/webm" }), lang: "ar" });
          if (res.transcript?.trim()) {
            onChange(value.trim() ? `${value.trim()}\n${res.transcript.trim()}` : res.transcript.trim());
            setTimeout(() => { textareaRef.current?.focus(); adjustHeight(); }, 50);
          }
        } finally { setIsTranscribing(false); setIsRecording(false); }
      };
      mr.start(); setIsRecording(true);
    } catch { setIsRecording(false); }
  }, [isRecording, isTranscribing, value, onChange, adjustHeight]);

  const getFileStatusIcon = (file: File) => {
    const state = fileUploadStates?.get(file);
    if (!state) return null;
    switch (state.status) {
      case "uploading":
      case "processing":
        return <Loader2 className="size-3 shrink-0 animate-spin text-primary" />;
      case "ready":
        return <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />;
      case "error":
        return <AlertCircle className="size-3 shrink-0 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2" dir="rtl">
      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {attachedFiles.map((file, i) => {
            const state = fileUploadStates?.get(file);
            return (
              <span key={`${file.name}-${i}`} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                state?.status === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
              }`}>
                {getFileStatusIcon(file)}
                <button
                  type="button"
                  onClick={() => {
                    if (isViewableInIframe(file.name)) openViewerWithFile(file);
                    else { const u = URL.createObjectURL(file); window.open(u, "_blank"); setTimeout(() => URL.revokeObjectURL(u), 5000); }
                  }}
                  className="truncate max-w-[120px] hover:underline"
                >{file.name}</button>
                {state?.status === "error" && (
                  <span className="text-[10px] text-destructive/80">{state.error}</span>
                )}
                {onRemoveFile && <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveFile(i); }} className="text-muted-foreground hover:text-foreground">×</button>}
              </span>
            );
          })}
        </div>
      )}

      {/* Input container */}
      <div className={`aoun-input-container flex min-h-[52px] items-end gap-2 rounded-2xl px-3.5 py-2.5 ${
        isRecording ? "!border-destructive/40 !shadow-[0_0_0_3px_oklch(0.577_0.245_27.325/0.08)]" : ""
      }`}>
        {/* Send button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend || disabled}
          className="size-8 shrink-0 self-center rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-25 disabled:hover:scale-100"
        >
          <ArrowUp className="size-4" />
        </button>

        {/* Voice */}
        <button
          type="button"
          onClick={handleVoiceClick}
          disabled={disabled || isTranscribing}
          className="shrink-0 self-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
          title={isRecording ? "إيقاف" : "تسجيل صوتي"}
        >
          {isTranscribing ? <Loader2 className="size-4 animate-spin" /> :
           isRecording ? <span className="flex size-4 items-center justify-center"><span className="size-2.5 rounded-full bg-destructive animate-pulse" /></span> :
           <Mic className="size-4" />}
        </button>

        {/* File */}
        {onAttach && (
          <label className="shrink-0 cursor-pointer self-center">
            <input type="file" className="sr-only" multiple={selectedMode === "documentsAnalyzer" || selectedMode === "normal"} accept={selectedMode === "letters" ? ".pdf" : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"} onChange={(e) => { const f = e.target.files ? Array.from(e.target.files) : []; if (f.length) onAttach(f); e.target.value = ""; }} disabled={disabled} />
            <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Paperclip className="size-4" />
            </span>
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          style={{ minHeight: TEXTAREA_MIN_HEIGHT, maxHeight: TEXTAREA_MAX_HEIGHT }}
          className="min-w-0 flex-1 resize-none bg-transparent py-1 text-right text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 leading-relaxed"
        />

        {/* Mode */}
        {onModeChange && (
          <Select value={selectedMode} onValueChange={(v) => onModeChange(v as ChatMode)} disabled={disabled}>
            <SelectTrigger size="sm" className="w-fit shrink-0 border-0 bg-secondary/80 shadow-none focus:ring-0 text-xs text-muted-foreground rounded-lg">
              <SelectValue placeholder="الوضع" />
            </SelectTrigger>
            <SelectContent align="end">
              {CHAT_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export { AounChatInput };
