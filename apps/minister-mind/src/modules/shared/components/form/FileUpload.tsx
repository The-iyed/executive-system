import React, { useState, useRef, useCallback } from 'react';
import UploadIcon from '@shared/assets/upload.svg?react';
import { cn } from '@sanad-ai/ui';

export interface ExistingFile {
  id: string;
  file_name: string;
  blob_url: string;
  file_size?: number;
  file_type?: string;
}

export interface FileUploadProps {
  file?: File | null | undefined; // For single file mode
  files?: File[]; // For multiple files mode
  error?: string;
  onFileSelect?: (file: File | null) => void; // For single file mode
  onFilesSelect?: (files: File[]) => void; // For multiple files mode
  required?: boolean;
  existingFiles?: ExistingFile[]; // For edit mode - existing uploaded files
  label?: string;
  maxFileSize?: number; // in bytes, default 20MB
  acceptedTypes?: string[];
  acceptedExtensions?: string[];
  className?: string;
  containerClassName?: string;
  /** Optional class for the dropzone area (e.g. to reduce height: py-6 max-h-[160px]) */
  dropzoneClassName?: string;
  showProgress?: boolean;
  multiple?: boolean; // Enable multiple file upload
}

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const DEFAULT_ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

export const FileUpload: React.FC<FileUploadProps> = ({ 
  file, 
  files,
  error, 
  onFileSelect,
  onFilesSelect,
  required = false, 
  existingFiles = [],
  label = 'العرض التقديمي',
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
  className,
  containerClassName,
  dropzoneClassName,
  showProgress = true,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we're in multiple mode
  const isMultiple = multiple || !!onFilesSelect;
  const currentFiles = isMultiple ? (files || []) : (file ? [file] : []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return `حجم الملف يتجاوز ${maxSizeMB} ميجابايت`;
    }
    const isValidType = acceptedTypes.includes(file.type) ||
      acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValidType) {
      return 'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو WORD أو EXCEL';
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      return;
    }
    
    if (isMultiple && onFilesSelect) {
      // Multiple file mode
      const newFiles = [...(files || []), selectedFile];
      onFilesSelect(newFiles);
      if (showProgress) {
        // Use name + size + lastModified for unique ID
        const fileId = `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileId] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return { ...prev, [fileId]: 100 };
            }
            return { ...prev, [fileId]: current + 10 };
          });
        }, 200);
      }
    } else if (!isMultiple && onFileSelect) {
      // Single file mode
      onFileSelect(selectedFile);
      if (showProgress) {
        // Use name + size + lastModified for unique ID
        const fileId = `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`;
        setUploadProgress({ [fileId]: 0 });
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileId] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return { ...prev, [fileId]: 100 };
            }
            return { ...prev, [fileId]: current + 10 };
          });
        }, 200);
      }
    }
  }, [isMultiple, onFileSelect, onFilesSelect, files, maxFileSize, acceptedTypes, acceptedExtensions, showProgress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      if (isMultiple) {
        // Handle multiple files
        selectedFiles.forEach((selectedFile) => {
          handleFileSelect(selectedFile);
        });
      } else {
        // Handle single file
        handleFileSelect(selectedFiles[0]);
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      if (isMultiple) {
        // Handle multiple files
        droppedFiles.forEach((droppedFile) => {
          handleFileSelect(droppedFile);
        });
      } else {
        // Handle single file (take first)
        handleFileSelect(droppedFiles[0]);
      }
    }
  }, [handleFileSelect, isMultiple]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileToRemove: File) => {
    if (isMultiple && onFilesSelect) {
      const newFiles = (files || []).filter(f => f !== fileToRemove);
      onFilesSelect(newFiles);
      // Remove progress for this file using name + size + lastModified
      const fileId = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    } else if (!isMultiple && onFileSelect) {
      onFileSelect(null);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (extension === 'pdf') {
      return (
        <div className="w-10 h-10 rounded bg-[#DC2626] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">PDF</span>
        </div>
      );
    } else if (['doc', 'docx'].includes(extension || '')) {
      return (
        <div className="w-10 h-10 rounded bg-[#2B579A] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">WORD</span>
        </div>
      );
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return (
        <div className="w-10 h-10 rounded bg-[#217346] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">EXCEL</span>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded bg-[#667085] flex items-center justify-center">
        <span className="text-white text-[10px] font-bold">FILE</span>
      </div>
    );
  };

  const acceptString = [
    ...acceptedExtensions,
    ...acceptedTypes
  ].join(',');

  const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);

  return (
    <div className={cn("w-full flex justify-center", containerClassName)}>
      <div className={cn("w-full max-w-[1200px] flex flex-col gap-4", className)}>
        <label className="text-right text-[14px] font-medium text-[#344054]">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
            isDragging
              ? 'border-[#009883] bg-[#009883]/5'
              : currentFiles.length > 0
              ? 'border-[#009883] bg-[#009883]/5'
              : 'border-[#D0D5DD] bg-white hover:border-[#009883] hover:bg-[#009883]/5',
            error && currentFiles.length === 0 && "border-[#D13C3C]",
            dropzoneClassName
          )}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptString}
            onChange={handleInputChange}
            multiple={isMultiple}
            className="hidden"
          />

          {/* Upload Icon */}
          <div className="flex justify-center mb-4">
            <UploadIcon className="w-10 h-10 sm:w-[60px] sm:h-[60px] text-[#667085]" />
          </div>

          {/* Instructions */}
          <p className="text-[16px] text-[#344054] mb-2 leading-relaxed">
            <span className="text-[#009883] font-medium">اضغط للرفع</span> او اسحب {isMultiple ? 'الملفات' : 'الملف'} هنا
          </p>

          {/* File Types */}
          <p className="text-[14px] text-[#667085]">
            PDF, WORD, EXCEL (max. {maxSizeMB}mo)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-[14px] text-red-500 -mt-[10px]">{error}</p>
        )}

        {/* Existing Files (Edit Mode) */}
        {existingFiles && existingFiles.length > 0 && (
          <div className="flex flex-col gap-3">
            {existingFiles.map((existingFile) => (
              <div
                key={existingFile.id}
                className="p-4 rounded-xl bg-[#FFFFFF] border border-[#009883] border-radius-[12px]"
              >
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    {getFileTypeIcon(existingFile.file_name)}
                    <div className="text-right">
                      <a
                        href={existingFile.blob_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-medium text-[#009883] hover:text-[#007a6e] break-all underline"
                      >
                        {existingFile.file_name}
                      </a>
                      {existingFile.file_size && (
                        <p className="text-[12px] text-[#667085]">{formatFileSize(existingFile.file_size)}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[12px] text-[#667085] bg-[#F2F4F7] px-2 py-1 rounded">
                    ملف موجود
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Info (New Files) */}
        {currentFiles.length > 0 && (
          <div className="flex flex-col gap-3">
            {currentFiles.map((currentFile) => {
              // Use name + size + lastModified for consistent ID matching
              const fileId = `${currentFile.name}-${currentFile.size}-${currentFile.lastModified}`;
              const progress = uploadProgress[fileId] || 0;
              return (
                <div
                  key={fileId}
                  className="p-4 rounded-xl bg-[#FFFFFF] border border-[#009883] border-radius-[12px]"
                >
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      {getFileTypeIcon(currentFile.name)}
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-[#344054] break-all">
                          {currentFile.name}
                        </p>
                        <p className="text-[12px] text-[#667085]">{formatFileSize(currentFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(currentFile);
                      }}
                      className="text-[#667085] hover:text-[#344054] transition-colors"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 5L5 15M5 5L15 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* Progress Bar */}
                  {showProgress && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-[6px] rounded-full bg-[#E4E7EC] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-[#009883]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[14px] text-[#344054] font-medium min-w-[40px]">{progress}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

FileUpload.displayName = 'FileUpload';
