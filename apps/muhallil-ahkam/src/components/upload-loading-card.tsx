import React from 'react';
import PdfIcon from '../assets/pdf.svg';
import { Loader } from '@sanad-ai/ui';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
};

export interface UploadLoadingCardProps {
  title?: string;
  description?: string;
  files: Array<{
    name: string;
    size: number | string;
  }>;
}

export const UploadLoadingCard: React.FC<UploadLoadingCardProps> = ({
  title = 'تحليل الأحكام القضائية',
  description = 'يرجى تحميل الأحكام القضائية من هنا لتمكين النظام من تحليل محتواها وإعداد تحليل دقيق.',
  files = [],
}) => {
  return (
    <div
      className="flex flex-col items-start gap-4 self-stretch rounded-[16px] bg-white p-6"
      style={{
        boxShadow: '0 4px 50px 0 rgba(33, 33, 33, 0.08), 0 4px 6px 0 rgba(33, 33, 33, 0.04)',
      }}
      dir="rtl"
    >
      {/* Title */}
      <h3
        className="w-full text-center text-[#0B0B0B] font-bold leading-[26px] tracking-[-0.2px]"
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="w-full overflow-hidden text-center text-ellipsis whitespace-nowrap text-[#6D6D6D] font-normal leading-[20px] tracking-normal"
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: '14px',
        }}
        title={description}
      >
        {description}
      </p>

      {/* PDF Files Cards */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-[8px] bg-white"
            >

              {/* PDF Icon */}
              <div className="flex-shrink-0">
                <img
                  src={PdfIcon}
                  alt="PDF"
                  className="w-11 h-11"
                />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0 text-right">
                <p
                  className="text-[14px] font-medium text-[#1A1A1A] truncate"
                  style={{ fontFamily: FONT_FAMILY }}
                  title={file.name}
                >
                  {file.name}
                </p>
                <p
                  className="text-[12px] text-[#666666] mt-1"
                  style={{ fontFamily: FONT_FAMILY }}
                >
                  {typeof file.size === 'number' ? formatFileSize(file.size) : file.size}
                </p>
              </div>

              <div className="flex-shrink-0">
                <Loader size={20} className="text-[#00A79D]" />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};