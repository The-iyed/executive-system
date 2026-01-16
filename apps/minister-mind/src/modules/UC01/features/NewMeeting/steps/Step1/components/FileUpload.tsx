import React, { useState, useRef, useCallback } from 'react';
import UploadIcon from '@shared/assets/upload.svg?react';
import { cn } from '@sanad-ai/ui';

export interface FileUploadProps {
  file: File | null | undefined;
  error?: string;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ file, error, onFileSelect, required = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'حجم الملف يتجاوز 20 ميجابايت';
    }
    const isValidType = ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
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
    onFileSelect(selectedFile);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
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
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  return (
    <div className="w-full flex justify-center">
      <div className="w-[1085px] flex flex-col gap-4">
        <label
          className="text-right"
          style={{
            fontWeight: 500,
            fontSize: '14px',
            color: '#344054',
          }}
        >
          العرض التقديمي
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
              : file
              ? 'border-[#009883] bg-[#009883]/5'
              : 'border-[#D0D5DD] bg-white hover:border-[#009883] hover:bg-[#009883]/5'
          )}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Upload Icon */}
          <div className="flex justify-center mb-4">
            <UploadIcon className="w-[60px] h-[60px] text-[#667085]" />
          </div>

          {/* Instructions */}
          <p className="text-[16px] text-[#344054] mb-2">
            <span className="text-[#009883] font-medium">اضغط للرفع</span> او اسحب الملف هنا
          </p>

          {/* File Types */}
          <p className="text-[14px] text-[#667085]">
            PDF, WORD, EXCEL (max. 20mo)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-[14px] text-red-500 mt-4">{error}</p>
        )}

        {/* File Info */}
        {file && (
          <div
            className="p-4 rounded-xl"
            style={{
              background: '#FFFFFF',
              border: '1px solid #009883',
              borderRadius: '12px',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getFileTypeIcon(file.name)}
                <div className="text-right">
                  <p className="text-[14px] font-medium text-[#344054]">{file.name}</p>
                  <p className="text-[12px] text-[#667085]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
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
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[6px] rounded-full bg-[#E4E7EC] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    background: '#009883',
                  }}
                />
              </div>
              <span className="text-[14px] text-[#344054] font-medium min-w-[40px]">{uploadProgress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
