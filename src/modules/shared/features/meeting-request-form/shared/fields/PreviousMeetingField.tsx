import { useFormContext, Controller } from "react-hook-form";
import { FormField } from "./FieldGroup";
import { MeetingSelect } from "./MeetingSelect";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";
import type { MeetingOption } from "../hooks/useMeetingSearch";

interface Props {
  disabled?: boolean;
  /** Fallback display label for edit mode */
  initialLabel?: string;
}

export function PreviousMeetingField({ disabled, initialLabel }: Props) {
  const { control, setValue, watch, formState: { errors } } = useFormContext();
  const editable = useIsFieldEditable("previous_meeting_id");
  const isDisabled = disabled || !editable;

  // Use prev_ext_meeting_title from form as fallback label for edit mode
  const prevExtMeetingTitle = watch("prev_ext_meeting_title");
  const displayLabel = initialLabel || prevExtMeetingTitle || undefined;

  const handleSelectMeeting = (option: MeetingOption | null) => {
    if (option) {
      setValue("group_id", option.group_id ?? null);
      setValue("prev_ext_original_title", option.original_title ?? null);
      setValue("prev_ext_meeting_title", option.meeting_title ?? null);
    } else {
      setValue("group_id", null);
      setValue("prev_ext_original_title", null);
      setValue("prev_ext_meeting_title", null);
    }
  };

  return (
    <FormField label="الاجتماع السابق" name="previous_meeting_id" required errors={errors} colSpan={4}>
      <Controller
        name="previous_meeting_id"
        control={control}
        render={({ field }) => (
          <MeetingSelect
            value={field.value ?? ""}
            onChange={field.onChange}
            onSelectMeeting={handleSelectMeeting}
            placeholder="ابحث عن اجتماع سابق..."
            hasError={!!errors.previous_meeting_id}
            disabled={isDisabled}
            initialLabel={initialLabel}
          />
        )}
      />
    </FormField>
  );
}
