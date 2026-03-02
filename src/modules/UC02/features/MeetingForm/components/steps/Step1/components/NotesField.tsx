import { FormTextArea } from '@/modules/shared';

export interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function NotesField({
  value,
  onChange,
  disabled = false,
  className,
}: NotesFieldProps) {
  return (
    <div className={className}>
      <FormTextArea
        label="ملاحظات"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ملاحظات...."
        disabled={disabled}
      />
    </div>
  );
}
