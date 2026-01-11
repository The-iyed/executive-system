import { useQuery } from '@tanstack/react-query';
import { documentSplitterClient } from '../utils/api-client';
import type { ExtractionResult, Split } from './use-cases';

export interface ConversationSplitsError {
  message: string;
}

export interface ConversationSplitsApiResponse {
  conversation_id: string;
  splits: Split[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Interface for win_loss_reason_content_type in analyze response
 */
export interface WinLossReasonContentType {
  classification?: string;
  sub_classification?: string;
}

/**
 * Interface for agent response in the detailed result
 */
export interface AgentResponse {
  result?: string;
  reasoning?: string;
  // Analyze API response fields
  win_loss_reason_content_type?: WinLossReasonContentType;
  main_classification_win_loss_reason?: string;
  sub_reason_win_loss?: string;
  root_cause_win_loss?: string;
  actual_description_root_cause?: string;
  workflow_steps_description?: string;
  proposed_solution_description?: string;
  proposed_solution_sub_classification?: string;
  proposed_solution_main_classification?: string;
  // Case details API response fields
  case_classification?: string;
  case_subject?: string;
  case_value?: string;
  actual_financial_impact?: string;
}

/**
 * Interface for the analyze API response from /analyze/{rulings_extraction_id}
 */
export interface AnalyzeResponse {
  id?: string;
  agent_response?: AgentResponse;
}

/**
 * Interface for the case-details API response from /case-details/{rulings_extraction_id}
 */
export interface CaseDetailsResponse {
  id?: string;
  agent_response?: AgentResponse;
}

/**
 * Interface for the detailed result response from /result/{rulings_extraction_id}
 * Updated to include new structure with agent_response
 */
export interface SplitResultResponse {
  id?: string;
  result?: string;
  agent_response?: AgentResponse;
  // Legacy fields for backward compatibility
  _id?: string;
  batch_id?: string;
  conversation_id?: string;
  user_id?: string;
  results?: ExtractionResult[];
  total_documents?: number;
  successful?: number;
  failed?: number;
  processing_timestamp?: string;
  created_at?: string;
}

/**
 * Response structure that includes both results and split metadata
 */
export interface ConversationSplitsData {
  results: ExtractionResult[];
  splitMetadata: Map<string, {
    id?: string;
    result?: string;
    agent_response?: AgentResponse;
  }>;
}

/**
 * Hook for fetching all splits (documents) for a single conversation
 * Returns a flat list of all split results linked to the conversation ID
 * 
 * @param conversationId - The conversation ID to fetch splits for
 * @param enabled - Whether the query should be enabled (default: true)
 * 
 * @example
 * ```tsx
 * const { data: splits, isLoading, error, total } = useConversationSplits(conversationId);
 * ```
 */
export const useConversationSplits = (
  conversationId: string | null | undefined,
  enabled: boolean = true
) => {
  return useQuery<ExtractionResult[] & { _splitMetadata?: Map<string, { id?: string; result?: string; agent_response?: AgentResponse }> }, ConversationSplitsError>({
    queryKey: ['conversation-splits', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      // Step 1: Get the splits list
      const splitsResponse = await documentSplitterClient.get<ConversationSplitsApiResponse>(
        `/conversation/${conversationId}/splits`
      );

      if (!splitsResponse.data.splits || !Array.isArray(splitsResponse.data.splits) || splitsResponse.data.splits.length === 0) {
        return [];
      }

      // Step 2: For each split, fetch detailed results and analyze response using split._id as rulings_extraction_id
      const detailedResultsPromises = splitsResponse.data.splits
        .filter((split) => split._id) // Only process splits that have an _id
        .map(async (split) => {
          try {
            // Use split._id as rulings_extraction_id to fetch detailed results
            const resultResponse = await documentSplitterClient.get<SplitResultResponse>(
              `/result/${split._id}`
            );
            
            // Fetch analyze response using the same split._id
            let analyzeResponse: AnalyzeResponse | null = null;
            try {
              const analyzeResponseData = await documentSplitterClient.get<AnalyzeResponse>(
                `/analyze/${split._id}`
              );
              analyzeResponse = analyzeResponseData.data;
            } catch (analyzeError) {
              console.warn(`Error fetching analyze response for split ${split._id}:`, analyzeError);
              // Continue without analyze response if it fails
            }
            
            // Fetch case-details response using the same split._id
            let caseDetailsResponse: CaseDetailsResponse | null = null;
            try {
              const caseDetailsResponseData = await documentSplitterClient.get<CaseDetailsResponse>(
                `/case-details/${split._id}`
              );
              caseDetailsResponse = caseDetailsResponseData.data;
            } catch (caseDetailsError) {
              console.warn(`Error fetching case-details response for split ${split._id}:`, caseDetailsError);
              // Continue without case-details response if it fails
            }
            
            const splitData = resultResponse.data;
            const results = splitData?.results || split.results || [];
            
            // Merge agent_response from result, analyze, and case-details responses
            const mergedAgentResponse: AgentResponse = {
              ...splitData?.agent_response,
              ...analyzeResponse?.agent_response,
              ...caseDetailsResponse?.agent_response,
            };
            
            // Attach split-level metadata (agent_response, result, id) to each result
            const resultsWithMetadata: ExtractionResult[] = results.map((result) => ({
              ...result,
              // Store split metadata in a way that can be accessed later
            }));
            
            return {
              results: resultsWithMetadata,
              splitMetadata: {
                id: splitData?.id || splitData?._id || split._id,
                result: splitData?.result,
                agent_response: mergedAgentResponse,
              },
            };
          } catch (error) {
            console.error(`Error fetching result for split ${split._id}:`, error);
            // Fallback to results from splits response if detailed fetch fails
            return {
              results: split.results || [],
              splitMetadata: {
                id: split._id,
                result: undefined,
                agent_response: undefined,
              },
            };
          }
        });

      // Step 3: Wait for all detailed results
      const allDetailedData = await Promise.all(detailedResultsPromises);
      
      // Step 4: Flatten results and create metadata map
      const flattenedResults: ExtractionResult[] = [];
      const splitMetadataMap = new Map<string, { id?: string; result?: string; agent_response?: AgentResponse }>();
      
      allDetailedData.forEach(({ results, splitMetadata }) => {
        // Store metadata by split id (most reliable key)
        const splitId = splitMetadata.id || '';
        if (splitId && splitMetadata.agent_response) {
          splitMetadataMap.set(splitId, {
            id: splitMetadata.id,
            result: splitMetadata.result,
            agent_response: splitMetadata.agent_response,
          });
        }
        
        // Store results and also index metadata by split_id for lookup
        results.forEach((result) => {
          // Also store metadata by split_id if it matches the split's id
          if (result.split_id && result.split_id === splitId && !splitMetadataMap.has(result.split_id)) {
            splitMetadataMap.set(result.split_id, {
              id: splitMetadata.id,
              result: splitMetadata.result,
              agent_response: splitMetadata.agent_response,
            });
          }
          flattenedResults.push(result);
        });
      });

      // Attach metadata map to the results array (TypeScript workaround)
      (flattenedResults as any)._splitMetadata = splitMetadataMap;
      
      return flattenedResults;
    },
    enabled: enabled && !!conversationId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};
