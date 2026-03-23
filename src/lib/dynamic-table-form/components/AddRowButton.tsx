import React from "react";
import { Button } from "@/lib/ui";
import { PlusCircle } from "lucide-react";

interface AddRowButtonProps {
  onAdd: () => void;
  label?: string;
  canAdd?: boolean;
}

export const AddRowButton: React.FC<AddRowButtonProps> = ({
  onAdd,
  label = "إضافة جديد",
  canAdd = true,
}) => {
  if (!canAdd) return null;

  return (
    <Button
      variant="outline"
      onClick={onAdd}
      className="gap-2.5 h-10 px-5 rounded-xl border-dashed border-2 border-primary/25 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all font-medium"
    >
      <PlusCircle className="h-4 w-4" />
      {label}
    </Button>
  );
};
