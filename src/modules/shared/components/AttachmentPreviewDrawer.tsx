/**
 * Drawer that shows a PDF preview (iframe) or download fallback for other file types.
 * Use with Eye button: set attachment state on click, drawer opens with preview.
 * Cross-origin document URLs (e.g. execution-system) are loaded directly in the iframe
 * to avoid CORS; same-origin URLs may be fetched as blob to avoid Content-Disposition.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { Drawer } from './drawer';

export interface AttachmentPreviewItem {
  blob_url: string;
  file_name: string;
  file_type?: string;
}

export interface AttachmentPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: AttachmentPreviewItem | null;
  /** Optional: drawer width (default 700px max) */
  width?: number | string;
}

export function AttachmentPreviewDrawer({
  open,
  onOpenChange,
  attachment,
  width = '70vw',
}: AttachmentPreviewDrawerProps) {
  const isPdf = attachment?.file_type?.toLowerCase() === 'pdf';
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Fetch PDF as blob and create object URL so it displays inline instead of downloading
  useEffect(() => {
    if (!open || !attachment || !isPdf) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
      setPdfError(null);
      setPdfLoading(false);
      return;
    }

    const url = attachment.blob_url;
    if (url.startsWith('blob:')) {
      setPdfBlobUrl(url);
      setPdfError(null);
      setPdfLoading(false);
      return;
    }

    // Cross-origin: use URL directly in iframe so the browser loads it (no CORS from fetch).
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const isSameOrigin = origin && (url.startsWith(origin) || url.startsWith('/'));
      if (!isSameOrigin) {
        setPdfBlobUrl(url);
        setPdfError(null);
        setPdfLoading(false);
        return;
      }
    } catch {
      setPdfBlobUrl(url);
      setPdfError(null);
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);
    setPdfError(null);
    let cancelled = false;

    fetch(url, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setPdfBlobUrl(objectUrl);
        setPdfLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfError(err?.message ?? 'فشل تحميل المعاينة');
          setPdfBlobUrl(null);
          setPdfLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
    };
  }, [open, attachment?.blob_url, isPdf]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={attachment?.file_name ?? ''}
      side="right"
      width={width}
      showDecoration
      bodyClassName="!p-0 flex flex-col flex-1 min-h-0"
    >
      {attachment && (
        <div className="flex flex-col flex-1 min-h-[60vh] w-full" dir="ltr">
          {isPdf ? (
            <>
              {pdfLoading && (
                <div className="flex flex-1 items-center justify-center py-12 text-[#667085]" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                  جاري تحميل المعاينة...
                </div>
              )}
              {pdfError && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 px-4">
                  <p className="text-[#475467] text-center" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>{pdfError}</p>
                  <a
                    href={attachment.blob_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009883] text-white hover:bg-[#008774] transition-colors"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                  >
                    <Download className="w-4 h-4" />
                    تحميل الملف
                  </a>
                </div>
              )}
              {!pdfLoading && !pdfError && pdfBlobUrl && (
                <iframe
                  title={attachment.file_name}
                  src={pdfBlobUrl}
                  className="w-full flex-1 min-h-0 border-0 rounded-b-[16px] bg-[#f9fafb]"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col flex-1 items-center justify-center gap-4 py-12 px-4">
              <p className="text-[#475467] text-center" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                معاينة غير متاحة لهذا النوع من الملفات. يمكنك تحميله من الرابط أدناه.
              </p>
              <a
                href={attachment.blob_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#009883] text-white hover:bg-[#008774] transition-colors"
                style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                <Download className="w-4 h-4" />
                تحميل الملف
              </a>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
