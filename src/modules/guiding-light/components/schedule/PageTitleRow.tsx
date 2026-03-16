import { Download, FileText } from "lucide-react";
import { Button } from "@gl/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gl/components/ui/select";
import type { ViewMode } from "@gl/stores/schedule-store";

interface PageTitleRowProps {
  title: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportPdf: () => void;
}

function PageTitleRow({
  title,
  viewMode,
  onViewModeChange,
  onExportPdf,
}: PageTitleRowProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <h1 data-tour="schedule-title" className="text-lg font-bold text-foreground md:text-xl">{title}</h1>

      <div className="flex-1" />

      <Select
        value={viewMode}
        onValueChange={(val) => onViewModeChange(val as ViewMode)}
      >
        <SelectTrigger size="sm" className="rounded-xl border-border/50 bg-background text-sm min-w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">اليومي</SelectItem>
          <SelectItem value="weekly">الأسبوعي</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onExportPdf}
        className="gap-2 rounded-xl border-border/50 bg-background hover:bg-muted/60"
      >
        <Download className="size-4 text-muted-foreground" />
        <span className="hidden sm:inline text-sm">تصدير ملف</span>
        <span className="flex items-center gap-1 rounded-lg bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
          <FileText className="size-3" />
          PDF
        </span>
      </Button>
    </div>
  );
}

export { PageTitleRow };
