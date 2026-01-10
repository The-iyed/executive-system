/**
 * Types for the Legal Advisor (Legislator) API
 */

export interface DocumentReference {
  document_title: string;
  file_name: string;
  dmsdocid_1?: string;
}

export interface MessageMetadata {
  doc_title?: string;
  doc_name?: string;
  doc_url?: string;
  document_type?: string;
  reasoning?: string;
  agent_type?: string;
  related_questions?: string[];
  resources_documents?: DocumentReference[];
}

export interface LegislatorMessage {
  message_id?: string;
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string;
  file_metadata?: {
    filename: string;
    file_id: string;
  };
  audio_metadata?: {
    audio_url: string;
  };
  response_metadata?: MessageMetadata;
  metadata?: MessageMetadata;
  message_data?: {
    type: 'user' | 'assistant';
    content: string;
    audio_url?: string;
    file_metadata?: {
      filename: string;
      file_id: string;
    };
    audio_metadata?: {
      audio_url: string;
    };
    metadata?: MessageMetadata;
  };
  tool_used?: string;
  sources_documents?: DocumentReference[];
  related_questions?: string[];
}

export interface Conversation {
  conversation_id: string;
  _id?: string;
  name: string;
  updated_at: string;
  created_at: string;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface GetMessagesResponse {
  messages: LegislatorMessage[];
}

export interface CreateConversationRequest {
  name?: string;
}

export interface CreateConversationResponse {
  conversation_id: string;
  name: string;
}

export interface UpdateConversationRequest {
  name: string;
}

export interface UpdateConversationResponse {
  conversation_id: string;
  name: string;
  updated_at: string;
}

export interface SendMessageStreamRequest {
  query: string;
  file?: File;
  audio_file?: File;
  language?: string;
  letter_response?: boolean;
  debug?: boolean;
}

export interface StreamEvent {
  event: 'message_posted' | 'run_created' | 'thinking' | 'content_chunk' | 'completed' | 'done' | 'error' | 'analyzing_pdf' | 'pdf_analyzed' | 'uploading_pdf' | 'pdf_uploaded' | 'agent_message_posted' | 'agent_processing';
  run_id?: string;
  chunk?: string;
  source?: string;
  content?: string;
  metadata?: MessageMetadata;
  tool_used?: string;
  response?: {
    audio_url?: string;
  };
  related_questions?: string[];
  sources_documents?: DocumentReference[];
  processing_time?: number;
  error?: string;
  message?: string;
  status?: string;
  conversation_id?: string;
  thread_id?: string;
  is_new_thread?: boolean;
  filename?: string;
  text_length?: number;
  pdf_url?: string;
}

export interface ParsedContent {
  text: string;
  documents: DocumentReference[];
  relatedQuestions: string[];
}

