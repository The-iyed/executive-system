import { useMutation } from '@tanstack/react-query';
import { documentSplitterClient, conversationClient } from '../utils/api-client';
import { getBrowserId } from '../utils/browser-id';

export interface CreateConversationResponse {
  conversation_id: string;
  name?: string;
  // Add other fields as needed based on API response
}

export interface DocumentSplitterResponse {
  // Define the response type based on your API
  // This is a placeholder - update based on actual API response
  success: boolean;
  data?: unknown;
  message?: string;
  conversation_id?: string;
}

export interface DocumentSplitterError {
  message: string;
  // Add other error fields as needed
}

/**
 * Hook for uploading and splitting PDF documents
 * Creates a conversation first, then uploads files with conversation_id and user_id
 */
export const useDocumentSplitter = () => {
  return useMutation<DocumentSplitterResponse, DocumentSplitterError, File[]>({
    mutationFn: async (files: File[]) => {
      const userId = getBrowserId();
      // Step 1: Create a new conversation
      const conversationResponse = await conversationClient.post<CreateConversationResponse>(
        '/conversations',
        {
          name: 'Consultation for Case 6095',
          user_id: userId,
        }
      );

      const conversationId = conversationResponse.data.conversation_id;

      // Step 2: Create FormData with files
      const formData = new FormData();
      
      // Append all files to FormData
      files.forEach((file) => {
        formData.append(`files`, file);
      });

      // Step 3: Upload files with conversation_id and user_id as query parameters
      // Note: Don't set Content-Type header manually - axios will set it automatically with boundary
      const response = await documentSplitterClient.post<DocumentSplitterResponse>(
        '/split',
        formData,
        {
          params: {
            conversation_id: conversationId,
            user_id: userId,
          },
        }
      );

      // Include conversation_id in the response
      return {
        ...response.data,
        conversation_id: conversationId,
      };
    },
  });
};
