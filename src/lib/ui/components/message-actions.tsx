import React, { useState } from 'react';
import { cn } from '@/lib/ui/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface MessageActionsProps {
  onLike?: () => void;
  onDislike?: () => void;
  onUpload?: () => void;
  onCopy?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  className?: string;
}

// Simple SVG icons
const LikeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 17.5V9.16667M10 9.16667L6.66667 5.83333H4.16667C3.24619 5.83333 2.5 6.57952 2.5 7.5V13.3333C2.5 14.2538 3.24619 15 4.16667 15H10V9.16667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DislikeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2.5V10.8333M10 10.8333L13.3333 14.1667H15.8333C16.7538 14.1667 17.5 13.4205 17.5 12.5V6.66667C17.5 5.74619 16.7538 5 15.8333 5H10V10.8333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 3V17M10 3L6 7M10 3L14 7M3 13H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="6.66667"
      y="6.66667"
      width="10"
      height="10"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M4.16667 13.3333V4.16667C4.16667 3.24619 4.91286 2.5 5.83333 2.5H13.3333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M16.6667 5L7.50004 14.1667L3.33337 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MessageActions: React.FC<MessageActionsProps> = ({
  onLike,
  onDislike,
  onUpload,
  onCopy,
  onExportDocx,
  onExportPdf,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasExportOptions = onExportDocx || onExportPdf;

  return (
    <div className={cn('flex gap-3 items-center', className)} dir="rtl">
      {onCopy && (
        <button
          onClick={handleCopy}
          className="bg-[#00a69c] flex items-center justify-center p-1.5 rounded-full hover:opacity-90 transition-opacity"
          aria-label="Copy"
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied ? (
            <CheckIcon className="w-5 h-5 text-white" />
          ) : (
            <CopyIcon className="w-5 h-5 text-white" />
          )}
        </button>
      )}
      {hasExportOptions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="bg-[#00a69c] flex items-center justify-center px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              aria-label="Export"
              title="تصدير"
            >
              <span className="text-white text-xs font-bold">تصدير</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onExportDocx && (
              <DropdownMenuItem onClick={onExportDocx}>
                <span className="text-sm" dir="rtl">تصدير DOCX</span>
              </DropdownMenuItem>
            )}
            {onExportPdf && (
              <DropdownMenuItem onClick={onExportPdf}>
                <span className="text-sm" dir="rtl">تصدير PDF</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onUpload && (
        <button
          onClick={onUpload}
          className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Upload"
        >
          <UploadIcon className="w-5 h-5 text-[#101828]" />
        </button>
      )}
      {onDislike && (
        <button
          onClick={onDislike}
          className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Dislike"
        >
          <DislikeIcon className="w-5 h-5 text-[#101828]" />
        </button>
      )}
      {onLike && (
        <button
          onClick={onLike}
          className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Like"
        >
          <LikeIcon className="w-5 h-5 text-[#101828]" />
        </button>
      )}
    </div>
  );
};

