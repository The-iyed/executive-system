import { MeetingManagerField } from "./MeetingManagerField";
import { useIsFieldEditable } from "../hooks/EditableFieldsContext";

interface Props {
  name?: string;
  disabled?: boolean;
  initialLabel?: string;
}

export function MeetingOwnerField({ name = "meeting_owner_id", disabled, initialLabel }: Props) {
  const editable = useIsFieldEditable(name);
  const isDisabled = disabled || !editable;
  return (
    <MeetingManagerField
      name={name}
      label="مالك الاجتماع"
      placeholder="ابحث عن مالك الاجتماع..."
      disabled={isDisabled}
      initialLabel={initialLabel}
    />
  );
}
