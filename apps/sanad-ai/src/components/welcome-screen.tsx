import React from 'react';
import { useSidebar } from '@sanad-ai/ui';
import { WelcomeHeader } from './welcome-header';
import { ServicesGrid } from './services-grid';
import { ChatInput } from './chat-input';


export interface WelcomeScreenProps {
  onSendMessage: (message: string, file?: File, audioFile?: File, letterResponse?: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSendMessage }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="w-full h-full relative flex items-center justify-center p-0 lg:p-2 xl:p-3 2xl:p-4 overflow-y-auto">
      {/* Centered Content Container - Full width below 1020px (lg breakpoint), container above */}
      <div 
        className={`w-full h-fit lg:bg-white lg:rounded-[16px] xl:rounded-[20px] lg:shadow-[0px_32px_64px_-12px_rgba(4,88,89,0.24)] p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col items-center gap-3 sm:gap-4 md:gap-5 transition-all duration-300 ${
          // Below 1020px (lg), full width, no container
          // Above 1020px (lg), use container with max-width
          isCollapsed 
            ? 'lg:max-w-[96%] xl:max-w-[90%] 2xl:max-w-[85%] 3xl:max-w-[900px]' 
            : 'lg:max-w-[95%] xl:max-w-[85%] 2xl:max-w-[75%] 3xl:max-w-[700px]'
        }`}
      >
        <WelcomeHeader />
        <ServicesGrid />
        <ChatInput onSendMessage={onSendMessage} />

        {/* Disclaimer Text at Bottom */}
        <p
          className="text-[#898989] text-[8px] sm:text-[9px] md:text-[10px] leading-[14px] sm:leading-[16px] md:leading-[18.859px] text-center px-2 max-w-[95%] mt-1"
          dir="auto"
        >
          هذا المنتج مُقدَّم لأغراض معلوماتية فقط، ولا نتحمّل أي مسؤولية عن أي استخدام غير صحيح أو أي نتائج قد تترتب عليه.
        </p>
      </div>
    </div>
  );
};
