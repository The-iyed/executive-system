import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@gl/components/ui/input";
import { Label } from "@gl/components/ui/label";
import { Button } from "@gl/components/ui/button";
import {
  Upload, X, FileText, Sparkles, Bot, ArrowRight, Send, Save, RotateCcw, Loader2,
} from "lucide-react";
import type { AgentResponse } from "@gl/api/agents/types";
import { useCreateAgent, useUpdateAgent, useUploadAgentFiles, useAddAgentFiles, useQueryAgent } from "@gl/hooks/agents/useAgentsApi";

/* ─── Types ─── */
interface PreviewMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
}

interface AgentBuilderPageProps {
  agent?: AgentResponse | null;
  onSubmit: () => void;
  onCancel: () => void;
}

/* ─── Component ─── */
export function AgentBuilderPage({ agent, onSubmit, onCancel }: AgentBuilderPageProps) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [existingFiles, setExistingFiles] = useState<AgentResponse["uploaded_files"]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preview state
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [previewInput, setPreviewInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const uploadFiles = useUploadAgentFiles();
  const addFiles = useAddAgentFiles();
  const queryMutation = useQueryAgent();

  // Populate on edit/create switch
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setPrompt(agent.prompt);
      setExistingFiles(agent.uploaded_files ?? []);
      setNewFiles([]);
      return;
    }

    setName("");
    setDescription("");
    setPrompt("");
    setExistingFiles([]);
    setNewFiles([]);
  }, [agent]);

  // Auto-scroll preview
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [previewMessages, queryMutation.isPending]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    setNewFiles((prev) => [...prev, ...Array.from(uploaded)]);
    e.target.value = "";
  }, []);

  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Preview: query the agent (only if ready) */
  const handlePreviewSend = useCallback(() => {
    const text = previewInput.trim();
    if (!text || !agent || agent.status !== "ready") return;

    setPreviewMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setPreviewInput("");

    queryMutation.mutate(
      { agentId: agent.id, data: { query: text } },
      {
        onSuccess: (res) => {
          setPreviewMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", text: res.answer, citations: res.citations },
          ]);
        },
        onError: (err) => {
          setPreviewMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", text: `حدث خطأ: ${err.message}` },
          ]);
        },
      }
    );
  }, [previewInput, agent, queryMutation]);

  const handlePreviewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePreviewSend();
    }
  };

  const resetPreview = useCallback(() => {
    setPreviewMessages([]);
    setPreviewInput("");
  }, []);

  /** Submit: create or update agent, then upload files */
  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !prompt.trim()) return;
    if (!agent && newFiles.length === 0) {
      setSaveError("يرجى إرفاق ملف واحد على الأقل لإنشاء الوكيل");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (agent) {
        // Update existing agent
        await updateAgent.mutateAsync({
          id: agent.id,
          data: {
            name: name.trim(),
            description: description.trim(),
            prompt: prompt.trim(),
          },
        });

        // Upload files: add endpoint for ready agents, fallback to initial upload endpoint
        if (newFiles.length > 0) {
          let uploadRes: { uploaded_files?: AgentResponse["uploaded_files"] } | undefined;

          if (agent.status === "ready") {
            try {
              uploadRes = await addFiles.mutateAsync({ agentId: agent.id, files: newFiles });
            } catch {
              uploadRes = await uploadFiles.mutateAsync({ agentId: agent.id, files: newFiles });
            }
          } else {
            uploadRes = await uploadFiles.mutateAsync({ agentId: agent.id, files: newFiles });
          }

          const uploadedNow = uploadRes?.uploaded_files ?? [];
          if (uploadedNow.length > 0) {
            setExistingFiles((prev) => {
              const byId = new Map(prev.map((f) => [f.azure_file_id, f]));
              uploadedNow.forEach((f) => byId.set(f.azure_file_id, f));
              return Array.from(byId.values());
            });
          }

          setNewFiles([]);
        }
      } else {
        // Create new agent
        const created = await createAgent.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          prompt: prompt.trim(),
        });

        // Upload files to create Azure agent
        const uploadRes = await uploadFiles.mutateAsync({ agentId: created.id, files: newFiles });
        setExistingFiles(uploadRes?.uploaded_files ?? []);
        setNewFiles([]);
      }

      onSubmit();
    } catch (err: any) {
      setSaveError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  }, [agent, name, description, prompt, newFiles, createAgent, updateAgent, uploadFiles, addFiles, onSubmit]);

  const isValid = name.trim().length > 0 && prompt.trim().length > 0 && (agent ? true : newFiles.length > 0);
  const canPreview = !!agent && agent.status === "ready";

  return (
    <div className="flex h-full overflow-hidden" dir="rtl">
      {/* ─── Right: Form Panel ─── */}
      <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 flex flex-col border-l border-border/30 bg-card/50">
        {/* Header */}
        <div className="shrink-0 border-b border-border/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowRight className="size-4" />
            </button>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                {agent ? <Bot className="size-4.5 text-primary" /> : <Sparkles className="size-4.5 text-primary" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-foreground truncate">
                  {agent ? "تعديل الوكيل" : "إنشاء وكيل جديد"}
                </h2>
                <p className="text-[11px] text-muted-foreground">حدد التعليمات وجرّب مباشرة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 space-y-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-name" className="text-[12px] font-semibold text-muted-foreground">اسم الوكيل</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مساعد التقارير"
              className="h-10 rounded-xl text-sm"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-desc" className="text-[12px] font-semibold text-muted-foreground">وصف مختصر</Label>
            <Input
              id="agent-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ماذا يفعل هذا الوكيل؟"
              className="h-10 rounded-xl text-sm"
            />
          </div>

          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-prompt" className="text-[12px] font-semibold text-muted-foreground">التعليمات (Prompt)</Label>
            <textarea
              id="agent-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب التعليمات التي يتبعها الوكيل..."
              className="min-h-[140px] w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>

          {/* Existing files (edit mode) */}
          {agent && existingFiles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground">الملفات الحالية</Label>
              <div className="flex flex-col gap-1.5">
                {existingFiles.map((f) => (
                  <div key={f.azure_file_id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <FileText className="size-3.5 shrink-0 text-primary/60" />
                    <span className="flex-1 truncate text-foreground text-[12px]">{f.filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New files */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground">
              {agent ? "إضافة ملفات جديدة" : "ملفات مرفقة (مطلوب)"}
            </Label>
            <button
              type="button"
              onClick={() => {
                // Reset the input to allow re-selecting the same files
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                  fileInputRef.current.click();
                }
              }}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.03] ${!agent && newFiles.length === 0 ? "border-destructive/40 bg-destructive/[0.03]" : "border-border/50 bg-muted/20"}`}
            >
              <Upload className="size-4" />
              <span>اسحب الملفات أو انقر للاختيار</span>
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.xml" />
            {newFiles.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {newFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <FileText className="size-3.5 shrink-0 text-primary/60" />
                    <span className="flex-1 truncate text-foreground text-[12px]">{f.name}</span>
                    <span className="text-muted-foreground/60">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeNewFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col gap-2 border-t border-border/30 px-5 py-3.5 bg-muted/10">
          {saveError && (
            <p className="text-xs text-destructive">{saveError}</p>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="rounded-xl px-5 gap-1.5 shadow-sm flex-1">
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {agent ? "حفظ التعديلات" : "تأكيد الإنشاء"}
            </Button>
            <Button variant="outline" onClick={onCancel} className="rounded-xl px-4">إلغاء</Button>
          </div>
        </div>
      </div>

      {/* ─── Left: Live Preview Chat ─── */}
      <div className="hidden md:flex flex-1 flex-col min-h-0 bg-background">
        {/* Preview Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/8">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                {name.trim() || "معاينة الوكيل"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {canPreview ? "جرّب الوكيل مباشرة" : "أنشئ الوكيل أولاً ثم جرّبه"}
              </p>
            </div>
          </div>
          <button
            onClick={resetPreview}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RotateCcw className="size-3" />
            إعادة تعيين
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
          {previewMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="relative mb-5">
                <div className="absolute -inset-3 rounded-full bg-primary/5 blur-lg" />
                <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm">
                  <Sparkles className="size-6 text-primary/50" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {canPreview ? "جرّب وكيلك هنا" : "المعاينة متاحة بعد الإنشاء"}
              </p>
              <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                {canPreview
                  ? "أرسل رسالة لترى كيف سيتصرف الوكيل"
                  : "أكمل النموذج وارفع الملفات لإنشاء الوكيل أولاً"
                }
              </p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-2xl px-5 py-5 space-y-4">
              {previewMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-1 ml-2">
                      <Bot className="size-3.5 text-primary" />
                    </div>
                  )}
                  <div className="max-w-[78%] flex flex-col gap-1.5">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "aoun-user-msg rounded-br-lg"
                          : "bg-muted/50 text-foreground rounded-bl-lg"
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
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-1 ml-2">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-lg bg-muted/50 px-4 py-3">
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

        {/* Preview Input */}
        <div className="shrink-0 px-5 pb-5 pt-2">
          <div className="mx-auto max-w-2xl flex items-end gap-2">
            <div className="flex-1 aoun-input-container rounded-2xl">
              <textarea
                ref={inputRef}
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={handlePreviewKeyDown}
                placeholder={canPreview ? "اكتب رسالة تجريبية..." : "أنشئ الوكيل أولاً..."}
                rows={1}
                disabled={!canPreview}
                className="w-full resize-none bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                style={{ maxHeight: 100 }}
              />
            </div>
            <Button
              size="icon"
              onClick={handlePreviewSend}
              disabled={!previewInput.trim() || !canPreview || queryMutation.isPending}
              className="size-10 shrink-0 rounded-xl shadow-sm"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
