import React from 'react';
import { Loader } from '@sanad-ai/ui';
import { PdfCard } from '../../../components';
import { FONT_FAMILY, EMPTY_STATE_MESSAGES } from '../constants';

interface CaseFile {
  id: string;
  name: string;
  size: string;
}

interface CaseFilesSectionProps {
  files: CaseFile[];
  isLoading: boolean;
  error: Error | null;
}

export const CaseFilesSection: React.FC<CaseFilesSectionProps> = ({
  files,
  isLoading,
  error,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-2xl font-bold text-right text-[#1A1A1A]"
          style={{ fontFamily: FONT_FAMILY }}
        >
          ملفات القضية
        </h2>
        {!isLoading && !error && files.length > 0 && (
          <p
            className="text-sm text-[#666] text-right"
            style={{ fontFamily: FONT_FAMILY }}
          >
            عدد الملفات: {files.length}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-[24.786px] rounded-[14.872px] border-[1.239px] border-[#EAECF0] bg-white p-[29.744px] shadow-[0_1.239px_3.718px_0_rgba(16,24,40,0.10),0_1.239px_2.479px_0_rgba(16,24,40,0.06)]">
        {isLoading ? (
          <div className="flex items-center justify-center w-full py-8">
            <Loader className="w-8 h-8 text-[#00A79D]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full py-8">
            <p
              className="text-sm text-[#DC2626] text-right"
              style={{ fontFamily: FONT_FAMILY }}
            >
              {EMPTY_STATE_MESSAGES.loadingError}: {error.message || 'خطأ غير معروف'}
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center w-full py-8">
            <p
              className="text-sm text-[#666] text-right"
              style={{ fontFamily: FONT_FAMILY }}
            >
              {EMPTY_STATE_MESSAGES.noFiles}
            </p>
          </div>
        ) : (
          <div className="flex flex-row gap-[24.786px] overflow-x-auto w-full case-files-scroll">
            {files.map((file) => (
              <PdfCard
                key={file.id}
                name={file.name}
                size={file.size}
                className="max-w-[442px]"
              />
            ))}
          </div>
        )}
        <style>{`
          .case-files-scroll {
            scrollbar-gutter: stable;
          }
          .case-files-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .case-files-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 15px;
          }
          .case-files-scroll::-webkit-scrollbar-thumb {
            background: #E0E0E0;
            border-radius: 15px;
          }
          .case-files-scroll::-webkit-scrollbar-thumb:hover {
            background: #D0D0D0;
          }
        `}</style>
      </div>
    </div>
  );
};
