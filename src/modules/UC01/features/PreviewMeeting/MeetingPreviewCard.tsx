import React from 'react';

export interface MeetingPreviewCardProps {
  title: string;
  children: React.ReactNode;
}

export const MeetingPreviewCard: React.FC<MeetingPreviewCardProps> = ({ title, children }) => {
  return (
    <div className="relative flex flex-col justify-center items-center p-[4px] gap-[9px] w-full min-h-[86px] bg-white rounded-[11px] shadow-[0px_2.52357px_20.8195px_rgba(58,168,124,0.25)]">
      {/* <div 
        className="absolute w-[227.75px] h-[213.87px] -left-[41.02px] top-[4.66px] bg-[#A6D8C1] -rotate-90 pointer-events-none"
        style={{ filter: 'blur(63px)' }}
      /> */}
      <div className="relative w-full min-h-[81px] bg-white rounded-[10px] flex flex-col items-start p-0">
        <div className="w-full flex flex-col items-end gap-1 p-4">
          <h3 className="w-full text-right font-semibold text-[21.0984px] leading-[28px] text-black">
            {title}
          </h3>
          <div className="w-full text-right font-normal text-base leading-[26px] text-[#2C2C2C]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
