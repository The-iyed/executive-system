import { X, FileText } from "lucide-react";
import { useChatStore } from "@gl/stores/chat-store";

function DocAnalyzerBar() {
  const activeDocument = useChatStore((s) => s.activeDocument);
  const clearActiveDocument = useChatStore((s) => s.clearActiveDocument);

  if (!activeDocument) return null;

  return (
    <div className="mx-auto max-w-2xl mb-2 aoun-float-up">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-2.5 text-sm">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
          <FileText className="size-4" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs text-muted-foreground">محلل المستندات نشط</span>
          <span className="text-foreground font-medium truncate">{activeDocument.fileName}</span>
        </div>
        <button
          onClick={clearActiveDocument}
          className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
          title="إغلاق محلل المستندات"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export { DocAnalyzerBar };
