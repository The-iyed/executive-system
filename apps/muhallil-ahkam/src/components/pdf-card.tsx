import React from 'react';
import PdfIcon from '../assets/pdf.svg';


export interface PdfCardProps {
  name: string;
  size: string;
  className?: string;
}

export const PdfCard: React.FC<PdfCardProps> = ({ name, size, className }) => {
  return (
    <div
      className={`flex flex-row items-start flex-shrink-0 w-[195px] p-[16px] gap-[8px] rounded-[12px] border-[1px] border-[#E7E7E7] bg-[#FFF] ${className || ''}`}
    >
      <img 
        src={PdfIcon} 
        alt="PDF" 
        className="flex-shrink-0 w-[44px] h-[43px]" 
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span
          className="truncate text-[#0B0B0B] text-right text-sm font-bold leading-[18px] tracking-normal"
          
          title={name}
        >
          {name}
        </span>
        <span
          className="truncate text-[#6D6D6D] text-sm font-normal leading-[16px] tracking-normal"
          
          title={size}
        >
          {size}
        </span>
      </div>
    </div>
  );
};
