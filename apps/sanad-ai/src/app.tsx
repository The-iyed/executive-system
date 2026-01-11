import React, { useState, useEffect, useRef } from 'react';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createQueryClient, createEnhancedApiClient } from '@sanad-ai/api';
import { AppConfig } from '@sanad-ai/config';
import { AppLayout } from './components/app-layout';
import { WelcomeScreen } from './components/welcome-screen';
import { LegislatorChatInterface } from './components/legislator-chat-interface';
import { createLegislatorQueries } from '@sanad-ai/chat/data-access';
import { Dialog, DialogContent } from '@sanad-ai/ui';
import type {
  LegislatorMessage,
  StreamEvent,
  SendMessageStreamRequest,
  DocumentReference,
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
  const [thinkingContent, setThinkingContent] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const streamControllerRef = useRef<StreamController | null>(null);
  const [processingSteps, setProcessingSteps] = useState<Array<{ event: string; label: string; status: 'complete' | 'active' | 'pending'; details?: string }>>([]); // Used in legislator-chat-interface
  const streamingContentRef = useRef<string>('');
  const thinkingContentRef = useRef<string>('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const pendingLetterResponseRef = useRef<{ message: LegislatorMessage; timestamp: number; conversationId: string } | null>(null);
  const lastPendingMessageTimestampRef = useRef<number>(0);
  const currentLetterResponseRef = useRef<boolean>(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentReference | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

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

  // Helper function to get auth header from config
  const getAuthHeader = (): string | undefined => {
    const basicAuth = config.basicAuth || (() => {
      const username = import.meta.env.VITE_API_BASIC_AUTH_USERNAME;
      const password = import.meta.env.VITE_API_BASIC_AUTH_PASSWORD;
      const authString = import.meta.env.VITE_API_BASIC_AUTH;
      if (authString) return { authString };
      if (username && password) return { username, password };
      return undefined;
    })();
    
    if (!basicAuth) return undefined;
    
    if (basicAuth.authString) {
      return `Basic ${basicAuth.authString}`;
    }
    
    if (basicAuth.username && basicAuth.password) {
      const credentials = `${basicAuth.username}:${basicAuth.password}`;
      const encoded = btoa(credentials);
      return `Basic ${encoded}`;
    }
    
    return undefined;
  };

  // Initialize legislator queries
  const legislatorQueries = createLegislatorQueries({ apiClient });

  // Load conversations on mount
  const { data: conversationsData, refetch: refetchConversations, isLoading: isLoadingConversations } = legislatorQueries.useConversations({ // Used in Sidebar component
    limit: 50,
    sort_by: 'updated_at',
  });

  // Load messages for current conversation
  const { data: messagesData, refetch: refetchMessages, isLoading: isLoadingMessagesFromQuery } = legislatorQueries.useMessages(
    currentConversationId || '',
    { limit: 100 }
  );
  
  // Combine query loading state with manual loading state
  const isLoadingMessagesCombined = isLoadingMessagesFromQuery || isLoadingMessages;

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
      
      setCurrentConversationId(conversationId);
      setConversationIdInUrl(conversationId);
      // Messages will be loaded automatically via the useMessages hook when currentConversationId changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData?.conversations?.length, currentConversationId]);

  // Update messages when loaded
  useEffect(() => {
    // Clear pending message if it belongs to a different conversation
    if (pendingLetterResponseRef.current && pendingLetterResponseRef.current.conversationId !== currentConversationId) {
      pendingLetterResponseRef.current = null;
    }
    
    const timeSinceLastPending = Date.now() - lastPendingMessageTimestampRef.current;
    
    // Skip if we just added a pending message (within last 2 seconds) to prevent immediate overwrite
    // Increased from 500ms to 2 seconds to give more time for the message to be set
    if (timeSinceLastPending < 2000 && pendingLetterResponseRef.current && pendingLetterResponseRef.current.conversationId === currentConversationId) {
      return;
    }
    
    if (messagesData?.messages && currentConversationId) {
      const loadedMessages = messagesData.messages;
      
      // If we have a pending letter_response message that was just added locally,
      // merge it with loaded messages instead of replacing
      // Only merge if it belongs to the current conversation
      if (pendingLetterResponseRef.current && pendingLetterResponseRef.current.conversationId === currentConversationId) {
        const pending = pendingLetterResponseRef.current;
        const timeSinceAdded = Date.now() - pending.timestamp;
        
        // Check if the pending message is already in loaded messages
        // Use a more lenient check - check if content matches (first 100 chars) and role
        const isInLoadedMessages = loadedMessages.some((msg) => {
          const pendingContentStart = pending.message.content.substring(0, 100);
          const msgContentStart = (msg.content || '').substring(0, 100);
          return msgContentStart === pendingContentStart && msg.role === pending.message.role;
        });
        
        // If message is not in backend yet and it's been less than 30 seconds, keep it
        // Increased timeout to 30 seconds to give backend more time
        if (!isInLoadedMessages && timeSinceAdded < 30000) {
          // Always merge: add pending message at the end if it's not already in loaded messages
          // Use functional update to ensure we're working with latest state
          setMessages((prev) => {
            // Check if pending message is already in prev (to avoid duplicates)
            const alreadyInPrev = prev.some((msg) => {
              const pendingContentStart = pending.message.content.substring(0, 100);
              const msgContentStart = (msg.content || '').substring(0, 100);
              return msgContentStart === pendingContentStart && msg.role === pending.message.role;
            });
            
            if (alreadyInPrev) {
              // Message is already in state, merge loaded messages with current state
              // This ensures we keep the pending message even if it's in prev
              const merged = [...loadedMessages];
              // Only add pending if it's not already in loadedMessages
              if (!loadedMessages.some((msg) => {
                const pendingContentStart = pending.message.content.substring(0, 100);
                const msgContentStart = (msg.content || '').substring(0, 100);
                return msgContentStart === pendingContentStart && msg.role === pending.message.role;
              })) {
                merged.push(pending.message);
              }
              return merged;
            }
            
            // Merge loaded messages with pending message
            return [...loadedMessages, pending.message];
          });
        } else {
          // Message is now in backend or timeout, use loaded messages
          setMessages(loadedMessages);
          if (isInLoadedMessages || timeSinceAdded >= 30000) {
            pendingLetterResponseRef.current = null;
          }
        }
      } else {
        setMessages(loadedMessages);
      }
      
      setIsLoadingMessages(false); // Clear loading state when messages are loaded
      // Show welcome screen if conversation is empty
      if (loadedMessages.length === 0 && !pendingLetterResponseRef.current) {
        setShowWelcome(true);
      } else {
        setShowWelcome(false);
      }
    } else if (currentConversationId && messagesData?.messages && messagesData.messages.length === 0) {
      // Conversation exists but has no messages
      // Keep pending message if it exists and belongs to this conversation
      if (pendingLetterResponseRef.current && pendingLetterResponseRef.current.conversationId === currentConversationId) {
        const pending = pendingLetterResponseRef.current;
        setMessages((prev) => {
          // If we already have the pending message in state, keep it
          const hasPending = prev.some((msg) => {
            const pendingContentStart = pending.message.content.substring(0, 100);
            const msgContentStart = (msg.content || '').substring(0, 100);
            return msgContentStart === pendingContentStart && msg.role === pending.message.role;
          });
          return hasPending ? prev : [pending.message];
        });
        setShowWelcome(false);
      } else {
        setMessages([]);
        setShowWelcome(true);
      }
      setIsLoadingMessages(false); // Clear loading state
    }
  }, [messagesData, currentConversationId]);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    // Clear pending message when switching conversations
    if (pendingLetterResponseRef.current && pendingLetterResponseRef.current.conversationId !== conversationId) {
      pendingLetterResponseRef.current = null;
    }
    
    setCurrentConversationId(conversationId);
    setMessages([]); // Clear messages while loading
    setIsLoadingMessages(true); // Show skeletons immediately
    // Update URL search params
    setConversationIdInUrl(conversationId);
    refetchMessages().finally(() => {
      setIsLoadingMessages(false);
    });
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    try {
      setIsCreatingConversation(true);
      const result = await createConversation.mutateAsync({ name: 'محادثة جديدة' });
      setCurrentConversationId(result.conversation_id);
      setMessages([]);
      setShowWelcome(true); // Show welcome screen for new empty conversation
      // Update URL search params
      setConversationIdInUrl(result.conversation_id);
      refetchConversations();
    } catch (error) {
      // Failed to create conversation
    } finally {
      setIsCreatingConversation(false);
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
    
    return conversationId;
  };

  const handleSendMessage = async (content: string, file?: File, audioFile?: File, letterResponse?: boolean) => {
    // CRITICAL: Capture file IMMEDIATELY at the very start, before ANY other code
    // This ensures the file is preserved even if there are async operations or state updates
    const fileToUse = (file instanceof File) ? file : undefined;
    const audioFileToUse = (audioFile instanceof File) ? audioFile : undefined;
    const letterResponseToUse = letterResponse === true;
    
    // CRITICAL: Get or create conversation FIRST and wait for it to complete
    // This ensures the conversation exists before we try to send the message
    const conversationId = await getOrCreateConversation();
    
    // Verify conversation ID is valid
    if (!conversationId) {
      return;
    }
    
    // Hide welcome screen after conversation is ready
    setShowWelcome(false);

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
    const isLetterResponseValue = letterResponse === true;
    currentLetterResponseRef.current = isLetterResponseValue; // Capture in ref for event handler
    
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

    // Handle streaming events
    let accumulatedContent = '';
    let accumulatedThinking = '';
    let finalMetadata: StreamEvent['metadata'] = undefined;
    let finalDocuments: StreamEvent['sources_documents'] = [];
    let finalQuestions: string[] = [];
    
    // Capture conversationId for use in closures
    const currentConvId = conversationId;
    
    // Reset the refs for this stream
    streamingContentRef.current = '';
    thinkingContentRef.current = '';
    setThinkingContent('');

    try {
      const controller = await legislatorQueries.sendStreamingMessage(conversationId, request, {
        onEvent: (event: StreamEvent) => {
          // Handle letter response processing events
          if (currentLetterResponseRef.current) {
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
              // Handle thinking events (reasoning process)
              if (event.chunk) {
                accumulatedThinking += event.chunk;
                thinkingContentRef.current = accumulatedThinking;
                setThinkingContent(accumulatedThinking);
              }
              break;

            case 'content_chunk':
              if (event.chunk) {
                accumulatedContent += event.chunk;
                // Remove "markdown" prefix if it appears at the start (case-insensitive)
                let cleanedContent = accumulatedContent;
                if (cleanedContent.toLowerCase().startsWith('markdown')) {
                  cleanedContent = cleanedContent.replace(/^markdown\s*/i, '');
                }
                streamingContentRef.current = cleanedContent;
                setStreamingContent(cleanedContent);
                // Update accumulatedContent to the cleaned version
                accumulatedContent = cleanedContent;
              }
              break;

            case 'completed':
              // The completed event contains the full content and metadata
              if (event.content) {
                // Remove "markdown" prefix if present (case-insensitive)
                let cleanedContent = event.content.replace(/^markdown\s*/i, '').trim();
                accumulatedContent = cleanedContent;
                streamingContentRef.current = cleanedContent;
                setStreamingContent(cleanedContent);
              }
              finalMetadata = event.metadata;
              finalDocuments = event.sources_documents || [];
              finalQuestions = event.related_questions || [];
              break;

            case 'done':
              // Stream is complete, create assistant message
              // CRITICAL: Get the final content from multiple sources to ensure we capture it
              // Use the ref first (most up-to-date), then state, then accumulated
              let finalContent = streamingContentRef.current || accumulatedContent;
              
              // Remove "markdown" prefix if present (case-insensitive)
              if (finalContent) {
                // Remove "markdown" from the beginning (case-insensitive, with optional whitespace)
                finalContent = finalContent.replace(/^markdown\s*/i, '').trim();
              }
              
              // Use tool_used from done event if available, otherwise from metadata
              // Clear processing steps when done
              // Use ref instead of state to avoid closure issues
              const isLetterResponseValue = currentLetterResponseRef.current;
              
              if (isLetterResponseValue) {
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
                
                // For letter_response, track the pending message to prevent it from being overwritten
                if (isLetterResponseValue) {
                  const now = Date.now();
                  pendingLetterResponseRef.current = {
                    message: assistantMessage,
                    timestamp: now,
                    conversationId: conversationId, // Track which conversation this belongs to
                  };
                  lastPendingMessageTimestampRef.current = now;
                  
                  // For letter_response, don't invalidate queries at all initially
                  // Only refetch manually after a longer delay to check if backend saved it
                  // This gives the backend more time to save the message
                  setTimeout(() => {
                    // Manually refetch messages to check if backend has saved it
                    refetchMessages().then(() => {
                      // After refetch, check if message is now in backend
                      // The useEffect will handle merging
                      setTimeout(() => {
                        // If still pending after 5 more seconds, invalidate to force update
                        if (pendingLetterResponseRef.current) {
                          queryClient.invalidateQueries({
                            queryKey: ['legislator', 'conversations', conversationId, 'messages'],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ['legislator', 'conversations'],
                          });
                        }
                      }, 5000);
                    });
                  }, 5000); // Increased from 3000 to 5000 to give backend more time
                } else {
                  // For regular messages, invalidate immediately
                  queryClient.invalidateQueries({
                    queryKey: ['legislator', 'conversations', conversationId, 'messages'],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ['legislator', 'conversations'],
                  });
                }
              }
              
              setIsLoading(false);
              // Clear streaming content and processing state after a brief delay
              // This ensures the message is rendered before clearing
              // Keep thinking content - it persists until a new message starts
              // For letter_response, delay clearing to ensure message is visible
              const clearDelay = isLetterResponseValue ? 2500 : 300;
              setTimeout(() => {
                setStreamingContent('');
                currentLetterResponseRef.current = false; // Clear ref too
                setProcessingSteps([]);
                // Don't clear thinking content - let it persist for user to review
                // Clear pending ref after a longer delay to allow backend to save
                if (isLetterResponseValue) {
                  setTimeout(() => {
                    pendingLetterResponseRef.current = null;
                  }, 3000);
                }
              }, clearDelay);
              break;

            case 'error':
              setIsLoading(false);
              setStreamingContent('');
              // Keep thinking content even on error - user might want to see it
              break;
          }
        },
        onError: () => {
          setIsLoading(false);
          setStreamingContent('');
          // Keep thinking content even on error
        },
        onClose: () => {
          setIsLoading(false);
          setStreamingContent('');
          // Keep thinking content when stream closes - it persists
          
          // If stream closes without done event and we have content, create message manually
          if (currentLetterResponseRef.current && streamingContentRef.current && !pendingLetterResponseRef.current) {
            const finalContent = streamingContentRef.current.replace(/^markdown\s*/i, '').trim();
            if (finalContent) {
              const assistantMessage: LegislatorMessage = {
                role: 'assistant',
                content: finalContent,
                response_metadata: finalMetadata,
                sources_documents: finalDocuments,
                related_questions: finalQuestions,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              
              const now = Date.now();
              pendingLetterResponseRef.current = {
                message: assistantMessage,
                timestamp: now,
                conversationId: currentConvId,
              };
              lastPendingMessageTimestampRef.current = now;
            }
          }
        },
      });

      streamControllerRef.current = controller;
    } catch (error) {
      setIsLoading(false);
      setStreamingContent('');
      // Keep thinking content even on error - user might want to see it
    }
  };

  const handleQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleDocumentDownload = (doc: DocumentReference) => {
    if (!doc.dmsdocid_1) {
      return;
    }
    
    // Get base URL from config or API client
    const baseURL = config.apiBaseUrl || import.meta.env.VITE_SANAD_API_BASE_URL || '';
    const downloadUrl = `${baseURL}/pdf-viewer/view/${doc.dmsdocid_1}?download=true`;
    
    const authHeader = getAuthHeader();
    
    // Create a temporary anchor element to trigger download
    const link = window.document.createElement('a');
    link.download = doc.file_name || 'document.pdf';
    
    // Use fetch with auth header to download the file
    if (authHeader) {
      fetch(downloadUrl, {
        headers: {
          'Authorization': authHeader,
        },
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to download');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          link.href = url;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch(() => {
          // Fallback: try direct link (may not work with auth)
          link.href = downloadUrl;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
        });
    } else {
      // No auth, use direct link
      link.href = downloadUrl;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleDocumentView = (doc: DocumentReference) => {
    if (!doc.dmsdocid_1) {
      return;
    }
    
    // Clean up previous blob URL if exists
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    
    const baseURL = config.apiBaseUrl || import.meta.env.VITE_SANAD_API_BASE_URL || '';
    const viewUrl = `${baseURL}/pdf-viewer/view/${doc.dmsdocid_1}?download=false`;
    const authHeader = getAuthHeader();
    
    // Fetch PDF with auth and create blob URL for iframe
    if (authHeader) {
      fetch(viewUrl, {
        headers: {
          'Authorization': authHeader,
        },
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to load PDF');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
          setViewingDocument(doc);
        })
        .catch(() => {
          // Fallback: try without auth (may not work)
          setPdfBlobUrl(viewUrl);
          setViewingDocument(doc);
        });
    } else {
      // No auth, use direct URL
      setPdfBlobUrl(viewUrl);
      setViewingDocument(doc);
    }
  };

  return (
    <AppLayout
      conversations={conversationsData?.conversations || []}
      currentConversationId={currentConversationId}
      isLoadingConversations={isLoadingConversations}
      isCreatingConversation={isCreatingConversation}
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
          // Failed to delete conversation
        }
      }}
      onUpdateConversation={async (id, name) => {
        try {
          await updateConversation.mutateAsync({ conversation_id: id, name });
          refetchConversations();
        } catch (error) {
          // Failed to update conversation
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
            isLoadingMessages={isLoadingMessagesCombined}
            streamingContent={streamingContent}
            thinkingContent={thinkingContent}
            processingSteps={processingSteps}
            onSendMessage={handleSendMessage}
            onQuestionClick={handleQuestionClick}
            onDocumentDownload={handleDocumentDownload}
            onDocumentView={handleDocumentView}
          />
        )}
      </div>
      
      {/* PDF Viewer Modal */}
      {viewingDocument && viewingDocument.dmsdocid_1 && pdfBlobUrl && (
        <Dialog 
          open={!!viewingDocument} 
          onOpenChange={(open) => {
            if (!open) {
              // Clean up blob URL when closing
              if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
                window.URL.revokeObjectURL(pdfBlobUrl);
              }
              setPdfBlobUrl(null);
              setViewingDocument(null);
            }
          }}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 flex flex-col translate-x-[-50%] translate-y-[-50%]">
            <div className="flex-1 w-full h-full min-h-0">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-0 rounded-lg"
                title={viewingDocument.file_name || 'PDF Viewer'}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
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
