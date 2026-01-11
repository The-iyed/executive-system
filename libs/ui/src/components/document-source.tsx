import React from 'react';
import { cn } from '@/lib/utils';
import type { DocumentReference } from '@sanad-ai/api';
import { PdfIcon } from '@/assets/icons/PdfIcon';
import { ChevronLeftIcon } from 'lucide-react';

export interface DocumentSourceProps {
  document: DocumentReference;
  onDownload?: (document: DocumentReference) => void;
  onView?: (document: DocumentReference) => void;
  className?: string;
}

// Simple SVG icons
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 11V1M8 11L5 8M8 11L11 8M2 13H14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ViewIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 3C4.667 3 2.073 5.073 1 8C2.073 10.927 4.667 13 8 13C11.333 13 13.927 10.927 15 8C13.927 5.073 11.333 3 8 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);




export const DocumentSource: React.FC<DocumentSourceProps> = ({
  document,
  onDownload,
  onView,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white flex  h-14 items-center px-3 py-0 rounded-xl shadow-[0px_4px_25.3px_0px_rgba(0,0,0,0.08)]',
        className
      )}
      dir="rtl"
    >
    
      {/* Document Info */}
      <div className="flex gap-2 items-center flex-1 min-w-0">
          <PdfIcon />
          <p
            className="font-normal leading-[30.428px] text-sm text-[#101828]  text-right truncate"
            style={{ fontFamily: '"Frutiger LT Arabic", sans-serif' }}
          >
            {document.file_name}
          </p>
          <ChevronLeftIcon className=" text-[#98A2B3]" />

      
       
      </div>
        {/* Action Buttons */}
        <div className="flex gap-1 items-center">
        {/* Download Button */}
        <button
          onClick={() => onDownload?.(document)}
          className="bg-white border flex gap-1 border-[#f6f6f6] border-solid overflow-hidden relative rounded-[5.143px] shadow-[0px_4px_9px_0px_rgba(0,0,0,0.08)] shrink-0 size-9 flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Download document"
        >
          <DownloadIcon className="w-4 h-4 text-[#101828]" />
        </button>

        {/* View Button */}
        <button
          onClick={() => onView?.(document)}
          className="bg-white border border-[#f6f6f6] border-solid overflow-hidden relative rounded-[5.143px] shadow-[0px_4px_9px_0px_rgba(0,0,0,0.08)] shrink-0 size-9 flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="View document"
        >
          <ViewIcon className="w-4 h-4 text-[#101828]" />
        </button>
      </div>

    </div>
  );
};

export interface DocumentSourcesProps {
  documents: DocumentReference[];
  onDownload?: (document: DocumentReference) => void;
  onView?: (document: DocumentReference) => void;
  className?: string;
}

export const DocumentSources: React.FC<DocumentSourcesProps> = ({
  documents,
  onDownload,
  onView,
  className,
}) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-3 items-start', className)} dir="rtl">
      <p
        className="font-bold leading-[25.233px] text-base text-[#00a79d] text-right"
        style={{ fontFamily: '"Frutiger LT Arabic", sans-serif' }}
      >
        المصادر :
      </p>
      <div className="flex gap-4 items-center flex-wrap">
        {documents.map((doc, index) => (
          <DocumentSource
            key={index}
            document={doc}
            onDownload={onDownload}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
};

