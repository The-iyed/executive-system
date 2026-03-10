import React, { useState, useRef, useCallback } from 'react';
import { Eye } from 'lucide-react';
import UploadIcon from '@/modules/shared/assets/upload.svg?react';
import { cn } from '@/lib/ui';

export interface ExistingFile {
  id: string;
  file_name: string;
  blob_url: string;
  file_size?: number;
  file_type?: string;
}

export interface FileUploadProps {
  file?: File | null | undefined;
  files?: File[];
  error?: string;
  onFileSelect?: (file: File | null) => void;
  onFilesSelect?: (files: File[]) => void;
  required?: boolean;
  existingFiles?: ExistingFile[];
  onExistingFileDelete?: (fileId: string) => void;
  /** When provided, shows a Replace button for each existing file. Called with (existingId, newFile) when user selects a file. */
  onExistingFileReplace?: (existingId: string, file: File) => void;
  /** When provided, for existing files with an id in this map, the card shows the replacement file instead of the original (with Replace/Clear). */
  replacementFiles?: Record<string, File>;
  onClearReplacement?: (existingId: string) => void;
  /** When provided, shows an Eye button on existing files to open in preview drawer. */
  onViewExistingFile?: (file: ExistingFile) => void;
  label?: string;
  maxFileSize?: number;
  acceptedTypes?: string[];
  acceptedExtensions?: string[];
  className?: string;
  containerClassName?: string;
  dropzoneClassName?: string;
  showProgress?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024; 
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
  onExistingFileDelete,
  onExistingFileReplace,
  replacementFiles = {},
  onClearReplacement,
  onViewExistingFile,
  label = 'العرض التقديمي',
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
  className,
  containerClassName,
  dropzoneClassName,
  showProgress = true,
  multiple = false,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [pendingReplaceId, setPendingReplaceId] = useState<string | null>(null);
  
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
    if (disabled) return;
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
  }, [disabled, isMultiple, onFileSelect, onFilesSelect, files, maxFileSize, acceptedTypes, acceptedExtensions, showProgress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      if (isMultiple) {
        selectedFiles.forEach((selectedFile) => {
          handleFileSelect(selectedFile);
        });
      } else {
        handleFileSelect(selectedFiles[0]);
      }
    }
  };

  const handleReplaceClick = useCallback(
    (existingId: string) => {
      if (disabled || !onExistingFileReplace) return;
      setPendingReplaceId(existingId);
      replaceInputRef.current?.click();
    },
    [disabled, onExistingFileReplace]
  );

  const handleReplaceInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const selectedFiles = Array.from(e.target.files || []);
      const id = pendingReplaceId;
      setPendingReplaceId(null);
      e.target.value = '';
      if (id && selectedFiles.length > 0 && onExistingFileReplace) {
        const file = selectedFiles[0];
        if (file.size > maxFileSize) return;
        const isValidType =
          acceptedTypes.includes(file.type) ||
          acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
        if (!isValidType) return;
        onExistingFileReplace(id, file);
      }
    },
    [disabled, pendingReplaceId, onExistingFileReplace, maxFileSize, acceptedTypes, acceptedExtensions]
  );

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
    if (disabled) return;
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
  }, [disabled, handleFileSelect, isMultiple]);

  const handleBrowseClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileToRemove: File) => {
    if (disabled) return;
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
    <div className={cn("w-full flex justify-center", disabled && "pointer-events-none select-none", containerClassName)}>
      <div className={cn("w-full max-w-[1200px] flex flex-col gap-4", className)}>
        <label className="text-right text-[14px] font-medium text-[#344054]">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>

        {/* Upload Area */}
        <div
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-12 text-center transition-colors',
            disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
            !disabled && (isDragging
              ? 'border-[#009883] bg-[#009883]/5'
              : currentFiles.length > 0
              ? 'border-[#009883] bg-[#009883]/5'
              : 'border-[#D0D5DD] bg-white hover:border-[#009883] hover:bg-[#009883]/5'),
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
            disabled={disabled}
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

        {/* Hidden input for Replace flow (opens file picker) */}
        {onExistingFileReplace && (
          <input
            ref={replaceInputRef}
            type="file"
            accept={acceptString}
            onChange={handleReplaceInputChange}
            className="hidden"
            aria-hidden
          />
        )}

        {/* Existing Files (Edit Mode) */}
        {existingFiles && existingFiles.length > 0 && (
          <div className="flex flex-col gap-3">
            {existingFiles.map((existingFile) => {
              const replacementFile = replacementFiles?.[existingFile.id];
              const displayFileName = replacementFile?.name ?? existingFile.file_name;
              const displayFileSize = replacementFile?.size ?? existingFile.file_size;
              const isReplaced = !!replacementFile;

              return (
                <div
                  key={existingFile.id}
                  className="p-4 rounded-xl bg-[#FFFFFF] border border-[#009883] border-radius-[12px]"
                >
                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      {getFileTypeIcon(displayFileName)}
                      <div className="text-right">
                        {isReplaced ? (
                          <>
                            <p className="text-[14px] font-medium text-[#344054] break-all">
                              {displayFileName}
                            </p>
                            {displayFileSize != null && (
                              <p className="text-[12px] text-[#667085]">
                                {formatFileSize(displayFileSize)}
                              </p>
                            )}
                            <span className="text-[11px] text-[#009883] bg-[#009883]/10 px-2 py-0.5 rounded">
                              سيتم استبدال الملف الأصلي
                            </span>
                          </>
                        ) : (
                          <>
                            <a
                              href={existingFile.blob_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[14px] font-medium text-[#009883] hover:text-[#007a6e] break-all underline"
                            >
                              {displayFileName}
                            </a>
                            {displayFileSize != null && (
                              <p className="text-[12px] text-[#667085]">
                                {formatFileSize(displayFileSize)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isReplaced && (
                        <span className="text-[12px] text-[#667085] bg-[#F2F4F7] px-2 py-1 rounded">
                          ملف موجود
                        </span>
                      )}
                      {!isReplaced && onViewExistingFile && existingFile.blob_url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewExistingFile(existingFile);
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          aria-label="معاينة"
                          title="معاينة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onExistingFileReplace && !disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceClick(existingFile.id);
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#009883] hover:bg-[#009883]/10 transition-colors"
                          aria-label={isReplaced ? 'استبدال الملف' : 'استبدال المرفق'}
                          title={isReplaced ? 'استبدال الملف' : 'استبدال المرفق'}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </button>
                      )}
                      {isReplaced && onClearReplacement && !disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (disabled) return;
                            onClearReplacement(existingFile.id);
                          }}
                          className="text-[12px] text-[#667085] hover:text-[#344054] border border-[#D0D5DD] px-2 py-1 rounded"
                        >
                          إلغاء الاستبدال
                        </button>
                      )}
                      {onExistingFileDelete && !disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (disabled) return;
                            onExistingFileDelete(existingFile.id);
                          }}
                          className="text-[#667085] hover:text-[#344054] transition-colors"
                          aria-label="حذف المرفق"
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                    {!disabled && (
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
                    )}
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
