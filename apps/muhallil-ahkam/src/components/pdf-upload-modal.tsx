import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@sanad-ai/ui';
// Will be used when ToggleSwitch code is uncommented (line 187) - remove underscore prefix when uncommenting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ToggleSwitch as _ToggleSwitch } from './toggle-switch';
import { UploadLoadingCard } from './upload-loading-card';
import type { CourtType } from './court-tabs';
import UploadIcon from '../assets/upload.svg';
import PdfIcon from '../assets/pdf.svg';
import HighlightOffIcon from '../assets/highlight_off.svg';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
};

interface PdfUploadModalProps {
  onClose?: () => void;
  onStartAnalysis?: (files: File[], courtType: CourtType, multipleFiles: boolean) => void;
  isLoading?: boolean;
  error?: { message: string };
}

export interface PdfUploadModalRef {
  resetFiles: () => void;
}

export const PdfUploadModal = forwardRef<PdfUploadModalRef, PdfUploadModalProps>(({
  onClose,
  onStartAnalysis,
  isLoading = false,
  error,
}, ref) => {
  // Will be used when multiple files feature is enabled (see line 189) - remove underscore prefix when uncommenting
  const [multipleFiles, _setMultipleFiles] = useState(false);
  const [courtType] = useState<CourtType>('primary');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose resetFiles function via ref
  useImperativeHandle(ref, () => ({
    resetFiles: () => {
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  }));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );

    if (multipleFiles) {
      // Unlimited when toggle is ON
      setFiles((prev) => [...droppedFiles, ...prev]);
    } else {
      // Default: max 3 files
      const maxFiles = 3;
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots > 0) {
        setFiles((prev) => [...droppedFiles.slice(0, remainingSlots), ...prev]);
      }
    }
  }, [multipleFiles, files.length]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      (file) => file.type === 'application/pdf'
    );

    if (multipleFiles) {
      // Unlimited when toggle is ON
      setFiles((prev) => [...selectedFiles, ...prev]);
    } else {
      // Default: max 3 files
      const maxFiles = 3;
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots > 0) {
        setFiles((prev) => [...selectedFiles.slice(0, remainingSlots), ...prev]);
      }
    }
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [multipleFiles, files.length]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    const withinLimit = multipleFiles || files.length <= 3;
    if (files.length >= 1 && withinLimit && onStartAnalysis && !isLoading) {
      onStartAnalysis(files, courtType, multipleFiles);
    }
  };

  const hasFiles = files.length >= 1;
  const canAddMoreFiles = multipleFiles ? true : files.length < 3;

  // Show loading component when uploading
  if (isLoading) {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <UploadLoadingCard
          title="تحليل الأحكام القضائية"
          description="يرجى تحميل الأحكام القضائية من هنا لتمكين النظام من تحليل محتواها وإعداد تحليل دقيق."
          files={files.map((file) => ({
            name: file.name,
            size: file.size,
          }))}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white rounded-[15px] shadow-lg p-6 md:p-8">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors"
        aria-label="إغلاق"
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

      {/* Title */}
      <h2
        className="text-[24px] font-bold text-[#1A1A1A] mb-2 text-right"
        style={{ fontFamily: FONT_FAMILY }}
      >
        تحميل الأحكام القضائية
      </h2>

      {/* Description */}
      <p
        className="text-[14px] text-[#666666] mb-6 text-right"
        style={{ fontFamily: FONT_FAMILY }}
      >
        يرجى تحميل الأحكام القضائية من هنا لتمكين النظام من تحليل محتواها وإعداد تحليل دقيق.
      </p>

      {/* Multiple Files Toggle */}
      {/* <div className="flex justify-start mb-6">
        <_ToggleSwitch
        className='flex-row-reverse'
          checked={multipleFiles}
          onCheckedChange={_setMultipleFiles}
          label="رفع ملفات متعددة"
        />
      </div> */}

      {/* Court Type Tabs */}
      {/* <div className="mb-6">
        <CourtTabs value={courtType} onValueChange={setCourtType} />
      </div> */}

      {/* Upload Area */}
      <div
        onDragOver={canAddMoreFiles ? handleDragOver : undefined}
        onDragLeave={canAddMoreFiles ? handleDragLeave : undefined}
        onDrop={canAddMoreFiles ? handleDrop : undefined}
        className={`
          relative border-2 border-dashed rounded-[12px] p-12 text-center transition-colors
          ${isDragging && canAddMoreFiles ? 'border-[#00A79D] bg-[#00A79D]/5' : 'border-[#D1D5DB] bg-[#F9FAFB]'}
          ${hasFiles ? 'border-[#00A79D] bg-[#00A79D]/5' : ''}
          ${!canAddMoreFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple={multipleFiles}
          onChange={handleFileSelect}
          disabled={!canAddMoreFiles}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="flex justify-center mb-4">
          <img src={UploadIcon} alt="رفع" className="w-[42px] h-[42px]" />
        </div>

        {/* Instructions */}
        <p
          className="text-[16px] text-[#1A1A1A] mb-2"
          style={{ fontFamily: FONT_FAMILY }}
        >
          قم بسحب الملف هنا لبدء الرفع
        </p>

        <p
          className="text-[14px] text-[#666666] mb-4"
          style={{ fontFamily: FONT_FAMILY }}
        >
          او
        </p>

        {/* Browse Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          disabled={!canAddMoreFiles}
          className={`border-[#00A79D] text-[#00A79D] hover:bg-[#00A79D] hover:text-white ${
            !canAddMoreFiles ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ fontFamily: FONT_FAMILY }}
        >
          تصفح الملفات
        </Button>

      </div>

      {/* Uploaded Files Cards */}
      {hasFiles && (
        <div className="mt-4 space-y-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-4 p-4 border border-[#E5E7EB] rounded-[8px] bg-white"
            >
              <div className="flex-shrink-0">
                <img
                  src={PdfIcon}
                  alt="PDF"
                  className="w-11 h-11"
                />
              </div>

              <div className="flex-1 min-w-0 text-right">
                <p
                  className="text-[14px] font-medium text-[#1A1A1A] truncate"
                  style={{ fontFamily: FONT_FAMILY }}
                >
                  {file.name}
                </p>
                <p
                  className="text-[12px] text-[#666666] mt-1"
                  style={{ fontFamily: FONT_FAMILY }}
                >
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                aria-label="إزالة الملف"
              >
                <img
                  src={HighlightOffIcon}
                  alt="إزالة"
                  className="w-6 h-6"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[8px] text-right"
          style={{ fontFamily: FONT_FAMILY }}
        >
          <p className="text-[14px] text-red-600">
            خطأ: {error.message || 'حدث خطأ أثناء رفع الملفات'}
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleStartAnalysis}
        disabled={!hasFiles || isLoading}
        className={`
          w-full h-[48px] rounded-[8px] text-[16px] font-bold transition-colors mt-[15px]
          ${hasFiles && !isLoading
            ? 'bg-[#00A79D] hover:bg-[#00A79D]/90 text-white'
            : 'bg-[#D1D5DB] text-[#9CA3AF] cursor-not-allowed'
          }
        `}
        style={{ fontFamily: FONT_FAMILY }}
      >
        {isLoading ? 'جاري التحليل...' : 'بدء عملية التحليل'}
      </Button>
    </div>
  );
});

PdfUploadModal.displayName = 'PdfUploadModal';