import { useState, useEffect, useCallback } from "react";
import { Button } from "@gl/components/ui/button";
import { Input } from "@gl/components/ui/input";
import { Label } from "@gl/components/ui/label";
import { Upload, X, FileText, Sparkles, Bot } from "lucide-react";
import type { Agent } from "@gl/stores/agents-store";

interface AgentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; prompt: string; files: { name: string; size: number }[] }) => void;
  agent?: Agent | null;
}

export function AgentFormModal({ open, onClose, onSubmit, agent }: AgentFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setPrompt(agent.prompt);
      setFiles(agent.files);
    } else {
      setName("");
      setDescription("");
      setPrompt("");
      setFiles([]);
    }
  }, [agent, open]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    const newFiles = Array.from(uploaded).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), prompt: prompt.trim(), files });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[640px] bg-background shadow-2xl transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border/40 bg-gradient-to-bl from-primary/[0.04] to-transparent px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                {agent ? <Bot className="size-5 text-primary" /> : <Sparkles className="size-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{agent ? "تعديل الوكيل" : "إنشاء وكيل جديد"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">حدد التعليمات والملفات المرجعية</p>
              </div>
            </div>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-name" className="text-[13px] font-medium">اسم الوكيل</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مساعد التقارير"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-desc" className="text-[13px] font-medium">وصف مختصر</Label>
            <Input
              id="agent-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ماذا يفعل هذا الوكيل؟"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Prompt */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-prompt" className="text-[13px] font-medium">التعليمات (Prompt)</Label>
            <textarea
              id="agent-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب التعليمات التي يتبعها الوكيل..."
              className="min-h-[160px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          </div>

          {/* Files */}
          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-medium">ملفات مرفقة</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 px-4 py-5 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.03]">
              <Upload className="size-4" />
              <span>اسحب الملفات أو انقر للاختيار</span>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            {files.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3.5 py-2.5 text-xs">
                    <FileText className="size-4 shrink-0 text-primary/60" />
                    <span className="flex-1 truncate text-foreground text-[13px]">{f.name}</span>
                    <span className="text-muted-foreground/70">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-border/40 px-6 py-4 bg-muted/20">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-5">إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !prompt.trim()} className="rounded-xl px-6 gap-1.5 shadow-sm">
            {agent ? "حفظ التعديلات" : "إنشاء الوكيل"}
          </Button>
        </div>
      </div>
    </>
  );
}
