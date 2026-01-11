import React, { useEffect, useRef } from 'react';
import { cn, AudioPlayer, Skeleton, Reasoning, ReasoningTrigger, ReasoningContent, StreamingMarkdown } from '@sanad-ai/ui';
import { DocumentSources, RelatedQuestions, MessageActions } from '@sanad-ai/ui';
import { parseContent } from '@sanad-ai/response-parser';
import { FileText } from 'lucide-react';
import type {
  LegislatorMessage,
  DocumentReference,
} from '@sanad-ai/api';
import { ChatInput } from './chat-input';
import { LoaderMessage } from './loader-message';


export interface LegislatorChatInterfaceProps {
  messages: LegislatorMessage[];
  isLoading: boolean;
  isLoadingMessages?: boolean;
  streamingContent?: string;
  thinkingContent?: string;
  processingSteps?: Array<{ event: string; label: string; status: 'complete' | 'active' | 'pending'; details?: string }>;
  onSendMessage: (message: string, file?: File, audioFile?: File, letterResponse?: boolean) => void;
  onQuestionClick?: (question: string) => void;
  onDocumentDownload?: (document: DocumentReference) => void;
  onDocumentView?: (document: DocumentReference) => void;
}

export const LegislatorChatInterface: React.FC<LegislatorChatInterfaceProps> = ({
  messages,
  isLoading,
  isLoadingMessages = false,
  streamingContent,
  thinkingContent,
  processingSteps = [],
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
        <div className="max-w-[1271px] mx-auto flex flex-col gap-[30px]">
          {/* Messages Skeleton Loader */}
          {isLoadingMessages && messages.length === 0 && (
            <div className="flex flex-col gap-[30px]">
              {[...Array(3)].map((_, index) => (
                <div key={`message-skeleton-${index}`} className="flex flex-col gap-4">
                  {/* User message skeleton */}
                  <div className="flex items-start justify-start w-full">
                    <Skeleton className="h-[66px] w-[350px] max-w-[350px] rounded-2xl" />
                  </div>
                  {/* Assistant message skeleton */}
                  <div className="flex items-start justify-start w-full">
                    <div className="flex flex-col gap-8 items-start justify-center px-4 py-3.5 rounded-2xl w-full">
                      <Skeleton className="h-32 w-full rounded-2xl" />
                      <Skeleton className="h-6 w-24 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {messages.map((message, index) => {
            const isUser = message.role === 'user' || message.message_data?.type === 'user';
            const content = message.content || message.message_data?.content || '';
            const metadata = message.response_metadata || message.metadata || message.message_data?.metadata;
            // Check if this is a letter response (hide query text)
            const isLetterResponse = (message as any).letter_response === true;
            const fileObject = (message as any).fileObject as File | undefined;
            
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

            // Check if this is the last assistant message and thinking should appear above it
            // Don't show thinking for letter responses
            const isLastMessage = index === messages.length - 1;
            const isLetterResponseMode = processingSteps.length > 0 || isLetterResponse;
            const shouldShowThinkingAbove = !isUser && isLastMessage && thinkingContent && !isLoading && !isLetterResponseMode;

            return (
              <div key={message.message_id || message._id || index} className="flex flex-col gap-[30px]">
                {/* Thinking/Reasoning - Show above last assistant message when completed */}
                {shouldShowThinkingAbove && (
                  <div className="flex items-start justify-start w-full mb-4">
                    <div className="flex flex-col gap-2 items-start justify-center px-3 py-2 rounded-lg w-full">
                      <Reasoning
                        isStreaming={false}
                        defaultOpen={true}
                        className="w-full"
                      >
                        <ReasoningTrigger
                          getThinkingMessage={(_isStreaming, duration) => (
                            <span className="text-xs text-muted-foreground" dir="rtl">
                              {duration ? `فكر لمدة ${duration} ثانية` : 'التفكير'}
                            </span>
                          )}
                        />
                        <ReasoningContent>{thinkingContent}</ReasoningContent>
                      </Reasoning>
                    </div>
                  </div>
                )}

                {/* User Message */}
                {isUser && (
                  <div className="flex items-center justify-start w-full">
                    <div className="bg-[#f6f6f6] border border-[rgba(0,0,0,0.09)] flex flex-col items-start justify-center px-4 py-3.5 rounded-2xl shadow-[0px_14px_19.1px_0px_rgba(0,0,0,0.05)] max-w-[350px] gap-2" style={{ minHeight: (message.audio_metadata?.audio_url && !content) || (isLetterResponse && fileObject) ? 'auto' : '66px' }}>
                      {/* File Display */}
                      {fileObject && (
                        <div className="w-full flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200" dir="rtl">
                          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-800 truncate flex-1" >
                            {fileObject.name}
                          </span>
                        </div>
                      )}
                      {/* Audio Player */}
                      {message.audio_metadata?.audio_url && (
                        <div className="w-full">
                          <AudioPlayer
                            src={message.audio_metadata.audio_url}
                            onError={() => {}}
                          />
                        </div>
                      )}
                      {/* Text Content - Hide if letter_response is true */}
                      {content && !isLetterResponse && (
                        <p
                          className="font-normal leading-[21px] text-base text-[#101828] text-right w-full"
                     
                          dir="auto"
                        >
                          {content}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {!isUser && (
                  <div className="flex items-start justify-start w-full">
                    <div className="flex flex-col gap-8 items-start justify-center px-4 py-3.5 rounded-2xl w-full">
                      {/* Message Content */}
                      <div className="w-full"  dir="rtl">
                        <div className="overflow-x-auto">
                          <StreamingMarkdown
                            mode="static"
                            content={parsed.text}
                            className="text-right [&_p]:mb-0 [&_p]:leading-[25.233px] [&_p]:text-[14.419px] [&_p]:text-[#101828] [&_strong]:font-bold [&_strong]:text-[16.221px] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:mr-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:mr-4 [&_ol]:mb-2 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-r-4 [&_blockquote]:border-gray-300 [&_blockquote]:pr-4 [&_blockquote]:pl-2 [&_blockquote]:italic [&_table]:!display-table [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4 [&_table]:mt-4 [&_table]:border [&_table]:border-gray-300 [&_table]:min-w-full [&_table]:table-auto [&_table]:overflow-visible [&_thead]:bg-gray-50 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:font-bold [&_th]:text-right [&_th]:whitespace-nowrap [&_th]:!display-table-cell [&_tbody]:!display-table-row-group [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-right [&_td]:align-top [&_td]:!display-table-cell [&_tr]:border-b [&_tr]:border-gray-200 [&_tr]:!display-table-row [&_tr:hover]:bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* Message Actions */}
                      <div className="">
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

          {/* Thinking/Reasoning - Show above streaming message when actively streaming */}
          {/* Don't show thinking for letter responses */}
          {thinkingContent && isLoading && processingSteps.length === 0 && (
            <div className="flex items-start justify-start w-full mb-4">
              <div className="flex flex-col gap-2 items-start justify-center px-3 py-2 rounded-lg w-full">
                <Reasoning
                  isStreaming={isLoading}
                  defaultOpen={true}
                  className="w-full"
                >
                  <ReasoningTrigger
                    getThinkingMessage={(isStreaming, duration) => (
                      <span className="text-xs text-muted-foreground" dir="rtl">
                        {isStreaming ? 'جارٍ التفكير...' : duration ? `فكر لمدة ${duration} ثانية` : 'التفكير'}
                      </span>
                    )}
                  />
                  <ReasoningContent>{thinkingContent}</ReasoningContent>
                </Reasoning>
              </div>
            </div>
          )}

          {/* Streaming Message - Show after thinking */}
          {isLoading && streamingContent && (() => {
            // Parse streaming content to remove XML tags
            const parsedStreaming = parseContent(streamingContent);
            return (
              <div className="flex items-start justify-start w-full">
                <div className="flex flex-col gap-8 items-start justify-center px-4 py-3.5 rounded-2xl w-full">
                  <div className="w-full"  dir="rtl">
                    <div className="overflow-x-auto">
                      <StreamingMarkdown
                        mode="streaming"
                        content={parsedStreaming.text}
                        instanceId={`stream-${Date.now()}`}
                        className="text-right [&_p]:mb-0 [&_p]:leading-[25.233px] [&_p]:text-[14.419px] [&_p]:text-[#101828] [&_strong]:font-bold [&_strong]:text-[16.221px] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:mr-4 [&_ol]:list-decimal [&_ol]:mr-4 [&_li]:mb-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-r-4 [&_blockquote]:border-gray-300 [&_blockquote]:pr-4 [&_blockquote]:italic [&_table]:!display-table [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4 [&_table]:mt-4 [&_table]:border [&_table]:border-gray-300 [&_table]:min-w-full [&_table]:table-auto [&_table]:overflow-visible [&_thead]:bg-gray-50 [&_th]:border [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:font-bold [&_th]:text-right [&_th]:whitespace-nowrap [&_th]:!display-table-cell [&_tbody]:!display-table-row-group [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:text-right [&_td]:align-top [&_td]:!display-table-cell [&_tr]:border-b [&_tr]:border-gray-200 [&_tr]:!display-table-row [&_tr:hover]:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Processing Steps for Letter Response */}
          {/* isLoading && processingSteps && processingSteps.length > 0 && (
            <div className="flex items-start justify-start w-full">
              <div className="bg-[#f6f6f6] border border-[rgba(0,0,0,0.09)] flex flex-col items-start justify-center px-4 py-3.5 rounded-2xl shadow-[0px_14px_19.1px_0px_rgba(0,0,0,0.05)] max-w-[500px] gap-3" dir="rtl">
                <div className="w-full space-y-2">
                  {processingSteps.map((step) => (
                    <div
                      key={step.event}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        step.status === 'complete' ? 'text-green-600' : step.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                      )}
                    >
                      {step.status === 'complete' && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {step.status === 'active' && (
                        <div className="w-4 h-4 flex-shrink-0 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-4 h-4 flex-shrink-0 border-2 border-gray-300 rounded-full" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">{step.label}</span>
                        {step.details && (
                          <span className="text-xs text-gray-500 mr-2">({step.details})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) */}
          {isLoading && processingSteps && processingSteps.length > 0 && (
            <LoaderMessage/>
          )}

          {/* Loading Indicator - Only show when loading but not thinking, streaming, or processing */}
          {isLoading && !streamingContent && !thinkingContent && (!processingSteps || processingSteps.length === 0) && <LoaderMessage />}

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
            dir="auto"
          >
            هذا المنتج مُقدَّم لأغراض معلوماتية فقط، ولا نتحمّل أي مسؤولية عن أي استخدام غير صحيح أو أي نتائج قد تترتب عليه.
          </p>
        </div>
      </div>
    </div>
  );
};

