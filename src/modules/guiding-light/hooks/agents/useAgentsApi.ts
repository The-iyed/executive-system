import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as agentsApi from "@gl/api/agents/client";
import type {
  AgentCreateRequest,
  AgentUpdateRequest,
  QueryRequest,
} from "@gl/api/agents/types";

const AGENTS_KEY = ["agents"] as const;
const agentKey = (id: string) => ["agents", id] as const;

/* ─── Queries ─── */

export function useAgentsList() {
  return useQuery({
    queryKey: AGENTS_KEY,
    queryFn: agentsApi.listAgents,
    staleTime: 30_000,
  });
}

export function useAgent(agentId: string | null) {
  return useQuery({
    queryKey: agentKey(agentId!),
    queryFn: () => agentsApi.getAgent(agentId!),
    enabled: !!agentId,
  });
}

/* ─── Mutations ─── */

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AgentCreateRequest) => agentsApi.createAgent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentUpdateRequest }) =>
      agentsApi.updateAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.deleteAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useUploadAgentFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, files }: { agentId: string; files: File[] }) =>
      agentsApi.uploadAgentFiles(agentId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useAddAgentFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, files }: { agentId: string; files: File[] }) =>
      agentsApi.addAgentFiles(agentId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useDeleteAgentFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, fileIds }: { agentId: string; fileIds: string[] }) =>
      agentsApi.deleteAgentFiles(agentId, { azure_file_ids: fileIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useQueryAgent() {
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: string; data: QueryRequest }) =>
      agentsApi.queryAgent(agentId, data),
  });
}
