// API types for legislator chat (ported from super-agent-v1)

/** Chat mode / suggestion type aligned with API tools (normale, deep_search, letter_response, etc.) */
export type ChatMode =
  | "normal"
  | "deepSearch"
  | "webSearch"
  | "letters"
  | "documentsAnalyzer"
  | "stats"
  | "benchmarking";

export interface Conversation {
  conversation_id: string;
  name: string;
  thread_id: string | null;
  user_id?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface ConversationsParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  user_id?: string;
  search?: string;
}

export interface CreateConversationRequest {
  name: string;
  user_id?: string;
}

export interface CreateConversationResponse {
  conversation_id: string;
  name: string;
  thread_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface UpdateConversationRequest {
  name: string;
}

export interface TranscribeRequest {
  audio_file: File;
  lang?: string;
}

export interface TranscribeResponse {
  transcript: string;
}

export interface IsicChoicePayload {
  options: string[];
  ISIC_IDs: string[];
  user_search_term: string;
  MASTER_ACTIVITY_NAME: string;
}

export interface SendMessageRequest {
  query?: string;
  letter_response?: boolean;
  document_analyzer?: boolean;
  web_search?: boolean;
  deep_search?: boolean;
  stats?: boolean;
  benchmarking?: boolean;
  file?: File;
  files?: File[];
  audio_file?: File;
  language?: string;
  lang?: string;
  debug?: boolean;
  isic_user_choice?: string[] | "all";
  document_ids?: Map<string, string>;
  tag?: string;
}

export interface DocumentWithId {
  name: string;
  id?: string;
  url?: string;
  tool_used?: string;
}

export interface MessageResponse {
  response: string;
  related: string | null;
  tool_used: string;
  sources_documents: string[];
  documents?: DocumentWithId[];
  related_questions: string[];
  conversation_id: string;
  thread_id: string;
  agent_run_id: string;
  processing_time_seconds: number;
  is_new_thread: boolean;
  debug_info: unknown | null;
  has_chart_data?: boolean;
}

export type BlockType = "thinking" | "content";

export interface MessageBlock {
  id: string;
  type: BlockType;
  text: string;
  isComplete: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isSent: boolean;
  response?: MessageResponse;
  timestamp: Date;
  streamingContent?: string;
  isStreaming?: boolean;
  isPendingRequest?: boolean;
  isThinking?: boolean;
  thinkingText?: string;
  isThinkingCompleted?: boolean;
  isicChoice?: IsicChoicePayload;
  blocks?: MessageBlock[];
  files?: File[];
  hasError?: boolean;
  errorMessage?: string;
  retryData?: {
    messageText: string;
    files: File[];
    selectedSuggestion?: string | null;
    sentMessageId?: string;
  };
}

export type StreamingEventType =
  | "message_posted"
  | "run_created"
  | "content_chunk"
  | "processing_tools"
  | "submitting_tools"
  | "completed"
  | "done"
  | "error"
  | "thinking"
  | "thinking_chunk"
  | "iteration_start"
  | "iteration_complete"
  | "synthesis_chunk"
  | "summary_chunk"
  | "query_result"
  | "context"
  | "chunk"
  | "control"
  | "sql_query"
  | "isic_choice_required"
  | "title_generated"
  | "pdf_uploaded"
  | "uploading_pdf"
  | "pdf_analyzed";

export interface StreamingEvent {
  event: StreamingEventType;
  chunk?: string;
  content?: string;
  data?: string;
  status?: string;
  run_id?: string;
  request_id?: string;
  processing_time?: number;
  tool_used?: string;
  conversation_id?: string;
  thread_id?: string;
  is_new_thread?: boolean;
  related_questions?: string[];
  sources_documents?: string[];
  error?: string;
  iteration?: number;
  source?: string;
  max_iterations?: number;
  results?: unknown;
  pdf_url?: string;
  text_length?: number;
  event_type_name?: string;
  content_type?: string;
  sql?: string;
  agent_type?: string;
  target_table?: string;
  rows_count?: number;
  session_id?: string;
  message_id?: string;
  message?: string;
  has_chart_data?: boolean;
  chart_type?: string;
  chart_data?: unknown;
  pagination?: unknown;
  summary?: string;
  language?: string;
  _result_type?: string;
  success?: boolean;
  type?: string;
  title?: string;
  // ISIC human-in-the-loop fields
  options?: string[];
  ISIC_IDs?: string[];
  user_search_term?: string;
  MASTER_ACTIVITY_NAME?: string;
  isic_choice_required?: boolean;
  chosen_isic_ids?: string[];
  chosen_isic_names?: string[];
}

export type StreamingCallback = (event: StreamingEvent) => void;

export interface ApiMessage {
  message_id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  tool_used: string | null;
  agent_run_id: string | null;
  thread_id: string;
  sources_documents: string[];
  related_questions: string[];
  response_metadata: Record<string, unknown>;
  created_at: string;
  processing_time_seconds: number | null;
  file_metadata: unknown | null;
  audio_metadata: unknown | null;
  has_chart_data?: boolean;
}

export interface MessagesResponse {
  messages: ApiMessage[];
  total: number;
}

export interface MessagesParams {
  limit?: number;
  offset?: number;
}
