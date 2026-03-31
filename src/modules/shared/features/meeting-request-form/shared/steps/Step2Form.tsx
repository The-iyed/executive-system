import { Upload, X, FileText } from "lucide-react";
import { Badge, cn } from "@/lib/ui";
import { useCallback, useRef, useState } from "react";
import { FormField } from "../fields/FieldGroup";
import { useStep2Visibility, type Step1Context } from "../hooks/useStep2Form";
import {
  useStep2Content,
  
  type Step2ContentInitialData,
} from "../hooks/useStep2Content";

/* ═══════════════════════════════════════════════════════════════════════════
   SingleFileUploadZone — drop zone for a single file
   ═══════════════════════════════════════════════════════════════════════════ */

interface SingleFileUploadZoneProps {
  onSelect: (file: File) => void;
  accept: string;
  acceptLabel: string;
  hasError?: boolean;
}

function SingleFileUploadZone({ onSelect, accept, acceptLabel, hasError }: SingleFileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onSelect(file);
      e.target.value = "";
    },
    [onSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onSelect(file);
    },
    [onSelect],
  );

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01] shadow-sm"
            : hasError
              ? "border-destructive/50 bg-destructive/5"
              : "border-muted-foreground/20 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200",
          isDragOver ? "bg-primary/10" : "bg-muted group-hover:bg-primary/10",
        )}>
          <Upload className={cn(
            "h-5 w-5 transition-colors duration-200",
            isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary",
          )} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold cursor-pointer hover:underline">اضغط للرفع</span>{" "}
            أو اسحب الملف هنا
          </p>
          <p className="text-xs text-muted-foreground/60">{acceptLabel} — ملف واحد فقط — حد أقصى 20 ميغابايت</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MultiFileDropZone — drop zone for multiple files
   ═══════════════════════════════════════════════════════════════════════════ */

interface MultiFileDropZoneProps {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  accept: string;
  acceptLabel: string;
}

function MultiFileDropZone({ files, onAdd, onRemove, accept, acceptLabel }: MultiFileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) onAdd(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01] shadow-sm"
            : "border-muted-foreground/20 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200",
          isDragOver ? "bg-primary/10" : "bg-muted group-hover:bg-primary/10",
        )}>
          <Upload className={cn(
            "h-5 w-5 transition-colors duration-200",
            isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary",
          )} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold cursor-pointer hover:underline">اضغط للرفع</span>{" "}
            أو اسحب الملفات هنا
          </p>
          <p className="text-xs text-muted-foreground/60">{acceptLabel} — حد أقصى 20 ميغابايت</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onAdd(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {/* New files displayed below the upload zone */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <FileCard
              key={`new-${file.name}-${i}`}
              name={file.name}
              size={file.size}
              onDelete={() => onRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FileCard — displays a file with optional version badge and delete button
   ═══════════════════════════════════════════════════════════════════════════ */

interface FileCardProps {
  name: string;
  size?: number;
  version?: number;
  onDelete?: () => void;
}

function FileCard({ name, size, version, onDelete }: FileCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate text-foreground">{name}</p>
          {version != null && (
            <Badge variant="secondary" className="text-xs shrink-0">
              النسخة {version}
            </Badge>
          )}
        </div>
        {size != null && (
          <p className="text-xs text-muted-foreground">{(size / 1024 / 1024).toFixed(2)} MB</p>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
          title="حذف"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step2Form — main form
   ═══════════════════════════════════════════════════════════════════════════ */

interface Step2FormProps {
  step1Data: Step1Context;
  onSubmit: (formData: FormData) => void;
  initialContentData?: Step2ContentInitialData;
  isEditMode?: boolean;
  meetingStatus?: string;
  callerRole?: string;
}

export function Step2Form({
  step1Data,
  onSubmit,
  initialContentData,
  isEditMode = false,
  meetingStatus,
  callerRole,
}: Step2FormProps) {
  const { showPresentation, presentationRequired } = useStep2Visibility(step1Data);

  const {
    state,
    hasPresentationFile,
    hasContent,
    canUploadNewPresentation,
    canDeleteExistingPresentation,
    uploadPresentation,
    removeNewPresentation,
    removeExistingPresentation,
    addAdditionalFiles,
    removeAdditionalFile,
    deleteExistingAdditional,
    commitNewFiles,
    prepareFormData,
  } = useStep2Content({ initialData: initialContentData, isEditMode, meetingStatus });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Validation ── */

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (presentationRequired && !hasPresentationFile) {
      errs.presentation_files = "يجب رفع ملف عرض تقديمي واحد على الأقل (PDF)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [presentationRequired, hasPresentationFile]);

  /* ── Submit ── */

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) {
        scrollToAlert();
        return;
      }

      // Skip API call when no content has been added or changed
      if (!hasContent) {
        onSubmit(null);
        return;
      }

      const fd = prepareFormData();
      commitNewFiles();
      onSubmit(fd);
    },
    [validate, onSubmit, prepareFormData, commitNewFiles, hasContent],
  );

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      <div className="space-y-6">

        {/* ── Presentation File ── */}
        {showPresentation && (
          <FormField
            label="العرض التقديمي (PDF)"
            name="presentation_files"
            required={presentationRequired}
            errors={buildFieldError("presentation_files", errors.presentation_files)}
            colSpan={12}
          >
            <div className="space-y-3">
              {/* Upload zone first */}
              {canUploadNewPresentation && (
                <SingleFileUploadZone
                  onSelect={uploadPresentation}
                  accept=".pdf"
                  acceptLabel="PDF"
                  hasError={!!errors.presentation_files}
                />
              )}

              {/* New presentation file (below upload, above existing) */}
              {state.newPresentationFile && (
                <FileCard
                  name={state.newPresentationFile.name}
                  size={state.newPresentationFile.size}
                  onDelete={removeNewPresentation}
                />
              )}

              {/* Existing presentation files (with version) */}
              {state.existingPresentations.length > 0 && (
                <div className="space-y-2">
                  {/* {state.existingPresentations.map((att) => ( */}
                  {[...state.existingPresentations].sort((a, b) => (b.presentation_sequence ?? 0) - (a.presentation_sequence ?? 0)).map((att) => (
                    <FileCard
                      key={att.id}
                      name={att.file_name}
                      size={att.file_size}
                      version={att.presentation_sequence}
                      onDelete={canDeleteExistingPresentation ? () => removeExistingPresentation(att.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </FormField>
        )}

        {/* ── Additional Files ── */}
        <FormField
          label="مرفقات إضافية (PDF, Word, Excel)"
          name="additional_files"
          errors={{}}
          colSpan={12}
        >
          <MultiFileDropZone
            files={state.additional_files}
            onAdd={addAdditionalFiles}
            onRemove={removeAdditionalFile}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            acceptLabel="PDF, WORD, EXCEL"
          />

          {state.existingAdditionalFiles.length > 0 && (
            <div className="space-y-2 mt-3">
              {state.existingAdditionalFiles.map((att) => (
                <FileCard
                  key={att.id}
                  name={att.file_name}
                  size={att.file_size}
                  onDelete={() => deleteExistingAdditional(att.id)}
                />
              ))}
            </div>
          )}
        </FormField>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

function buildFieldError(name: string, message?: string): Record<string, any> {
  return message ? { [name]: { message } } : {};
}

function scrollToAlert() {
  setTimeout(() => {
    const el = document.querySelector('[role="alert"]');
    if (!el) return;
    const sc = el.closest(".overflow-y-auto");
    if (sc) {
      const cr = sc.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      sc.scrollBy({ top: er.top - cr.top - cr.height / 2, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, 50);
}