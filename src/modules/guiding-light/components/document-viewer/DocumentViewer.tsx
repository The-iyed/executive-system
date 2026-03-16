import { memo, useMemo, useState, useEffect, useRef } from "react";
import { X, ExternalLink, Download } from "lucide-react";
import { cn } from "@gl/lib/utils";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";
import { getFileViewerUrl, getFileType, isViewableInIframe } from "@gl/api/pdf-viewer";


const LOADING_TIMEOUT_MS = 8000;

function AounLogoLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <img
        src={aounLogo}
        alt="عون"
        className="h-20 w-auto"
        style={{
          animation: "heartbeat 2.8s ease-in-out infinite",
        }}
      />
      <span className="text-sm text-muted-foreground animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        جاري التحميل...
      </span>
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          20% { transform: scale(1.12); opacity: 1; }
          40% { transform: scale(0.98); opacity: 0.65; }
          60% { transform: scale(1.06); opacity: 0.9; }
          80% { transform: scale(1); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export const DocumentViewer = memo(function DocumentViewer() {
  const { isOpen, fileId, fileName, fileUrl, closeViewer } = useDocumentViewer();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileType = useMemo(() => getFileType(fileName), [fileName]);
  const isBlobUrl = Boolean(fileUrl?.startsWith("blob:"));
  const useIframe = !isBlobUrl || isViewableInIframe(fileName);

  const viewerUrl = useMemo(() => {
    if (fileUrl) return fileUrl;
    if (!fileId) return null;
    return getFileViewerUrl(fileId, false, fileType);
  }, [fileId, fileUrl, fileType]);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!viewerUrl) return;
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      timeoutRef.current = null;
    }, LOADING_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [viewerUrl]);

  const handleIframeLoad = () => {
    setLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      closeViewer();
      setLoading(true);
    }, 300);
  };

  if (!isOpen || (!fileId && !fileUrl) || !viewerUrl) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full flex flex-col bg-card shadow-2xl transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="إغلاق"
            >
              <X className="size-5" />
            </button>
            <h2 className="text-base font-semibold truncate" dir="rtl">
              {fileName || "المستند"}
            </h2>
          </div>
          {/* Aoun logo */}
          <img src={aounLogo} alt="عون" className="h-6 w-auto shrink-0 opacity-70" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative bg-muted/20 flex flex-col">
          {useIframe ? (
            <>
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                  <AounLogoLoader />
                </div>
              )}
              <iframe
                key={fileId ?? fileUrl}
                src={viewerUrl}
                className="w-full flex-1 min-h-0 border-0 bg-background"
                title={fileName || "Document"}
                onLoad={handleIframeLoad}
                style={{ display: loading ? "none" : "block" }}
              />
            </>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                معاينة غير متاحة لهذا النوع من الملفات في المتصفح. يمكنك تحميل الملف.
              </p>
              <a
                href={viewerUrl}
                download={fileName || undefined}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-4" />
                تحميل الملف
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-center gap-4 py-3 border-t border-border bg-muted/30">
          <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            فتح في نافذة جديدة
          </a>
        </div>
      </div>
    </>
  );
});
