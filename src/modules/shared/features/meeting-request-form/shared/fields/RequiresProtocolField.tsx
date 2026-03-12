import { useFormContext, Controller } from "react-hook-form";
import { Switch, Label } from "@/lib/ui";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function RequiresProtocolField({ disabled }: Props) {
  const { control } = useFormContext();
  const editable = useIsFieldEditable("requires_protocol");
  const isDisabled = disabled || !editable;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">هل يتطلب بروتوكول؟</Label>
      <div className="pt-1.5">
        <Controller name="requires_protocol" control={control}
          render={({ field }) => (
            <Switch checked={field.value === "true"} onCheckedChange={(c) => field.onChange(c ? "true" : "false")} disabled={isDisabled} />
          )}
        />
      </div>
    </div>
  );
}