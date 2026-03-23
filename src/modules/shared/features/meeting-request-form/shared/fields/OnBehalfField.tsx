import { useFormContext, Controller } from "react-hook-form";
import { Switch, Label } from "@/lib/ui";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props { disabled?: boolean }

export function OnBehalfField({ disabled }: Props) {
  const { control } = useFormContext();
  const editable = useIsFieldEditable("is_on_behalf_of");
  const isDisabled = disabled || !editable;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">هل تطلب الاجتماع نيابة عن غيرك؟</Label>
      <div className="pt-1.5">
        <Controller name="is_on_behalf_of" control={control}
          render={({ field }) => (
            <Switch
              checked={field.value === "true"}
              onCheckedChange={(c) => field.onChange(c ? "true" : "false")}
              disabled={isDisabled}
            />
          )}
        />
      </div>
    </div>
  );
}