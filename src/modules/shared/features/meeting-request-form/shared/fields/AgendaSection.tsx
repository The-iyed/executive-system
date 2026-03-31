import { useState, useRef, useCallback, useEffect } from "react";

import { type UseFormReturn, useFieldArray, Controller } from "react-hook-form";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, cn } from "@/lib/ui";
import { Plus, Trash2 } from "lucide-react";
import { inputClass } from "./FieldGroup";
import { MINISTER_SUPPORT_TYPE_OPTIONS, MINISTER_SUPPORT_OTHER_VALUE, MeetingClassification } from "../types/enums";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";
import { ConfirmDialog } from "@/modules/shared/components/confirm-dialog";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  agendaRequired?: boolean;
}

export function AgendaSection({ form, agendaRequired = true }: Props) {
  const { register, control, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "agenda_items" });
  const listRef = useRef<HTMLDivElement>(null);
  const agendaEditable = useIsFieldEditable("agenda_items");

  const [animatingNewId, setAnimatingNewId] = useState<string | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [confirmingDeleteIndex, setConfirmingDeleteIndex] = useState<number | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const agendaErrors = errors.agenda_items;
  const rootError = typeof agendaErrors?.message === "string" ? agendaErrors.message : undefined;

  const watchedItems = form.watch("agenda_items");
  const meetingStart = form.watch("meeting_start_date");
  const meetingEnd = form.watch("meeting_end_date");
  const meetingClassification = form.watch("meeting_classification");

  const isPrivateMeeting = meetingClassification === MeetingClassification.PRIVATE_MEETING;
  const showRequired = agendaRequired && !isPrivateMeeting;

  const totalDuration = watchedItems?.reduce((sum: number, item: { presentation_duration_minutes?: number }) => sum + (Number(item?.presentation_duration_minutes) || 0), 0) ?? 0;

  const meetingDurationMinutes = (() => {
    if (!meetingStart || !meetingEnd) return 0;
    const start = new Date(meetingStart);
    const end = new Date(meetingEnd);
    const diff = Math.round((end.getTime() - start.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  })();

  const hasMeetingDuration = meetingDurationMinutes > 0;
  const durationMismatch = hasMeetingDuration && fields.length > 0 && totalDuration !== meetingDurationMinutes;

  const { clearErrors } = form;
  useEffect(() => {
    if (hasMeetingDuration && fields.length > 0 && totalDuration === meetingDurationMinutes) {
      clearErrors("agenda_items");
    }
  }, [totalDuration, meetingDurationMinutes, hasMeetingDuration, fields.length, clearErrors]);

  const handleAdd = useCallback(() => {
    append({ agenda_item: "", presentation_duration_minutes: 5, minister_support_type: "", minister_support_other: "" });
    setAnimatingNewId("pending");
    setTimeout(() => setAnimatingNewId(null), 500);
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, [append]);

  const handleRemove = useCallback((index: number) => {
    setConfirmingDeleteIndex(index);
  }, []);

  const confirmRemove = useCallback(() => {
    if (confirmingDeleteIndex === null) return;
    setConfirmingDeleteIndex(null);
    setRemovingIndex(confirmingDeleteIndex);
    clearTimeout(removeTimeoutRef.current);
    removeTimeoutRef.current = setTimeout(() => {
      remove(confirmingDeleteIndex);
      setRemovingIndex(null);
    }, 250);
  }, [confirmingDeleteIndex, remove]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          أجندة الاجتماع {showRequired && <span className="text-destructive">*</span>}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className={cn("border border-input rounded-lg overflow-hidden min-w-[700px]", !hasMeetingDuration && "opacity-50 pointer-events-none")}>
          <div className="grid grid-cols-12 bg-muted/50 border-b border-input">
            <div className="col-span-1 px-3 py-2.5 text-xs font-semibold text-foreground text-center">#</div>
            <div className="col-span-4 px-3 py-2.5 text-xs font-semibold text-foreground">الأجندة</div>
            <div className="col-span-3 px-3 py-2.5 text-xs font-semibold text-foreground">الدعم المطلوب من الوزير</div>
            <div className="col-span-3 px-3 py-2.5 text-xs font-semibold text-foreground">مدة العرض (بالدقائق)</div>
            <div className="col-span-1 px-3 py-2.5"></div>
          </div>

          <div ref={listRef} className="max-h-[320px] overflow-y-auto">
            {fields.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {!hasMeetingDuration
                  ? "يجب تحديد مدة الاجتماع (تاريخ ووقت البداية والنهاية) أولاً لإضافة عناصر الأجندة."
                  : "لا توجد بيانات"}
              </div>
            )}

            {fields.map((field, index) => {
              const itemErrors = (errors.agenda_items as Record<string, unknown>)?.[index] as Record<string, { message?: string }> | undefined;
              const supportValue = form.watch(`agenda_items.${index}.minister_support_type`);
              const isNew = animatingNewId === "pending" && index === fields.length - 1;
              const isRemoving = removingIndex === index;

              return (
                <div
                  key={field.id}
                  className={cn(
                    "grid grid-cols-12 items-start border-b border-input last:border-b-0 transition-all duration-250 ease-out",
                    isNew && "animate-[slideDown_0.45s_ease-out]",
                    isRemoving && "opacity-0 scale-y-0 origin-top max-h-0 overflow-hidden border-b-0"
                  )}
                  style={{
                    ...(isRemoving ? { transition: "opacity 0.25s, transform 0.25s, max-height 0.25s" } : {}),
                    ...(!isRemoving ? { maxHeight: 200 } : {}),
                  }}
                >
                  <div className="col-span-1 px-3 py-3 text-sm text-center text-muted-foreground font-medium">{index + 1}</div>
                  <div className="col-span-4 px-2 py-2 space-y-1">
                    <Input
                      placeholder="عنوان العنصر"
                      disabled={!agendaEditable}
                      className={cn(inputClass(!!itemErrors?.agenda_item), "h-9 text-sm")}
                      {...register(`agenda_items.${index}.agenda_item`)}
                    />
                    {itemErrors?.agenda_item?.message && <p className="text-[10px] text-destructive">{itemErrors.agenda_item.message}</p>}
                  </div>
                  <div className="col-span-3 px-2 py-2 space-y-1">
                    <Controller
                      name={`agenda_items.${index}.minister_support_type`}
                      control={control}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange} disabled={!agendaEditable}>
                          <SelectTrigger className={cn(inputClass(!!itemErrors?.minister_support_type), "h-9 text-sm")}>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                          <SelectContent>
                            {MINISTER_SUPPORT_TYPE_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {itemErrors?.minister_support_type?.message && <p className="text-[10px] text-destructive">{itemErrors.minister_support_type.message}</p>}
                    {supportValue === MINISTER_SUPPORT_OTHER_VALUE && (
                      <div className="mt-1">
                        <Input
                          placeholder="حدد نوع الدعم"
                          disabled={!agendaEditable}
                          className={cn(inputClass(!!itemErrors?.minister_support_other), "h-8 text-xs")}
                          {...register(`agenda_items.${index}.minister_support_other`)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 px-2 py-2 space-y-1">
                    <Input
                      type="number"
                      min={5}
                      placeholder="5"
                      disabled={!agendaEditable}
                      className={cn(inputClass(!!itemErrors?.presentation_duration_minutes), "h-9 text-sm")}
                      {...register(`agenda_items.${index}.presentation_duration_minutes`, { valueAsNumber: true })}
                    />
                    {itemErrors?.presentation_duration_minutes?.message && <p className="text-[10px] text-destructive">{itemErrors.presentation_duration_minutes.message}</p>}
                  </div>
                  <div className="col-span-1 px-2 py-2 flex justify-center">
                    {agendaEditable && (fields.length > 1 || !showRequired) && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(index)} className="text-destructive hover:text-destructive h-9 w-9 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {rootError && !durationMismatch && (
        <p role="alert" className="text-xs text-destructive">{rootError}</p>
      )}

      <div className="flex items-center justify-between">
        {agendaEditable && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg" disabled={!hasMeetingDuration} onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
            إضافة عنصر
          </Button>
        )}

        {fields.length > 0 && hasMeetingDuration && (
          <div className={cn(
            "flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors",
            durationMismatch
              ? "bg-destructive/5 border-destructive/20 text-destructive"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
          )}>
            <span>إجمالي المدة:</span>
            <span className="font-bold tabular-nums">{totalDuration}</span>
            <span>/</span>
            <span className="tabular-nums">{meetingDurationMinutes} دقيقة</span>
            {durationMismatch && (
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-[11px] font-semibold tabular-nums">
                {totalDuration > meetingDurationMinutes ? `+${totalDuration - meetingDurationMinutes}` : `-${meetingDurationMinutes - totalDuration}`} دقيقة
              </span>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDeleteIndex !== null}
        onOpenChange={(open) => { if (!open) setConfirmingDeleteIndex(null); }}
        title="حذف عنصر الأجندة"
        description="هل أنت متأكد من حذف هذا العنصر من الأجندة؟"
        confirmLabel="حذف"
        variant="danger"
        onConfirm={confirmRemove}
      />
    </div>
  );
}
