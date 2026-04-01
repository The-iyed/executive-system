import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui';
import {
  createMinisterDirective,
  uploadMinisterDirectiveVoice,
  type CreateMinisterDirectivePayload,
} from '@/modules/shared/api/directives';
import type { DirectiveType, ImportanceLevel, PriorityLevel, DurationUnit } from '@/modules/shared/types/minister-directive-enums';
import {
  DIRECTIVE_TYPE_FORM_OPTIONS,
  IMPORTANCE_OPTIONS,
  PRIORITY_OPTIONS,
  DURATION_UNIT_LABELS,
} from '@/modules/shared/types/minister-directive-enums';

export interface CreateMinisterDirectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const defaultPayload = (): CreateMinisterDirectivePayload => ({
  title: '',
  /** Required by API — new directives use minister workflow status */
  status: 'TAKEN',
  scheduling_officer_status: 'OPEN',
  directive_type: 'SCHEDULING',
  importance: 'NORMAL',
  priority: 'NORMAL',
  due_duration_enabled: false,
  due_duration_value: 1,
  due_duration_unit: 'DAY',
  responsible_user: '',
});

export function CreateMinisterDirectiveModal({
  open,
  onOpenChange,
  onCreated,
}: CreateMinisterDirectiveModalProps) {
  const [payload, setPayload] = useState<CreateMinisterDirectivePayload>(() => defaultPayload());
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setPayload(defaultPayload());
      setAudioBlob(null);
      setIsRecording(false);
    }
  }, [open]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        stopStream();
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setAudioBlob(null);
    } catch {
      toast.error('تعذر الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = (payload.title ?? '').trim();
    if (!title) {
      toast.error('يرجى إدخال نص التوجيه');
      return;
    }

    setSubmitting(true);
    try {
      let voiceNotePath: string | undefined;
      if (audioBlob && audioBlob.size > 0) {
        try {
          voiceNotePath = await uploadMinisterDirectiveVoice(audioBlob, `voice-${Date.now()}`);
        } catch (uploadErr) {
          console.error(uploadErr);
          const desc =
            uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          toast.error('فشل رفع الملف الصوتي', { description: desc.slice(0, 280) });
          return;
        }
      }

      const body: CreateMinisterDirectivePayload = {
        title,
        status: payload.status ?? 'TAKEN',
        scheduling_officer_status: 'OPEN',
        directive_type: payload.directive_type,
        importance: payload.importance,
        priority: payload.priority,
        due_duration_enabled: payload.due_duration_enabled,
        ...(payload.due_duration_enabled
          ? {
              due_duration_value: Number(payload.due_duration_value) || 1,
              due_duration_unit: payload.due_duration_unit as DurationUnit,
            }
          : {}),
        ...(payload.responsible_user?.trim()
          ? { responsible_user: payload.responsible_user.trim() }
          : {}),
        ...(voiceNotePath ? { voice_note_path: voiceNotePath } : {}),
      };

      await createMinisterDirective(body);

      toast.success('تم حفظ التوجيه بنجاح');
      onCreated();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = <K extends keyof CreateMinisterDirectivePayload>(
    key: K,
    value: CreateMinisterDirectivePayload[K],
  ) => {
    setPayload((p) => ({ ...p, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
        onPointerDownOutside={(ev) => submitting && ev.preventDefault()}
      >
        <DialogHeader className="text-right space-y-1">
          <DialogTitle className="text-lg font-bold">بيانات التوجيه</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label className="text-right block">
              نوع التوجيه <span className="text-destructive">*</span>
            </Label>
            <Select
              value={payload.directive_type ?? 'SCHEDULING'}
              onValueChange={(v) => setField('directive_type', v as DirectiveType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {DIRECTIVE_TYPE_FORM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-right block">
              التوجيه <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={payload.title ?? ''}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="اكتب التوجيه هنا، أو استخدم الإدخال الصوتي..."
              className="min-h-[120px] text-right"
              rows={5}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
              <span className="text-xs text-muted-foreground">أو سجل توجيهك صوتيًا</span>
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={startRecording}
                    disabled={submitting}
                  >
                    <Mic className="size-4" />
                    تسجيل صوتي
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                  >
                    إيقاف التسجيل
                  </Button>
                )}
                {audioBlob && !isRecording && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioBlob(null)}
                  >
                    حذف الصوت
                  </Button>
                )}
              </div>
            </div>
            {audioBlob && !isRecording && (
              <p className="text-xs text-primary">تم تسجيل ملف صوتي وسيُرفَع مع الحفظ</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-right block">
              الأهمية <span className="text-destructive">*</span>
            </Label>
            <Select
              value={payload.importance ?? 'NORMAL'}
              onValueChange={(v) => setField('importance', v as ImportanceLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPORTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-right block">
              الأولوية <span className="text-destructive">*</span>
            </Label>
            <Select
              value={payload.priority ?? 'NORMAL'}
              onValueChange={(v) => setField('priority', v as PriorityLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-right block">المسؤول (اختياري)</Label>
            <Input
              value={payload.responsible_user ?? ''}
              onChange={(e) => setField('responsible_user', e.target.value)}
              placeholder="معرف أو بريد المستخدم"
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="rounded-lg border border-border/50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="due-duration" className="text-right cursor-pointer flex-1">
                تفعيل مدة الاستحقاق
              </Label>
              <Switch
                id="due-duration"
                checked={!!payload.due_duration_enabled}
                onCheckedChange={(v) => setField('due_duration_enabled', v)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right">
              عند التفعيل يمكن تحديد الوحدة والقيمة.
            </p>
            {payload.due_duration_enabled && (
              <div className="flex gap-2 flex-row-reverse">
                <Input
                  type="number"
                  min={1}
                  className="w-20 text-center"
                  value={payload.due_duration_value ?? 1}
                  onChange={(e) =>
                    setField('due_duration_value', Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                />
                <Select
                  value={(payload.due_duration_unit as string) ?? 'DAY'}
                  onValueChange={(v) => setField('due_duration_unit', v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['HOUR', 'DAY'] as const).map((u) => (
                      <SelectItem key={u} value={u}>
                        {DURATION_UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              <X className="size-4 ml-1" />
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5 bg-[#048F86] hover:bg-[#037A72]">
              {submitting ? (
                'جاري الحفظ...'
              ) : (
                <>
                  <Save className="size-4" />
                  حفظ التوجيه
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
