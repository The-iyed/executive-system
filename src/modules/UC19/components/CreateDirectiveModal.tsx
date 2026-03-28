import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Save, ChevronDown, Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import {
  createDirective,
  uploadVoiceNote,
  type CreateDirectivePayload,
  type DirectiveType,
  type ImportanceLevel,
  type PriorityLevel,
  type DurationUnit,
  type DirectivesListResponse,
  type MinisterDirective,
} from '../api/directivesApi';

interface CreateDirectiveModalProps {
  open: boolean;
  onClose: () => void;
}

const DIRECTIVE_TYPES: { value: DirectiveType; label: string }[] = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'EXECUTIVE_OFFICE', label: 'المكتب التنفيذي' },
  { value: 'GOVERNMENT_CENTER', label: 'مركز الحكومة' },
];

const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'IMPORTANT', label: 'مهم' },
  { value: 'VERY_IMPORTANT', label: 'مهم جداً' },
];

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'NORMAL', label: 'عادي' },
  { value: 'URGENT', label: 'عاجل' },
  { value: 'VERY_URGENT', label: 'عاجل جداً' },
];

const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'HOUR', label: 'ساعة' },
  { value: 'DAY', label: 'يوم' },
];

// ── Voice Recorder Hook ──
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playCurrentTime, setPlayCurrentTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);
      setPlayProgress(0);
      setPlayCurrentTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Permission denied
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setPlayProgress(0);
    setPlayCurrentTime(0);
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setPlayProgress((audio.currentTime / audio.duration) * 100);
          setPlayCurrentTime(audio.currentTime);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setPlayProgress(0);
        setPlayCurrentTime(0);
      };
      audio.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [audioUrl]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return {
    isRecording, audioBlob, audioUrl, duration,
    isPlaying, playProgress, playCurrentTime,
    startRecording, stopRecording, clearRecording, togglePlayback,
    formatDuration, formatTime,
  };
}

export function CreateDirectiveModal({ open, onClose }: CreateDirectiveModalProps) {
  const qc = useQueryClient();
  const voice = useVoiceRecorder();

  const [directiveType, setDirectiveType] = useState<DirectiveType>('GENERAL');
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState<ImportanceLevel>('NORMAL');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [dueDurationEnabled, setDueDurationEnabled] = useState(false);
  const [dueDurationValue, setDueDurationValue] = useState(1);
  const [dueDurationUnit, setDueDurationUnit] = useState<DurationUnit>('HOUR');

  const resetForm = () => {
    setDirectiveType('GENERAL');
    setTitle('');
    setImportance('NORMAL');
    setPriority('NORMAL');
    setDueDurationEnabled(false);
    setDueDurationValue(1);
    setDueDurationUnit('HOUR');
    voice.clearRecording();
  };

  const mutation = useMutation({
    mutationFn: async (payload: CreateDirectivePayload) => {
      const created = await createDirective(payload);
      if (voice.audioBlob) {
        try {
          return await uploadVoiceNote(created.id, voice.audioBlob);
        } catch {
          return created;
        }
      }
      return created;
    },
    onSuccess: (newDirective: MinisterDirective) => {
      qc.setQueriesData<DirectivesListResponse>(
        { queryKey: ['uc19-directives'] },
        (old) => {
          if (!old) return old;
          return { ...old, items: [newDirective, ...old.items], total: old.total + 1 };
        }
      );
      qc.invalidateQueries({ queryKey: ['uc19-directives'] });
      resetForm();
      onClose();
    },
  });

  const hasVoice = !!voice.audioBlob;
  const hasText = title.trim().length > 0;
  const canSubmit = (hasText || hasVoice) && !mutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: CreateDirectivePayload = {
      title: hasText ? title.trim() : 'توجيه صوتي',
      status: 'TAKEN',
      scheduling_officer_status: 'OPEN',
      directive_type: directiveType,
      importance,
      priority,
      due_duration_enabled: dueDurationEnabled,
    };
    if (dueDurationEnabled) {
      payload.due_duration_value = dueDurationValue;
      payload.due_duration_unit = dueDurationUnit;
    }
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30">
          <h2 className="text-[16px] font-bold text-foreground">بيانات التوجيه</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Directive Type */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">
              نوع التوجيه <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                value={directiveType}
                onChange={(e) => setDirectiveType(e.target.value as DirectiveType)}
                className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
              >
                {DIRECTIVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Directive: Text OR Voice (exclusive) */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">
              التوجيه <span className="text-destructive">*</span>
            </label>

            {/* Show textarea when: no voice recorded AND not currently recording */}
            {!hasVoice && !voice.isRecording && (
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب التوجيه هنا..."
                rows={4}
                className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none resize-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 mb-3"
              />
            )}

            {/* Recording in progress */}
            {voice.isRecording && (
              <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50/40 p-6 mb-3">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-0 animate-ping rounded-full bg-red-400/20" />
                    <div className="relative flex size-14 items-center justify-center rounded-full bg-red-500 text-white">
                      <Mic className="size-6" />
                    </div>
                  </div>
                  <p className="text-[13px] font-medium text-foreground">جاري التسجيل...</p>
                  <p className="text-[20px] font-bold text-red-600 tabular-nums">
                    {voice.formatDuration(voice.duration)}
                  </p>
                  <button
                    type="button"
                    onClick={voice.stopRecording}
                    className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-2.5 text-[12px] font-medium text-white transition-all hover:bg-red-600 active:scale-95"
                  >
                    <Square className="size-3.5" fill="currentColor" />
                    إيقاف التسجيل
                  </button>
                </div>
              </div>
            )}

            {/* Voice preview (same style as list VoicePlayer) */}
            {!voice.isRecording && hasVoice && (
              <div className="rounded-xl bg-muted/30 border border-border/40 p-3 mb-3">
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={voice.togglePlayback}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                  >
                    {voice.isPlaying ? (
                      <Pause className="size-3.5" fill="currentColor" />
                    ) : (
                      <Play className="size-3.5" fill="currentColor" style={{ marginInlineStart: '2px' }} />
                    )}
                  </button>
                  <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden cursor-pointer">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-100"
                      style={{ width: `${voice.playProgress}%`, float: 'right' }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8 text-center">
                    {voice.isPlaying ? voice.formatTime(voice.playCurrentTime) : voice.formatDuration(voice.duration)}
                  </span>
                  <button
                    type="button"
                    onClick={voice.clearRecording}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="حذف التسجيل"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Record button: show when no voice and not recording */}
            {!hasVoice && !voice.isRecording && (
              <button
                type="button"
                onClick={voice.startRecording}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Mic className="size-3.5" />
                أو سجّل توجيهك صوتياً
              </button>
            )}
          </div>

          {/* Importance & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                الأهمية <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                  className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {IMPORTANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-2">
                الأولوية <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-3 text-[13px] text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Due Duration */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">مدة الاستحقاق</label>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-foreground">تفعيل مدة الاستحقاق</p>
                  <p className="text-[11px] text-muted-foreground">عند التفعيل يمكن تحديد الوحدة والقيمة.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dueDurationEnabled}
                  onClick={() => setDueDurationEnabled(!dueDurationEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    dueDurationEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      dueDurationEnabled ? '-translate-x-[1.375rem]' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {dueDurationEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">القيمة</label>
                    <input
                      type="number"
                      min={1}
                      value={dueDurationValue}
                      onChange={(e) => setDueDurationValue(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">الوحدة</label>
                    <div className="relative">
                      <select
                        value={dueDurationUnit}
                        onChange={(e) => setDueDurationUnit(e.target.value as DurationUnit)}
                        className="w-full appearance-none rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      >
                        {DURATION_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-[11px] text-destructive">
              حدث خطأ أثناء الإنشاء، يرجى المحاولة مرة أخرى
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border/30 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            حفظ التوجيه
          </button>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl border border-border/50 bg-card px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
