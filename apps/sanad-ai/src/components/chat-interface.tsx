import React from 'react';
import { ChatInput } from './chat-input';
import { LoaderMessage } from './loader-message';
import type { Message } from '@sanad-ai/chat/domain';


export interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage 
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-[1271px] mx-auto flex flex-col gap-5 sm:gap-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start w-full ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex flex-col items-start justify-center min-h-[66px] px-4 py-3.5 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-[#f6f6f6] border border-[rgba(0,0,0,0.09)] shadow-[0px_14px_19.1px_0px_rgba(0,0,0,0.05)] max-w-[350px]'
                    : 'max-w-full'
                }`}
              >
                <p
                  className={`font-normal leading-[21px] text-base text-right ${
                    message.role === 'user' ? 'text-[#101828]' : 'text-black'
                  }`}
                  dir="auto"
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && <LoaderMessage />}
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full px-4 sm:px-6 md:p-8 pb-4 sm:pb-6 md:pb-8">
        <div className="max-w-[1271px] mx-auto flex flex-col gap-4 sm:gap-5">
          <div className="flex justify-center w-full">
            <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
          </div>
          
          {/* Disclaimer Text */}
          <p
            className="text-[#898989] text-[8px] sm:text-[9px] md:text-[10px] leading-[14px] sm:leading-[16px] md:leading-[18.859px] text-center px-2 whitespace-pre-wrap"
            dir="auto"
          >
            هذا المنتج مُقدَّم لأغراض معلوماتية فقط، ولا نتحمّل أي مسؤولية عن أي استخدام غير صحيح أو أي نتائج قد تترتب عليه.
          </p>
        </div>
      </div>
    </div>
  );
};

