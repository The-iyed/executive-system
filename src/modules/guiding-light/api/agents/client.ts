import type {
  AgentListResponse,
  AgentResponse,
  AgentCreateRequest,
  AgentUpdateRequest,
  QueryRequest,
  QueryResponse,
  FileUploadResponse,
  DeleteFilesRequest,
  DeleteFilesResponse,
} from "./types";

const BASE_URL = import.meta.env.VITE_AGENT_API_URL ?? "https://custom-agent-dev.momrahai.com/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Agent API ${res.status}: ${body}`);
  }

  // 204 No Content (delete)
  if (res.status === 204) return undefined as T;

  const bodyText = await res.text().catch(() => "");
  if (!bodyText) return undefined as T;

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`Agent API invalid JSON response from ${endpoint}`);
  }
}

/** List all agents */
export function listAgents(): Promise<AgentListResponse> {
  return request<AgentListResponse>("/agents");
}

/** Get agent by ID */
export function getAgent(agentId: string): Promise<AgentResponse> {
  return request<AgentResponse>(`/agents/${agentId}`);
}

/** Create a new agent (returns pending status until files are uploaded) */
export function createAgent(data: AgentCreateRequest): Promise<AgentResponse> {
  return request<AgentResponse>("/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update an agent */
export function updateAgent(agentId: string, data: AgentUpdateRequest): Promise<AgentResponse> {
  return request<AgentResponse>(`/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Delete an agent */
export function deleteAgent(agentId: string): Promise<void> {
  return request<void>(`/agents/${agentId}`, { method: "DELETE" });
}

/** Upload files to an agent (creates Azure agent) */
export async function uploadAgentFiles(agentId: string, files: File[]): Promise<FileUploadResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch(`${BASE_URL}/agents/${agentId}/files`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload files ${res.status}: ${body}`);
  }

  const bodyText = await res.text().catch(() => "");
  if (!bodyText) return { uploaded_files: [], message: "", agent_id: agentId, azure_assistant_id: "", azure_vector_store_id: "" };

  return JSON.parse(bodyText) as FileUploadResponse;
}

/** Add more files to an existing agent */
export async function addAgentFiles(agentId: string, files: File[]): Promise<FileUploadResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch(`${BASE_URL}/agents/${agentId}/files/add`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Add files ${res.status}: ${body}`);
  }

  const bodyText = await res.text().catch(() => "");
  if (!bodyText) return { uploaded_files: [], message: "", agent_id: agentId, azure_assistant_id: "", azure_vector_store_id: "" };

  return JSON.parse(bodyText) as FileUploadResponse;
}

/** Delete specific files from an agent */
export function deleteAgentFiles(agentId: string, data: DeleteFilesRequest): Promise<DeleteFilesResponse> {
  return request<DeleteFilesResponse>(`/agents/${agentId}/files/delete`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Query an agent */
export function queryAgent(agentId: string, data: QueryRequest): Promise<QueryResponse> {
  return request<QueryResponse>(`/agents/${agentId}/query`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
