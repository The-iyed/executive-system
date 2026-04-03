import { useFormContext, Controller } from "react-hook-form";
import { useRef, useState, useCallback } from "react";
import { Input, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, cn } from "@/lib/ui";
import { Upload, FileText, X } from "lucide-react";
import { FormField, inputClass } from "./FieldGroup";
import { DIRECTIVE_METHOD_OPTIONS } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props {
  showMethod: boolean;
  showFile: boolean;
  showText: boolean;
  required?: boolean;
}

export function DirectiveSection({ showMethod, showFile, showText, required = true }: Props) {
  const { register, control, formState: { errors } } = useFormContext();
  const directiveEditable = useIsFieldEditable("is_based_on_directive");
  const methodEditable = useIsFieldEditable("directive_method");
  const textEditable = useIsFieldEditable("directive_text");

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">هل طلب الاجتماع بناءً على توجيه من معالي الوزير</Label>
          <div className="pt-1">
            <Controller name="is_based_on_directive" control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value === "true"}
                  onCheckedChange={(c) => field.onChange(c ? "true" : "false")}
                  disabled={!directiveEditable}
                />
              )}
            />
          </div>
        </div>

        {showMethod && (
          <FormField label="طريقة التوجيه" name="directive_method" required={required} errors={errors} colSpan={4}>
            <Controller name="directive_method" control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!methodEditable}>
                  <SelectTrigger className={inputClass(!!errors.directive_method)}><SelectValue placeholder="اختر الطريقة" /></SelectTrigger>
                  <SelectContent>{DIRECTIVE_METHOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}

        {showFile && <MeetingMinutesFileField required={required} />}

        {showText && (
          <FormField label="التوجيه" name="directive_text" required={required} errors={errors} colSpan={4}>
            <Input placeholder="أدخل نص التوجيه" disabled={!textEditable} className={inputClass(!!errors.directive_text)} {...register("directive_text")} />
          </FormField>
        )}
      </div>
    </div>
  );
}

function MeetingMinutesFileField({ required = true }: { required?: boolean }) {
  const { control, formState: { errors } } = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const editable = useIsFieldEditable("previous_meeting_minutes_file_content");

  const onFileDrop = useCallback((e: React.DragEvent, setFile: (f: File | null) => void) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  return (
    <FormField label="محضر الاجتماع" name="previous_meeting_minutes_file_content" required={required} errors={errors} colSpan={4}>
      <Controller name="previous_meeting_minutes_file_content" control={control}
        render={({ field }) => {
          const val = field.value;
          const selectedFile: File | null = (val && typeof val === "object" && "name" in (val as object)) ? val as unknown as File : null;
          const hasErr = !!errors.previous_meeting_minutes_file_content;
          const setFile = (f: File | null) => field.onChange(f);

          if (!editable) {
            return (
              <div className="px-4 py-3 rounded-xl border border-input bg-muted/50 text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "لا يمكن التعديل"}
              </div>
            );
          }

          return (
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => onFileDrop(e, setFile)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200 hover:bg-accent/40 hover:border-primary/40",
                    dragging && "bg-primary/5 border-primary scale-[1.01]",
                    hasErr ? "border-destructive/50 bg-destructive/5" : "border-muted-foreground/25"
                  )}
                >
                  <div className={cn("rounded-full p-3 transition-colors", dragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">اسحب الملف هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-input bg-accent/30 px-4 py-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0"><FileText className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />
    </FormField>
  );
}
