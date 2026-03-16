/**
 * Build document viewer URL for preview by file id (same pattern as super-agent-v1).
 * Backend: {VITE_BASE_URL}/pdf-viewer/view/{fileId}
 */

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "https://aoun-api.momrahai.com/api/v1/";

export type FileType = "pdf" | "docx" | "pptx" | "doc" | "ppt" | "xlsx" | "xls";

export function getFileType(fileName: string | null): FileType {
  if (!fileName) return "pdf";
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".pptx")) return "pptx";
  if (lower.endsWith(".ppt")) return "ppt";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  return "pdf";
}

/** True if the browser can usually display this file type inline in an iframe (PDF, images). */
export function isViewableInIframe(fileName: string | null): boolean {
  if (!fileName) return true;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return true;
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return true;
  if (lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp")) return true;
  return false;
}

/**
 * Get file viewer URL for preview (inline) or download.
 * @param fileId - File identifier (e.g. numeric id from API)
 * @param download - If true, force download; otherwise display inline
 * @param fileType - File type for optional backend handling
 */
export function getFileViewerUrl(
  fileId: string,
  download = false,
  _fileType: FileType = "pdf"
): string {
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const encoded = encodeURIComponent(fileId);
  const url = new URL(`${base}/pdf-viewer/view/${encoded}`);
  if (download) url.searchParams.set("download", "true");
  return url.toString();
}
