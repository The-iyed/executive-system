import React from 'react';

const FONT_FAMILY = '"Frutiger LT Pro", sans-serif';

export const LoaderMessage: React.FC = () => {
  return (
    <div className="flex items-start justify-start w-full">
      <div className="flex flex-1 flex-col items-start justify-center min-h-[66px] px-4 py-3.5 rounded-2xl">
        <div className="flex gap-[9px] items-center">
          {/* Teal circle with white star icon - matching Figma design */}
          <div className="relative w-[27.742px] h-[27.742px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-[#00a69c] flex items-center justify-center">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
                className="animate-spin"
                style={{ animationDuration: '1.5s', animationTimingFunction: 'linear' }}
              >
                {/* Star icon */}
                <path 
                  d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z" 
                  fill="white"
                />
              </svg>
            </div>
          </div>
          <p
            className="font-normal leading-[25.233px] text-[14.419px] text-black text-right"
            style={{ fontFamily: FONT_FAMILY }}
            dir="auto"
          >
            جار التحليل، يتم الان معالجة طلبك..
          </p>
        </div>
      </div>
    </div>
  );
};

