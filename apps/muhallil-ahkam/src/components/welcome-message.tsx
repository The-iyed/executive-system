import React from 'react';
import WelcomeAvatar from '../assets/9d53f805f9a8d5abf29c548b2ad39d3a6662b408.png';


interface WelcomeMessageProps {
  userName?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div 
        className="flex w-[92px] h-[92px] justify-center items-centerflex-shrink-0"
        style={{
          borderRadius: '23.004px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img 
          src={WelcomeAvatar} 
          alt="Welcome" 
        />
      </div>

      <h2
        className="text-[32px] font-bold text-[#1A1A1A] text-center"
        
      >
        حياك الله 
      </h2>

      <p
        className="text-[18px] text-[#666666] text-center"
        
      >
           كيف يمكنني مساعدتك اليوم؟
      </p>
    </div>
  );
};
