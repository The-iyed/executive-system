import React, { useEffect, useRef } from 'react';
import { MessageResponse } from '@sanad-ai/ui';
import { DocumentSources, RelatedQuestions, MessageActions } from '@sanad-ai/ui';
import { parseContent } from '@sanad-ai/response-parser';
import type {
  LegislatorMessage,
  DocumentReference,
} from '@sanad-ai/api';
import { ChatInput } from './chat-input';
import { LoaderMessage } from './loader-message';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

export interface LegislatorChatInterfaceProps {
  messages: LegislatorMessage[];
  isLoading: boolean;
  streamingContent?: string;
  onSendMessage: (message: string, file?: File, audioFile?: File) => void;
  onQuestionClick?: (question: string) => void;
  onDocumentDownload?: (document: DocumentReference) => void;
  onDocumentView?: (document: DocumentReference) => void;
}

export const LegislatorChatInterface: React.FC<LegislatorChatInterfaceProps> = ({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  onQuestionClick,
  onDocumentDownload,
  onDocumentView,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [messages, streamingContent]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-h-0">
        <div className="max-w-[1271px] mx-auto flex flex-col gap-[46px]">
          {messages.map((message, index) => {
            const isUser = message.role === 'user' || message.message_data?.type === 'user';
            const content = message.content || message.message_data?.content || '';
            const metadata = message.response_metadata || message.metadata || message.message_data?.metadata;
            
            // Parse content to extract documents and questions
            const parsed = parseContent(content);
            
            // Get documents from multiple sources
            const documents: DocumentReference[] = 
              parsed.documents.length > 0
                ? parsed.documents
                : metadata?.resources_documents || message.sources_documents || [];

            // Get related questions from multiple sources
            const relatedQuestions: string[] =
              parsed.relatedQuestions.length > 0
                ? parsed.relatedQuestions
                : metadata?.related_questions || message.related_questions || [];

            return (
              <div key={message.message_id || message._id || index} className="flex flex-col gap-[46px]">
                {/* User Message */}
                {isUser && (
                  <div className="flex items-center justify-end w-full">
                    <div className="bg-[#f6f6f6] border border-[rgba(0,0,0,0.09)] flex flex-col items-start justify-center min-h-[66px] px-4 py-3.5 rounded-2xl shadow-[0px_14px_19.1px_0px_rgba(0,0,0,0.05)] max-w-[350px]">
                      <p
                        className="font-normal leading-[21px] text-base text-[#101828] text-right"
                        style={{ fontFamily: FONT_FAMILY }}
                        dir="auto"
                      >
                        {content}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {!isUser && (
                  <div className="flex items-start justify-start w-full">
                    <div className="flex flex-col gap-8 items-start justify-center px-4 py-3.5 rounded-2xl w-full">
                      {/* Message Content */}
                      <div className="w-full" style={{ fontFamily: FONT_FAMILY }} dir="rtl">
                        <MessageResponse
                          className="text-right [&_p]:mb-0 [&_p]:leading-[25.233px] [&_p]:text-[14.419px] [&_p]:text-[#101828] [&_strong]:font-bold [&_strong]:text-[16.221px]"
                        >
                          {parsed.text || content}
                        </MessageResponse>
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center justify-end w-full">
                        <MessageActions
                          onCopy={() => handleCopy(parsed.text || content)}
                        />
                      </div>

                      {/* Sources */}
                      {documents.length > 0 && (
                        <DocumentSources
                          documents={documents}
                          onDownload={onDocumentDownload}
                          onView={onDocumentView}
                        />
                      )}

                      {/* Related Questions */}
                      {relatedQuestions.length > 0 && (
                        <RelatedQuestions
                          questions={relatedQuestions}
                          onQuestionClick={onQuestionClick}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming Message */}
          {isLoading && streamingContent && (
            <div className="flex items-start justify-start w-full">
              <div className="flex flex-col gap-8 items-start justify-center px-4 py-3.5 rounded-2xl w-full">
                <div className="w-full" style={{ fontFamily: FONT_FAMILY }} dir="rtl">
                  <MessageResponse
                    className="text-right [&_p]:mb-0 [&_p]:leading-[25.233px] [&_p]:text-[14.419px] [&_p]:text-[#101828] [&_strong]:font-bold [&_strong]:text-[16.221px]"
                  >
                    {streamingContent}
                  </MessageResponse>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !streamingContent && <LoaderMessage />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="w-full flex-shrink-0 px-4 sm:px-6 md:p-8 pb-4 sm:pb-6 md:pb-8 bg-white">
        <div className="max-w-[1271px] mx-auto flex flex-col gap-4 sm:gap-5">
          <div className="flex justify-center w-full">
            <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
          </div>

          {/* Disclaimer Text */}
          <p
            className="text-[#898989] text-[8px] sm:text-[9px] md:text-[10px] leading-[14px] sm:leading-[16px] md:leading-[18.859px] text-center px-2 whitespace-pre-wrap"
            style={{ fontFamily: FONT_FAMILY }}
            dir="auto"
          >
            هذا المنتج مُقدَّم لأغراض معلوماتية فقط، ولا نتحمّل أي مسؤولية عن أي استخدام غير صحيح أو أي نتائج قد تترتب عليه.
          </p>
        </div>
      </div>
    </div>
  );
};

