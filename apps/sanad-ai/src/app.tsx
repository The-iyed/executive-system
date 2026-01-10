import React, { useState, useEffect, useRef } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createQueryClient, createEnhancedApiClient } from '@sanad-ai/api';
import { AppConfig } from '@sanad-ai/config';
import { AppLayout } from './components/app-layout';
import { WelcomeScreen } from './components/welcome-screen';
import { LegislatorChatInterface } from './components/legislator-chat-interface';
import { createLegislatorQueries } from '@sanad-ai/chat/data-access';
import type {
  LegislatorMessage,
  StreamEvent,
  SendMessageStreamRequest,
} from '@sanad-ai/api';
import type { StreamController } from '@sanad-ai/api';
// Import app-specific APIs to register them
import './api/endpoints';

export interface ChatAppProps {
  config: AppConfig;
}

const ChatAppContent: React.FC<{ config: AppConfig }> = ({ config }) => {
  const queryClient = useQueryClient();
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<LegislatorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const streamControllerRef = useRef<StreamController | null>(null);
  const [processingSteps, setProcessingSteps] = useState<Array<{ event: string; label: string; status: 'complete' | 'active' | 'pending'; details?: string }>>([]); // Used in legislator-chat-interface
  const [isLetterResponse, setIsLetterResponse] = useState(false);
  const streamingContentRef = useRef<string>('');

  // Helper functions for URL search params
  const getConversationIdFromUrl = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get('conversation');
  };

  const setConversationIdInUrl = (conversationId: string | null) => {
    const url = new URL(window.location.href);
    if (conversationId) {
      url.searchParams.set('conversation', conversationId);
    } else {
      url.searchParams.delete('conversation');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Initialize API client - use config from portal, fallback to env vars for dev mode
  const apiClient = createEnhancedApiClient({
    baseURL: config.apiBaseUrl || import.meta.env.VITE_SANAD_API_BASE_URL ,
    basicAuth: config.basicAuth || (() => {
      const username = import.meta.env.VITE_API_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_API_BASIC_AUTH_PASSWORD;
      const authString = import.meta.env.VITE_API_BASIC_AUTH;
      if (authString) return { authString };
      if (username && password) return { username, password };
      return undefined;
    })(),
  });

  // Initialize legislator queries
  const legislatorQueries = createLegislatorQueries({ apiClient });

  // Load conversations on mount
  const { data: conversationsData, refetch: refetchConversations, isLoading: isLoadingConversations } = legislatorQueries.useConversations({ // Used in Sidebar component
    limit: 50,
    sort_by: 'updated_at',
  });

  // Load messages for current conversation
  const { data: messagesData, refetch: refetchMessages, isLoading: isLoadingMessages } = legislatorQueries.useMessages(
    currentConversationId || '',
    { limit: 100 }
  );

  // Create conversation mutation
  const createConversation = legislatorQueries.useCreateConversation();
  const updateConversation = legislatorQueries.useUpdateConversation();
  const deleteConversation = legislatorQueries.useDeleteConversation();

  // Load conversation from URL params on mount
  useEffect(() => {
    const conversationIdFromUrl = getConversationIdFromUrl();
    if (conversationIdFromUrl && conversationIdFromUrl !== currentConversationId) {
      setCurrentConversationId(conversationIdFromUrl);
    }
  }, []);

  // Listen for URL changes (e.g., browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const conversationIdFromUrl = getConversationIdFromUrl();
      if (conversationIdFromUrl !== currentConversationId) {
        setCurrentConversationId(conversationIdFromUrl);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentConversationId]);

  // Auto-select last conversation when no conversation is selected
  useEffect(() => {
    // Only auto-select if:
    // 1. No conversation is currently selected
    // 2. No conversation ID in URL (to avoid overriding URL-based selection)
    // 3. Conversations data is loaded
    // 4. There are conversations available
    const conversationIdFromUrl = getConversationIdFromUrl();
    
    if (
      !currentConversationId &&
      !conversationIdFromUrl &&
      conversationsData?.conversations &&
      conversationsData.conversations.length > 0
    ) {
      const lastConversation = conversationsData.conversations[0]; // First item is the most recent (sorted by updated_at)
      const conversationId = lastConversation.conversation_id;
      
      console.log('Auto-selecting last conversation:', conversationId);
      setCurrentConversationId(conversationId);
      setConversationIdInUrl(conversationId);
      // Messages will be loaded automatically via the useMessages hook when currentConversationId changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData?.conversations?.length, currentConversationId]);

  // Update messages when loaded
  useEffect(() => {
    if (messagesData?.messages && currentConversationId) {
      const loadedMessages = messagesData.messages;
      setMessages(loadedMessages);
      // Show welcome screen if conversation is empty
      if (loadedMessages.length === 0) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    } else if (currentConversationId && messagesData?.messages && messagesData.messages.length === 0) {
      // Conversation exists but has no messages
      setShowWelcome(true);
    }
  }, [messagesData, currentConversationId]);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setMessages([]); // Clear messages while loading
    // Update URL search params
    setConversationIdInUrl(conversationId);
    refetchMessages();
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    try {
      const result = await createConversation.mutateAsync({ name: 'محادثة جديدة' });
      setCurrentConversationId(result.conversation_id);
      setMessages([]);
      setShowWelcome(true); // Show welcome screen for new empty conversation
      // Update URL search params
      setConversationIdInUrl(result.conversation_id);
      refetchConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Create or get conversation
  const getOrCreateConversation = async (): Promise<string> => {
    if (currentConversationId) {
      return currentConversationId;
    }

    // Try to get the most recent conversation
    if (conversationsData?.conversations && conversationsData.conversations.length > 0) {
      const recentConversation = conversationsData.conversations[0];
      const conversationId = recentConversation.conversation_id;
      
      // Update state synchronously
      setCurrentConversationId(conversationId);
      setConversationIdInUrl(conversationId);
      
      // Check if conversation has messages from query cache
      const cachedMessages = queryClient.getQueryData([
        'legislator',
        'conversations',
        conversationId,
        'messages',
        { limit: 100 },
      ]) as any;
      if (cachedMessages?.messages && cachedMessages.messages.length > 0) {
        setShowWelcome(false);
      } else {
        setShowWelcome(true);
      }
      
      // Wait a tick to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 0));
      
      return conversationId;
    }

    // Create a new conversation - wait for it to complete
    console.log('Creating new conversation before sending message...');
    const result = await createConversation.mutateAsync({ name: 'محادثة جديدة' });
    const conversationId = result.conversation_id;
    
    // Update state synchronously
    setCurrentConversationId(conversationId);
    setConversationIdInUrl(conversationId);
    setShowWelcome(true); // Show welcome for new empty conversation
    
    // Refetch conversations to ensure it's in the list
    await refetchConversations();
    
    // Wait a tick to ensure state is fully updated before proceeding
    await new Promise(resolve => setTimeout(resolve, 0));
    
    console.log('Conversation created successfully:', conversationId);
    
    return conversationId;
  };

  const handleSendMessage = async (content: string, file?: File, audioFile?: File, letterResponse?: boolean) => {
    // CRITICAL: Capture file IMMEDIATELY at the very start, before ANY other code
    // This ensures the file is preserved even if there are async operations or state updates
    const fileToUse = (file instanceof File) ? file : undefined;
    const audioFileToUse = (audioFile instanceof File) ? audioFile : undefined;
    const letterResponseToUse = letterResponse === true;
    
    // Debug: Log received parameters IMMEDIATELY
    console.log('handleSendMessage called with:', {
      content,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      fileIsFileInstance: file instanceof File,
      hasAudioFile: !!audioFile,
      letterResponse,
      fileObject: file,
    });
    
    console.log('Captured values (IMMEDIATE):', {
      fileToUse: !!fileToUse,
      fileName: fileToUse?.name,
      fileSize: fileToUse?.size,
      audioFileToUse: !!audioFileToUse,
      letterResponseToUse,
    });
    
    // CRITICAL: Get or create conversation FIRST and wait for it to complete
    // This ensures the conversation exists before we try to send the message
    console.log('Getting or creating conversation before sending message...');
    const conversationId = await getOrCreateConversation();
    
    // Verify conversation ID is valid
    if (!conversationId) {
      console.error('Failed to get or create conversation');
      return;
    }
    
    console.log('Conversation ready:', conversationId);
    
    // Hide welcome screen after conversation is ready
    setShowWelcome(false);
    
    // Verify file is still available after async operation
    console.log('After getOrCreateConversation - file still available:', {
      fileToUse: !!fileToUse,
      fileName: fileToUse?.name,
      conversationId,
    });

    // Create user message
    // For audio files, store the File object directly so we can create blob URLs on demand
    // Store the file object for display when letter_response is true
    // Use captured values to ensure they're not lost
    const userMessage: LegislatorMessage & { letter_response?: boolean; fileObject?: File } = {
      role: 'user',
      content: content,
      file_metadata: fileToUse
        ? {
            filename: fileToUse.name,
            file_id: fileToUse.name, // Temporary, should be replaced with actual file_id from API
          }
        : undefined,
      audio_metadata: audioFileToUse
        ? {
            audio_url: URL.createObjectURL(audioFileToUse), // Create blob URL for immediate display
          }
        : undefined,
      letter_response: letterResponseToUse,
      fileObject: fileToUse, // Store file object for display
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setIsLetterResponse(letterResponse === true);
    setProcessingSteps([]);

    // Prepare streaming request
    // For audio-only messages, send empty string in query field
    // For letter response, use "ولد خطاب" as query
    // Use captured values to ensure they're preserved
    const request: SendMessageStreamRequest = {
      query: letterResponseToUse ? 'ولد خطاب' : (audioFileToUse && !content ? '' : content),
      file: fileToUse || undefined,
      audio_file: audioFileToUse || undefined,
      letter_response: letterResponseToUse ? true : undefined,
    };
    
    // Debug log to verify request
    console.log('Sending request:', {
      query: request.query,
      hasFile: !!request.file,
      fileName: request.file?.name,
      fileSize: request.file?.size,
      fileType: request.file?.type,
      letterResponse: request.letter_response,
      originalFile: file,
      originalFileExists: !!file,
    });

    // Handle streaming events
    let accumulatedContent = '';
    let finalMetadata: StreamEvent['metadata'] = undefined;
    let finalDocuments: StreamEvent['sources_documents'] = [];
    let finalQuestions: string[] = [];
    
    // Reset the ref for this stream
    streamingContentRef.current = '';

    try {
      const controller = await legislatorQueries.sendStreamingMessage(conversationId, request, {
        onEvent: (event: StreamEvent) => {
          // Handle letter response processing events
          if (isLetterResponse) {
            switch (event.event) {
              case 'analyzing_pdf':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'analyzing_pdf'),
                  { event: 'analyzing_pdf', label: 'جارٍ تحليل الملف', status: 'active' as const, details: event.filename },
                ]);
                break;
              case 'pdf_analyzed':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'analyzing_pdf' && s.event !== 'pdf_analyzed'),
                  { event: 'pdf_analyzed', label: 'تم تحليل الملف', status: 'complete' as const, details: `تم تحليل ${event.text_length} حرف` },
                ]);
                break;
              case 'uploading_pdf':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'uploading_pdf'),
                  { event: 'uploading_pdf', label: 'جارٍ رفع الملف', status: 'active' as const },
                ]);
                break;
              case 'pdf_uploaded':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'uploading_pdf' && s.event !== 'pdf_uploaded'),
                  { event: 'pdf_uploaded', label: 'تم رفع الملف', status: 'complete' as const },
                ]);
                break;
              case 'agent_message_posted':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'agent_message_posted'),
                  { event: 'agent_message_posted', label: 'تم إنشاء الرسالة', status: 'complete' as const },
                ]);
                break;
              case 'agent_processing':
                setProcessingSteps((prev) => [
                  ...prev.filter((s) => s.event !== 'agent_processing'),
                  { event: 'agent_processing', label: 'جارٍ معالجة الرد', status: 'active' as const },
                ]);
                break;
            }
          }

          switch (event.event) {
            case 'message_posted':
            case 'run_created':
              // These events indicate the message was received and processing started
              // We can use run_id if needed for tracking
              break;

            case 'thinking':
              // Handle thinking events if needed (reasoning process)
              break;

            case 'content_chunk':
              if (event.chunk) {
                accumulatedContent += event.chunk;
                streamingContentRef.current = accumulatedContent;
                setStreamingContent(accumulatedContent);
              }
              break;

            case 'completed':
              // The completed event contains the full content and metadata
              if (event.content) {
                accumulatedContent = event.content;
                streamingContentRef.current = accumulatedContent;
                setStreamingContent(accumulatedContent);
              }
              finalMetadata = event.metadata;
              finalDocuments = event.sources_documents || [];
              finalQuestions = event.related_questions || [];
              break;

            case 'done':
              // Stream is complete, create assistant message
              // CRITICAL: Get the final content from multiple sources to ensure we capture it
              // Use the ref first (most up-to-date), then state, then accumulated
              const finalContent = streamingContentRef.current || accumulatedContent;
              
              console.log('Done event - final content:', {
                hasContent: !!finalContent,
                contentLength: finalContent?.length,
                fromRef: !!streamingContentRef.current,
                refLength: streamingContentRef.current?.length,
                fromAccumulated: !!accumulatedContent,
                accumulatedLength: accumulatedContent?.length,
              });
              
              // Use tool_used from done event if available, otherwise from metadata
              // Clear processing steps when done
              if (isLetterResponse) {
                setProcessingSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' as const })));
              }
              
              // Only create message if we have content
              if (finalContent && finalContent.trim()) {
                const assistantMessage: LegislatorMessage = {
                  role: 'assistant',
                  content: finalContent,
                  response_metadata: finalMetadata,
                  sources_documents: finalDocuments,
                  related_questions: finalQuestions,
                  tool_used: event.tool_used || finalMetadata?.agent_type,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                console.log('Assistant message created with content length:', finalContent.length);
              } else {
                console.warn('No final content to save - content was empty or missing');
              }
              
              setIsLoading(false);
              // Clear streaming content and processing state after a brief delay
              // This ensures the message is rendered before clearing
              setTimeout(() => {
                setStreamingContent('');
                setIsLetterResponse(false);
                setProcessingSteps([]);
              }, 300);
              
              // Invalidate queries after stream completes
              queryClient.invalidateQueries({
                queryKey: ['legislator', 'conversations', conversationId, 'messages'],
              });
              queryClient.invalidateQueries({
                queryKey: ['legislator', 'conversations'],
              });
              // Invalidate queries after stream completes
              queryClient.invalidateQueries({
                queryKey: ['legislator', 'conversations', conversationId, 'messages'],
              });
              queryClient.invalidateQueries({
                queryKey: ['legislator', 'conversations'],
              });
              break;

            case 'error':
              console.error('Stream error:', event.error, event.message);
              setIsLoading(false);
              setStreamingContent('');
              break;
          }
        },
        onError: (error: Error) => {
          console.error('Stream error:', error);
          setIsLoading(false);
          setStreamingContent('');
        },
        onClose: () => {
          setIsLoading(false);
          setStreamingContent('');
        },
      });

      streamControllerRef.current = controller;
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleDocumentDownload = (document: any) => {
    // TODO: Implement document download
    console.log('Download document:', document);
  };

  const handleDocumentView = (document: any) => {
    // TODO: Implement document view
    console.log('View document:', document);
  };

  return (
    <AppLayout
      conversations={conversationsData?.conversations || []}
      currentConversationId={currentConversationId}
      isLoadingConversations={isLoadingConversations}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={async (id) => {
        try {
          await deleteConversation.mutateAsync(id);
          if (currentConversationId === id) {
            setCurrentConversationId(null);
            setMessages([]);
            setShowWelcome(true);
            setConversationIdInUrl(null);
          }
          refetchConversations();
        } catch (error) {
          console.error('Failed to delete conversation:', error);
        }
      }}
      onUpdateConversation={async (id, name) => {
        try {
          await updateConversation.mutateAsync({ conversation_id: id, name });
          refetchConversations();
        } catch (error) {
          console.error('Failed to update conversation:', error);
        }
      }}
    >
      <div className="sanad-chat-app h-full w-full">
        {showWelcome ? (
          <WelcomeScreen key="welcome" onSendMessage={handleSendMessage} />
        ) : (
          <LegislatorChatInterface
            key="chat"
            messages={messages}
            isLoading={isLoading}
            isLoadingMessages={isLoadingMessages}
            streamingContent={streamingContent}
            processingSteps={processingSteps}
            onSendMessage={handleSendMessage}
            onQuestionClick={handleQuestionClick}
            onDocumentDownload={handleDocumentDownload}
            onDocumentView={handleDocumentView}
          />
        )}
      </div>
    </AppLayout>
  );
};

export const ChatApp: React.FC<ChatAppProps> = ({ config }) => {
  const queryClient = createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ChatAppContent config={config} />
    </QueryClientProvider>
  );
};
