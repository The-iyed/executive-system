/** Types matching the Custom Agent Creator API (custom-agent-dev.momrahai.com) */

export interface UploadedFileInfo {
  filename: string;
  azure_file_id: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: "pending" | "ready" | "error";
  azure_assistant_id?: string | null;
  azure_vector_store_id?: string | null;
  uploaded_files: UploadedFileInfo[];
  created_at: string;
  updated_at: string;
}

export interface AgentListResponse {
  agents: AgentResponse[];
  total: number;
}

export interface AgentCreateRequest {
  name: string;
  description?: string;
  prompt: string;
}

export interface AgentUpdateRequest {
  name?: string | null;
  description?: string | null;
  prompt?: string | null;
}

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  agent_id: string;
  query: string;
  answer: string;
  citations?: string[];
}

export interface FileUploadResponse {
  agent_id: string;
  azure_assistant_id: string;
  azure_vector_store_id: string;
  uploaded_files: UploadedFileInfo[];
  message: string;
}

export interface DeleteFilesRequest {
  azure_file_ids: string[];
}

export interface DeleteFilesResponse {
  agent_id: string;
  deleted_file_ids: string[];
  remaining_files: UploadedFileInfo[];
  message: string;
}
