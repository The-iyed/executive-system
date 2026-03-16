import { FileText } from "lucide-react";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";
import { isViewableInIframe } from "@gl/api/pdf-viewer";

interface UserMessageBubbleProps {
  text: string;
  files?: File[];
}

function UserMessageBubble({ text, files }: UserMessageBubbleProps) {
  const { openViewerWithFile } = useDocumentViewer();
  const hasFiles = files && files.length > 0;
  return (
    <div className="flex justify-start aoun-float-up" dir="rtl">
      <div className="max-w-[75%] flex flex-col gap-1.5 rounded-2xl rounded-tr-md aoun-user-msg px-3.5 py-2.5 shadow-sm shadow-primary/10">
        {text && <span className="leading-[1.8] text-[13px]">{text}</span>}
        {hasFiles && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {files!.map((f, i) => (
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/80">
                <FileText className="size-3 shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    if (isViewableInIframe(f.name)) openViewerWithFile(f);
                    else { const u = URL.createObjectURL(f); window.open(u, "_blank"); setTimeout(() => URL.revokeObjectURL(u), 5000); }
                  }}
                  className="truncate max-w-[140px] text-right hover:underline"
                >{f.name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { UserMessageBubble };
