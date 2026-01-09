import React from 'react';
import { useSidebar } from '@sanad-ai/ui';
import { WelcomeHeader } from './welcome-header';
import { ServicesGrid } from './services-grid';
import { ChatInput } from './chat-input';

const FONT_FAMILY = '"Frutiger LT Pro", sans-serif';

export interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="w-full h-full relative flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto">
      {/* Centered Content Container */}
      <div 
        className={`bg-white rounded-[16px] sm:rounded-[20px] shadow-[0px_32px_64px_-12px_rgba(4,88,89,0.24)] p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col items-center gap-3 sm:gap-4 md:gap-5 w-full transition-all duration-300 ${
          isCollapsed 
            ? 'max-w-[96%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[900px] xl:max-w-[950px]' 
            : 'max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[700px] xl:max-w-[750px]'
        }`}
      >
        <WelcomeHeader />
        <ServicesGrid />
        <ChatInput onSendMessage={onSendMessage} />

        {/* Disclaimer Text at Bottom */}
        <p
          className="text-[#898989] text-[8px] sm:text-[9px] md:text-[10px] leading-[14px] sm:leading-[16px] md:leading-[18.859px] text-center px-2 max-w-[95%] mt-1"
          style={{ fontFamily: FONT_FAMILY }}
          dir="auto"
        >
          هذا المنتج مُقدَّم لأغراض معلوماتية فقط، ولا نتحمّل أي مسؤولية عن أي استخدام غير صحيح أو أي نتائج قد تترتب عليه.
        </p>
      </div>
    </div>
  );
};
