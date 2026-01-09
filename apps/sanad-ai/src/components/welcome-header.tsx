import React from 'react';
import WelcomeAvatar from '../assets/9d53f805f9a8d5abf29c548b2ad39d3a6662b408.png';

const FONT_FAMILY = '"Frutiger LT Pro", sans-serif';

export const WelcomeHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 items-center w-full">
      {/* Welcome Avatar */}
      <div 
        className="flex h-[50px] w-[50px] sm:h-[60px] sm:w-[60px] md:h-[70px] md:w-[70px] justify-center items-center flex-shrink-0"
        style={{
          borderRadius: '23.004px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img 
          src={WelcomeAvatar} 
          alt="Welcome" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Welcome Text */}
      <div className="flex flex-col gap-0.5 sm:gap-1 items-center text-[#1f1f1f] w-full">
        <p
          className="text-[18px] sm:text-[22px] md:text-[28px] font-bold leading-[1.3] tracking-[-0.5px] sm:tracking-[-0.96px] text-center"
          style={{ fontFamily: FONT_FAMILY }}
          dir="auto"
        >
          <span className="text-black">حياك الله </span>
          <span className="text-[#045556]">عبد الله</span>
        </p>
        <p
          className="text-[13px] sm:text-[15px] leading-[1.5] text-center max-w-full sm:max-w-[601px] px-2 whitespace-pre-wrap"
          style={{ fontFamily: FONT_FAMILY }}
          dir="auto"
        >
          كيف أقدر أخدمك اليوم؟
        </p>
      </div>
    </div>
  );
};

