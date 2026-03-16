import { AppHeader } from "@gl/components/schedule/AppHeader";
import { useAppStore } from "@gl/stores/app-store";
import { useUrlSync } from "@gl/hooks/useUrlSync";
import { SchedulePage } from "@gl/pages/schedule";
import { RequestsPage } from "@gl/pages/requests";
import { AssistantPage } from "@gl/pages/assistant";
import { AgentsPage } from "@gl/pages/agents";
import { AounChatView } from "@gl/components/chat/AounChatView";
import { DelegationModal } from "@gl/components/delegation/DelegationModal";
import { SearchModal } from "@gl/components/search/SearchModal";
import { MeetingRequestModal } from "@gl/components/meeting-request/MeetingRequestModal";
import { DocumentViewerProvider } from "@gl/contexts/DocumentViewerContext";
import { DocumentViewer } from "@gl/components/document-viewer/DocumentViewer";

function AppLayout() {
  const activeHeaderTab = useAppStore((s) => s.activeHeaderTab);
  useUrlSync();

  return (
    <DocumentViewerProvider>
      <div className="flex h-svh flex-col overflow-hidden bg-background">
        <AppHeader />
        {activeHeaderTab === "aoun" ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <main className="h-full overflow-hidden">
              <AounChatView />
            </main>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
            <div className="h-full rounded-2xl bg-muted/50 border border-border/40 overflow-hidden shadow-sm">
              <main
                className={
                  activeHeaderTab === "assistant" || activeHeaderTab === "agents"
                    ? "h-full flex flex-col overflow-hidden"
                    : "h-full px-6 py-6 overflow-auto"
                }
              >
                {activeHeaderTab === "calendar" && <SchedulePage />}
                {activeHeaderTab === "request" && <RequestsPage />}
                {activeHeaderTab === "assistant" && <AssistantPage />}
                {activeHeaderTab === "agents" && <AgentsPage />}
              </main>
            </div>
          </div>
        )}
        <DelegationModal />
        <SearchModal />
        <MeetingRequestModal />
        <DocumentViewer />
      </div>
    </DocumentViewerProvider>
  );
}

export { AppLayout };
