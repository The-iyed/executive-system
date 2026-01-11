import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { documentSplitterClient } from '../utils/api-client';
import { getBrowserId } from '../utils/browser-id';

export interface CasesQueryParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: -1 | 1;
  search?: string;
}

// API Response Types
export interface ExtractedPart {
  part_1_case_info: string | null;
  part_2_court_composition: string | null;
  part_3_session_details: string | null;
  part_4_facts: string | null;
  part_5_reasons: string | null;
  part_6_verdict: string | null;
}

export interface Hukm1Fields {
  case_registration_date_1: string | null;
  // Add other hukm_1_fields as needed
}

export interface ExtractionResult {
  split_id: string;
  pdf_filename: string;
  extracted_parts: ExtractedPart;
  hukm_1_fields?: Hukm1Fields;
  extraction_timestamp: string;
  status: 'failed' | 'partial' | 'completed' | 'processing';
  error_message: string | null;
  raw_text_length: number | null;
  raw_text: string | null;
  document_category: string | null;
  created_at: string;
}

export interface Split {
  _id?: string;
  batch_id?: string;
  conversation_id?: string;
  user_id?: string;
  results: ExtractionResult[];
  total_documents?: number;
  successful?: number;
  failed?: number;
  processing_timestamp?: string;
  created_at?: string;
}

export interface Conversation {
  _id?: string;
  name?: string;
  thread_id?: string;
  user_id?: string;
  vector_store_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  last_message_at?: string | null;
  pool_assigned_at?: string;
  conversation_id?: string;
}

export interface ConversationSummaryItem {
  // New structure
  conversation?: Conversation;
  splits: Split[];
  splits_count?: number;
  // Legacy structure (for backward compatibility)
  _id?: string;
  conversation_id?: string;
}

export interface CasesApiResponse {
  user_id?: string;
  conversations_summary?: ConversationSummaryItem[];
  total_conversations?: number;
  limit?: number;
  offset?: number;
  // Legacy structures for backward compatibility
  items?: ConversationSummaryItem[];
  total?: number;
  skip?: number;
  documents?: any[];
}

// UI Types
export interface CaseItem {
  id: string;
  title: string;
  description: string;
  status: 'analyzing' | 'completed';
  documents: Array<{
    name: string;
    size: string;
  }>;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  conversation_id: string;
}

export interface CasesResponse {
  data: CaseItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface CasesError {
  message: string;
}

/**
 * Format file size from bytes to readable format
 */
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'غير معروف';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Truncate text to a maximum length
 */
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate case title from PDF filename or batch ID
 */
const generateTitle = (pdfFilename: string | undefined, batchId: string): string => {
  if (pdfFilename) {
    return pdfFilename.replace(/\.pdf$/i, '').trim() || `دفعة ${batchId.slice(0, 8)}`;
  }
  return `دفعة ${batchId.slice(0, 8)}`;
};

/**
 * Generate case description from extracted parts
 */
const generateDescription = (
  extractedParts: ExtractedPart | undefined,
  totalDocuments: number,
  successful: number,
  failed: number
): string => {
  if (!extractedParts) {
    return `عدد المستندات: ${totalDocuments} | نجح: ${successful} | فشل: ${failed}`;
  }

  // Priority: case_info > facts > verdict
  if (extractedParts.part_1_case_info) {
    return truncateText(extractedParts.part_1_case_info, 100);
  }

  if (extractedParts.part_4_facts) {
    return truncateText(extractedParts.part_4_facts, 100);
  }

  if (extractedParts.part_6_verdict) {
    return truncateText(`الحكم: ${extractedParts.part_6_verdict}`, 100);
  }

  return `عدد المستندات: ${totalDocuments} | نجح: ${successful} | فشل: ${failed}`;
};

/**
 * Determine case status from results
 */
// const determineStatus = (results: ExtractionResult[]): 'analyzing' | 'completed' => {
//   if (results.length === 0) return 'completed';
  
//   const hasProcessing = results.some((r) => r.status === 'processing');
//   if (hasProcessing) return 'analyzing';

//   const allCompleted = results.every(
//     (r) => r.status === 'completed' || r.status === 'partial' || r.status === 'failed'
//   );
  
//   return allCompleted ? 'completed' : 'analyzing';
// };

// /**
//  * Calculate progress percentage
//  */
// const calculateProgress = (successful: number, total: number): number => {
//   if (total === 0) return 0;
//   return Math.round((successful / total) * 100);
// };

/**
 * Map API response to UI format
 * Handles new structure: conversations_summary[].conversation.conversation_id
 * Title: splits[0].results[0].hukm_1_fields.case_registration_date_1
 * Description: splits[0].results[0].extracted_parts.part_1_case_info
 */
const mapApiResponseToCases = (apiResponse: CasesApiResponse): CasesResponse => {
  // Handle new conversations_summary structure
  if (apiResponse.conversations_summary && Array.isArray(apiResponse.conversations_summary)) {
    const mappedCases: CaseItem[] = apiResponse.conversations_summary.map((item) => {
      // Get conversation_id from conversation object
      const conversationId = item.conversation?.conversation_id || 
                            item.conversation?._id || 
                            '';

      // Get first split and first result
      const firstSplit = item.splits?.[0];
      const firstResult = firstSplit?.results?.[0];

      // Map title from case_registration_date_1 (Registration Date)
      const title = firstResult?.hukm_1_fields?.case_registration_date_1 || 
                    firstResult?.pdf_filename?.replace(/\.pdf$/i, '') || 
                    conversationId || 
                    'قضية غير معروفة';

      // Map description from part_1_case_info
      const description = firstResult?.extracted_parts?.part_1_case_info || 
                          'لا يوجد وصف متاح';

      // Map all results from first split to documents array
      const documents = firstSplit?.results?.map((result: ExtractionResult) => ({
        name: result.pdf_filename || 'مستند غير معروف',
        size: formatFileSize(result.raw_text_length),
      })) || [];

      return {
        id: item.conversation?._id || conversationId,
        title: truncateText(title, 100),
        description: truncateText(description, 100),
        status: 'completed' as const,
        documents,
        conversation_id: conversationId,
        created_at: firstResult?.created_at || item.conversation?.created_at,
        updated_at: firstResult?.extraction_timestamp || item.conversation?.updated_at,
      };
    });

    return {
      data: mappedCases,
      total: apiResponse.total_conversations ?? mappedCases.length,
      skip: apiResponse.offset ?? 0,
      limit: apiResponse.limit ?? 3,
    };
  }

  // Handle legacy items structure
  if (apiResponse.items && Array.isArray(apiResponse.items)) {
    const mappedCases: CaseItem[] = apiResponse.items.map((item) => {
      // Get conversation_id from either new or legacy structure
      const conversationId = item.conversation?.conversation_id || 
                            item.conversation?._id || 
                            item.conversation_id || 
                            '';

      // Get first split and first result
      const firstSplit = item.splits?.[0];
      const firstResult = firstSplit?.results?.[0];

      // Map title from case_registration_date_1
      const title = firstResult?.hukm_1_fields?.case_registration_date_1 || 
                    firstResult?.pdf_filename?.replace(/\.pdf$/i, '') || 
                    conversationId || 
                    'قضية غير معروفة';

      // Map description from part_1_case_info
      const description = firstResult?.extracted_parts?.part_1_case_info || 
                          'لا يوجد وصف متاح';

      // Map results to documents array
      const documents = firstSplit?.results?.map((result: ExtractionResult) => ({
        name: result.pdf_filename || 'مستند غير معروف',
        size: formatFileSize(result.raw_text_length),
      })) || [];

      return {
        id: item.conversation?._id || item._id || conversationId,
        title: truncateText(title, 100),
        description: truncateText(description, 100),
        status: 'completed' as const,
        documents,
        conversation_id: conversationId,
        created_at: firstResult?.created_at || item.conversation?.created_at,
        updated_at: firstResult?.extraction_timestamp || item.conversation?.updated_at,
      };
    });

    return {
      data: mappedCases,
      total: apiResponse.total ?? mappedCases.length,
      skip: apiResponse.skip ?? 0,
      limit: apiResponse.limit ?? 3,
    };
  }

  // Fallback to old structure for backward compatibility
  if (apiResponse.documents && Array.isArray(apiResponse.documents)) {
    const mappedCases: CaseItem[] = apiResponse.documents.map((doc) => {
      const firstResult = doc.results[0];

      const title = generateTitle(firstResult?.pdf_filename, doc.batch_id);
      const description = generateDescription(
        firstResult?.extracted_parts,
        doc.total_documents,
        doc.successful,
        doc.failed
      );

      const documents = doc.results.map((result: ExtractionResult) => ({
        name: result.pdf_filename,
        size: formatFileSize(result.raw_text_length),
      }));

      return {
        id: doc._id,
        title,
        description,
        status: 'completed' as const,
        documents,
        conversation_id: doc.conversation_id,
      };
    });

    return {
      data: mappedCases,
      total: (apiResponse.total ?? 0) as number,
      skip: (apiResponse.skip ?? 0) as number,
      limit: (apiResponse.limit ?? 3) as number,
    };
  }

  // Return empty response if structure doesn't match
  return {
    data: [],
    total: 0,
    skip: 0,
    limit: 3,
  };
};

/**
 * Hook for fetching and managing cases list with pagination and backend search
 */
export const useCases = (params: CasesQueryParams = {}) => {
  const {
    skip = 0,
    limit = 3,
    sort_by = 'created_at',
    sort_order = -1,
    search = '',
  } = params;

  // Build query params for API
  const apiParams = useMemo(() => {
    const queryParams: Record<string, string | number> = {
      skip,
      limit,
      sort_by,
      sort_order,
    };

    // Add search parameter if provided
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }

    return queryParams;
  }, [skip, limit, sort_by, sort_order, search]);

  // Get browser ID for user_id
  const userId = useMemo(() => getBrowserId(), []);

  // Fetch cases from API with backend search
  const queryResult = useQuery<CasesResponse, CasesError>({
    queryKey: ['cases', userId, apiParams],
    queryFn: async () => {
      const response = await documentSplitterClient.get<CasesApiResponse>(
        `/conversations-summary/${userId}`,
        {
          params: apiParams,
        }
      );

      // Map API response to UI format
      return mapApiResponseToCases(response.data);
    },
    placeholderData: keepPreviousData,
    enabled: !!userId, // Only fetch if userId is available
  });

  // Calculate pagination info
  const pagination = useMemo(() => {
    const data = queryResult.data as CasesResponse | undefined;
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(skip / limit) + 1;

    return {
      total,
      totalPages: totalPages || 1,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [queryResult.data, limit, skip]);

  const data = queryResult.data as CasesResponse | undefined;

  return {
    ...queryResult,
    cases: data?.data ?? [],
    pagination,
  };
};