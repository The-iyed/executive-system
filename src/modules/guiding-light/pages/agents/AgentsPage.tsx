import { useState, useCallback, useEffect } from "react";
import { Plus, Bot, Pencil, Trash2, MessageSquare, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { AgentBuilderPage } from "@gl/components/agents/AgentBuilderPage";
import { AgentChatView } from "@gl/components/agents/AgentChatView";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { agentsTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";
import { useAgentsList, useDeleteAgent } from "@gl/hooks/agents/useAgentsApi";
import type { AgentResponse } from "@gl/api/agents/types";
import { EmptyAgentsSVG } from "@gl/components/ui/empty-states";
import { Skeleton } from "@gl/components/ui/skeleton";

type View = "list" | "builder" | "chat";

const STATUS_MAP: Record<string, { text: string; dot: string }> = {
  ready: { text: "جاهز", dot: "bg-emerald-500" },
  pending: { text: "قيد الإعداد", dot: "bg-amber-400" },
  error: { text: "خطأ", dot: "bg-destructive" },
};

function AgentsPage() {
  const { data, isLoading } = useAgentsList();
  const deleteMutation = useDeleteAgent();
  const agents = data?.agents ?? [];

  const [view, setView] = useState<View>("list");
  const [editingAgent, setEditingAgent] = useState<AgentResponse | null>(null);
  const [chattingAgent, setChattingAgent] = useState<AgentResponse | null>(null);

  const agentsTour = useProductTour("agents");
  const setOpenTour = useTourStore((s) => s.setOpenTour);

  useEffect(() => {
    setOpenTour(agentsTour.open);
    return () => setOpenTour(null);
  }, [agentsTour.open, setOpenTour]);

  const handleEdit = useCallback((agent: AgentResponse) => {
    setEditingAgent(agent);
    setView("builder");
  }, []);

  const handleNewAgent = useCallback(() => {
    setEditingAgent(null);
    setView("builder");
  }, []);

  const handleBackToList = useCallback(() => {
    setEditingAgent(null);
    setView("list");
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  if (view === "builder") {
    return (
      <AgentBuilderPage
        agent={editingAgent}
        onSubmit={handleBackToList}
        onCancel={handleBackToList}
      />
    );
  }

  if (view === "chat" && chattingAgent) {
    return (
      <AgentChatView
        agent={chattingAgent}
        onBack={() => { setChattingAgent(null); setView("list"); }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-auto" dir="rtl">
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div data-tour="agents-header" className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-foreground">الوكلاء الأذكياء</h1>
            {agents.length > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
                {agents.length}
              </span>
            )}
          </div>
          <button
            data-tour="agents-add-btn"
            onClick={handleNewAgent}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            وكيل جديد
          </button>
        </div>
      </div>

      <div data-tour="agents-list" className="px-6 pb-6">
        {/* Loading */}
        {isLoading && (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-b-0">
                <Skeleton className="size-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <EmptyAgentsSVG className="size-28 mb-4 opacity-80" />
            <p className="text-sm font-medium text-muted-foreground">لا يوجد وكلاء بعد</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-5">أنشئ وكيلك الذكي الأول للبدء</p>
            <button
              onClick={handleNewAgent}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Plus className="size-4" />
              وكيل جديد
            </button>
          </div>
        )}

        {/* Agent Cards */}
        {!isLoading && agents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const st = STATUS_MAP[agent.status] ?? STATUS_MAP.error;
              return (
                <div
                  key={agent.id}
                  className="group relative flex flex-col rounded-2xl border border-border/40 bg-card p-5 transition-all hover:shadow-md hover:border-border/60"
                >
                  {/* Top: Icon + Name + Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <Bot className="size-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-foreground truncate">{agent.name}</h3>
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                        {agent.description || "بدون وصف"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <span className={`size-1.5 rounded-full ${st.dot}`} />
                      <span className="text-[10px] text-muted-foreground">{st.text}</span>
                    </div>
                  </div>

                  {/* Prompt preview */}
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2 mb-4">
                    {agent.prompt}
                  </p>

                  {/* Files badge */}
                  {agent.uploaded_files.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <FileText className="size-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/60">{agent.uploaded_files.length} ملف</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border/20">
                    <button
                      onClick={() => { setChattingAgent(agent); setView("chat"); }}
                      disabled={agent.status !== "ready"}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/8 py-2 text-[12px] font-medium text-primary transition-all hover:bg-primary/15 active:scale-[0.98] disabled:opacity-35 disabled:pointer-events-none"
                    >
                      <MessageSquare className="size-3.5" />
                      محادثة
                    </button>
                    <button
                      onClick={() => handleEdit(agent)}
                      className="flex size-8 items-center justify-center rounded-xl text-muted-foreground/50 transition-all hover:bg-muted/60 hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleteMutation.isPending}
                      className="flex size-8 items-center justify-center rounded-xl text-muted-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ProductTour tourId="agents" steps={agentsTourSteps} isOpen={agentsTour.isOpen} onClose={agentsTour.close} />
    </div>
  );
}

export { AgentsPage };
