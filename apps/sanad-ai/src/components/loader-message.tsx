import React from 'react';
import ThreeStarsIcon from '../assets/threeStars.svg';


export const LoaderMessage: React.FC = () => {
  return (
    <div className="flex items-start justify-start w-full">
      <div className="flex flex-1 flex-col items-start justify-center min-h-[66px] px-4 py-3.5 rounded-2xl">
        <div className="flex gap-[9px] items-center">
          {/* Three stars icon with animation */}
          <div className="relative w-[28px] h-[28px] flex-shrink-0">
            <img 
              src={ThreeStarsIcon} 
              alt="Loading" 
              className="w-full h-full animate-pulse"
              style={{ 
                animationDuration: '1.5s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }}
            />
          </div>
          <p
            className="font-normal leading-[25.233px] text-[14.419px] text-black text-right"
            dir="auto"
          >
            جار التحليل، يتم الان معالجة طلبك..
          </p>
        </div>
      </div>
    </div>
  );
};

