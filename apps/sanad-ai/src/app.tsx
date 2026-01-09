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

  // Initialize API client
  const apiClient = createEnhancedApiClient({
    baseURL: config.apiBaseUrl,
    basicAuth: config.basicAuth,
  });

  // Initialize legislator queries
  const legislatorQueries = createLegislatorQueries({ apiClient });

  // Load conversations on mount
  const { data: conversationsData, refetch: refetchConversations } = legislatorQueries.useConversations({
    limit: 50,
    sort_by: 'updated_at',
  });

  // Load messages for current conversation
  const { data: messagesData, refetch: refetchMessages } = legislatorQueries.useMessages(
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
      setCurrentConversationId(recentConversation.conversation_id);
      setConversationIdInUrl(recentConversation.conversation_id);
      // Check if conversation has messages from query cache
      const cachedMessages = queryClient.getQueryData([
        'legislator',
        'conversations',
        recentConversation.conversation_id,
        'messages',
        { limit: 100 },
      ]) as any;
      if (cachedMessages?.messages && cachedMessages.messages.length > 0) {
        setShowWelcome(false);
      } else {
        setShowWelcome(true);
      }
      return recentConversation.conversation_id;
    }

    // Create a new conversation
    const result = await createConversation.mutateAsync({ name: 'محادثة جديدة' });
    setCurrentConversationId(result.conversation_id);
    setConversationIdInUrl(result.conversation_id);
    setShowWelcome(true); // Show welcome for new empty conversation
    refetchConversations();
    return result.conversation_id;
  };

  const handleSendMessage = async (content: string, file?: File, audioFile?: File) => {
    // Hide welcome screen
    setShowWelcome(false);

    // Get or create conversation
    const conversationId = await getOrCreateConversation();

    // Create user message
    const userMessage: LegislatorMessage = {
      role: 'user',
      content,
      file_metadata: file
        ? {
            filename: file.name,
            file_id: file.name, // Temporary, should be replaced with actual file_id from API
          }
        : undefined,
      audio_metadata: audioFile
        ? {
            audio_url: URL.createObjectURL(audioFile), // Temporary, should be replaced with actual URL from API
          }
        : undefined,
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Prepare streaming request
    const request: SendMessageStreamRequest = {
      query: content,
      file,
      audio_file: audioFile,
    };

    // Handle streaming events
    let accumulatedContent = '';
    let finalMetadata: StreamEvent['metadata'] = undefined;
    let finalDocuments: StreamEvent['sources_documents'] = [];
    let finalQuestions: string[] = [];

    try {
      const controller = await legislatorQueries.sendStreamingMessage(conversationId, request, {
        onEvent: (event: StreamEvent) => {
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
                setStreamingContent(accumulatedContent);
              }
              break;

            case 'completed':
              // The completed event contains the full content and metadata
              if (event.content) {
                accumulatedContent = event.content;
                setStreamingContent(accumulatedContent);
              }
              finalMetadata = event.metadata;
              finalDocuments = event.sources_documents || [];
              finalQuestions = event.related_questions || [];
              break;

            case 'done':
              // Stream is complete, create assistant message
              // Use tool_used from done event if available, otherwise from metadata
              const assistantMessage: LegislatorMessage = {
                role: 'assistant',
                content: accumulatedContent,
                response_metadata: finalMetadata,
                sources_documents: finalDocuments,
                related_questions: finalQuestions,
                tool_used: event.tool_used || finalMetadata?.agent_type,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setIsLoading(false);
              setStreamingContent('');
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
          <WelcomeScreen onSendMessage={(msg) => handleSendMessage(msg)} />
        ) : (
          <LegislatorChatInterface
            messages={messages}
            isLoading={isLoading}
            streamingContent={streamingContent}
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
