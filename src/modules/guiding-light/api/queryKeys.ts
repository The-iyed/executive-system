export const queryKeys = {
  legislator: {
    conversations: (params?: Record<string, unknown>) =>
      ["conversations", "legislator", "infinite", params] as const,
    conversation: (id: string) => ["conversation", "legislator", id] as const,
    messages: (conversationId: string, params?: Record<string, unknown>) =>
      ["messages", "legislator", conversationId, "infinite", params] as const,
  },
  allConversations: () => ["conversations"] as const,
  ministerSchedule: (date: string, view: string) =>
    ["ministerSchedule", date, view] as const,
  ministerDirectives: (params?: { status?: string }) =>
    ["ministerDirectives", params] as const,
} as const;
