import React, { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarInset, useSidebar } from '@sanad-ai/ui';
import { Sidebar } from './sidebar';
import BackgroundImage from '../assets/bg.png';

interface AppLayoutProps {
  children: ReactNode;
  conversations?: Array<{ conversation_id: string; name: string }>;
  currentConversationId?: string | null;
  isLoadingConversations?: boolean;
  isCreatingConversation?: boolean;
  onSelectConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onUpdateConversation?: (conversationId: string, name: string) => void;
}

const SidebarInsetWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarInset
      className={`flex-1 transition-all duration-300 ${
        // On mobile, no margin (sidebar is always visible but smaller)
        // On larger screens, apply margin based on sidebar state
        isCollapsed 
          ? 'mr-0 sm:mr-[86px]' 
          : 'mr-0 sm:mr-[326px]'
      }`}
    >
      <div 
        className="h-full bg-white rounded-[15px] border border-[#F0F5F3] overflow-hidden flex flex-col" 
        style={{ 
          height: '100%', 
          maxHeight: 'calc(100vh - 26px)',
          boxShadow: '0px 4px 21.1px 0px rgba(255, 255, 255, 0.24)',
        }}
      >
        <style>{`
          .sanad-ai-app-layout *::-webkit-scrollbar {
            width: 6px;
          }
          .sanad-ai-app-layout *::-webkit-scrollbar-track {
            background: transparent;
          }
          .sanad-ai-app-layout *::-webkit-scrollbar-thumb {
            background: #E0E0E0;
            border-radius: 3px;
          }
          .sanad-ai-app-layout *::-webkit-scrollbar-thumb:hover {
            background: #D0D0D0;
          }
        `}</style>
        {children}
      </div>
    </SidebarInset>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  conversations = [],
  currentConversationId,
  isLoadingConversations = false,
  isCreatingConversation = false,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateConversation,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div 
      className="sanad-ai-app-layout w-full h-full min-h-screen p-[13px] overflow-hidden" 
      dir="rtl" 
      style={{ 
        height: '100%', 
        width: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarToggle}>
        <div className="relative z-10 flex w-full h-full overflow-hidden" style={{ height: '100%', overflow: 'hidden' }}>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarToggle}
            conversations={conversations}
            currentConversationId={currentConversationId}
            isLoadingConversations={isLoadingConversations}
            isCreatingConversation={isCreatingConversation}
            onSelectConversation={onSelectConversation}
            onNewConversation={onNewConversation}
            onDeleteConversation={onDeleteConversation}
            onUpdateConversation={onUpdateConversation}
          />

          <SidebarInsetWrapper>
            {children}
          </SidebarInsetWrapper>
        </div>
      </SidebarProvider>
    </div>
  );
};

