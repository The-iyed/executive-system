import { apiClient } from "../client";
import type {
  ConversationsResponse,
  ConversationsParams,
  CreateConversationRequest,
  CreateConversationResponse,
  Conversation,
  UpdateConversationRequest,
  TranscribeRequest,
  TranscribeResponse,
  MessagesResponse,
  MessagesParams,
  SendMessageRequest,
  StreamingCallback,
} from "../types";

export async function getLegislatorConversations(
  params?: ConversationsParams
): Promise<ConversationsResponse> {
  return apiClient.get<ConversationsResponse>(
    "",
    "conversations",
    params as Record<string, string | number | undefined>
  );
}

export async function createLegislatorConversation(
  data: CreateConversationRequest
): Promise<CreateConversationResponse> {
  return apiClient.post<CreateConversationResponse>("", "conversations", data);
}

export async function updateLegislatorConversation(
  conversationId: string,
  data: UpdateConversationRequest
): Promise<Conversation> {
  return apiClient.patch<Conversation>(
    "",
    `conversations/${conversationId}`,
    data
  );
}

export async function deleteLegislatorConversation(
  conversationId: string
): Promise<void> {
  return apiClient.delete<void>("", `conversations/${conversationId}`);
}

export async function getLegislatorConversation(
  conversationId: string
): Promise<Conversation> {
  return apiClient.get<Conversation>("", `conversations/${conversationId}`);
}

export async function getLegislatorMessages(
  conversationId: string,
  params?: MessagesParams
): Promise<MessagesResponse> {
  return apiClient.get<MessagesResponse>(
    "",
    `conversations/${conversationId}/messages`,
    params as Record<string, string | number | undefined>
  );
}

export async function sendLegislatorMessageStream(
  conversationId: string,
  data: SendMessageRequest,
  onEvent: StreamingCallback,
  onError?: (error: Error) => void
): Promise<void> {
  const formData = new FormData();
  let tool = "normale";
  const hasFile = (data.files && data.files.length > 0) || data.file;

  if (data.deep_search) tool = "deep_search";
  else if (data.document_analyzer) tool = "document_analyzer";
  else if (data.benchmarking) tool = "benchmarking";
  else if (data.stats) tool = "stats";
  else if (data.letter_response && hasFile) tool = "letter_response";
  else if (data.web_search) tool = "web_search";

  formData.append("tool", tool);
  formData.append("conversation_id", conversationId);

  if (data.query !== undefined) formData.append("query", data.query);

  const hasPreUploadedIds = data.document_ids && data.document_ids.size > 0;

  if (hasPreUploadedIds) {
    // Only send document IDs, skip sending the actual files
    for (const [, docId] of data.document_ids!) {
      formData.append("document_id", docId);
    }
  } else if (data.files && data.files.length > 0) {
    data.files.forEach((file) => formData.append("file", file));
  } else if (data.file) {
    formData.append("file", data.file);
  }

  if (data.audio_file) formData.append("audio", data.audio_file);
  if (data.lang) formData.append("lang", data.lang);
  if (data.debug !== undefined) formData.append("debug", String(data.debug));
  if (data.tag) formData.append("tag", data.tag);

  if (data.stats) {
    const payload: Record<string, unknown> = {
      tool,
      conversation_id: conversationId,
      ...(data.query !== undefined && { query: data.query }),
      ...(data.lang && { lang: data.lang }),
      ...(data.debug !== undefined && { debug: data.debug }),
      ...(data.isic_user_choice !== undefined && { isic_user_choice: data.isic_user_choice }),
    };
    return apiClient.streamJson(
      "",
      "data-analyzer/stream",
      payload,
      onEvent,
      onError
    );
  }

  return apiClient.streamMultipart(
    "",
    "gateway/query-stream",
    formData,
    onEvent,
    onError
  );
}

export async function transcribeAudio(
  data: TranscribeRequest
): Promise<TranscribeResponse> {
  if (!data.audio_file.size) {
    throw new Error("Cannot transcribe: Audio file is empty");
  }
  const formData = new FormData();
  formData.append("audio", data.audio_file, data.audio_file.name);
  if (data.lang) formData.append("lang", data.lang);
  return apiClient.postMultipart<TranscribeResponse>(
    "",
    "gateway/transcript",
    formData
  );
}
