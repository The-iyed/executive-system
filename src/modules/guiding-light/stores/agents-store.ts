import { create } from "zustand";

export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  files: { name: string; size: number }[];
  createdAt: string;
  updatedAt: string;
}

interface AgentsState {
  agents: Agent[];
  selectedAgentId: string | null;
  addAgent: (agent: Omit<Agent, "id" | "createdAt" | "updatedAt">) => string;
  updateAgent: (id: string, data: Partial<Omit<Agent, "id" | "createdAt">>) => void;
  deleteAgent: (id: string) => void;
  setSelectedAgentId: (id: string | null) => void;
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: [],
  selectedAgentId: null,

  addAgent: (data) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    set((s) => ({
      agents: [...s.agents, { ...data, id, createdAt: now, updatedAt: now }],
    }));
    return id;
  },

  updateAgent: (id, data) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      ),
    })),

  deleteAgent: (id) =>
    set((s) => ({
      agents: s.agents.filter((a) => a.id !== id),
      selectedAgentId: s.selectedAgentId === id ? null : s.selectedAgentId,
    })),

  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
