import { useFormContext, Controller } from "react-hook-form";
import { Calendar, Popover, PopoverContent, PopoverTrigger, Button, cn } from "@/lib/ui";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { FormField } from "./FieldGroup";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function DeadlineField({ disabled }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("deadline");
  const isDisabled = disabled || !editable;
  return (
    <FormField label="تاريخ الاستحقاق" name="deadline" required={required} errors={errors} colSpan={4}>
      <Controller name="deadline" control={control}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" type="button" disabled={isDisabled}
                className={cn(
                  "w-full justify-between font-normal h-10",
                  "bg-muted border-input hover:bg-muted",
                  !field.value && "text-muted-foreground",
                  !!errors.deadline && "border-destructive"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {field.value ? format(new Date(field.value), "PPP", { locale: ar }) : "اختر تاريخ الاستحقاق"}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" dir="rtl" sideOffset={8}>
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                locale={ar}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}
      />
    </FormField>
  );
}
