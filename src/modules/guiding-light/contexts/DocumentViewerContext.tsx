import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface DocumentViewerContextType {
  isOpen: boolean;
  fileId: string | null;
  fileName: string | null;
  fileUrl: string | null;
  openViewer: (fileId: string, fileName: string) => void;
  openViewerWithUrl: (url: string, fileName: string) => void;
  /** Open a browser File (e.g. attached file) in the modal; revokes object URL on close. */
  openViewerWithFile: (file: File) => void;
  closeViewer: () => void;
}

const DocumentViewerContext = createContext<DocumentViewerContextType | undefined>(undefined);

export function useDocumentViewer(): DocumentViewerContextType {
  const ctx = useContext(DocumentViewerContext);
  if (!ctx) {
    throw new Error("useDocumentViewer must be used within DocumentViewerProvider");
  }
  return ctx;
}

interface DocumentViewerProviderProps {
  children: ReactNode;
}

export function DocumentViewerProvider({ children }: DocumentViewerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const openViewer = useCallback((id: string, name: string) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFileId(id);
    setFileName(name);
    setFileUrl(null);
    setIsOpen(true);
  }, []);

  const openViewerWithUrl = useCallback((url: string, name: string) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setFileUrl(url);
    setFileName(name);
    setFileId(null);
    setIsOpen(true);
  }, []);

  const openViewerWithFile = useCallback((file: File) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setFileUrl(url);
    setFileName(file.name);
    setFileId(null);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsOpen(false);
    setFileId(null);
    setFileName(null);
    setFileUrl(null);
  }, []);

  return (
    <DocumentViewerContext.Provider
      value={{
        isOpen,
        fileId,
        fileName,
        fileUrl,
        openViewer,
        openViewerWithUrl,
        openViewerWithFile,
        closeViewer,
      }}
    >
      {children}
    </DocumentViewerContext.Provider>
  );
}
