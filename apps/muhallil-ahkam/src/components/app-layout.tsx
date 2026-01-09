import React, { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarInset, useSidebar } from '@sanad-ai/ui';
import { Sidebar } from './sidebar';
import { PageTransition } from './page-transition';
import BackgroundImage from '../assets/bg.png';

interface AppLayoutProps {
  children: ReactNode;
}

const SidebarInsetWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarInset
      className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'mr-[86px]' : 'mr-[359px]'
      }`}
    >
      <div className="h-[calc(100vh-26px)] bg-white rounded-[15px] border border-[#F0F5F3] overflow-y-auto overflow-x-hidden scroll-container">
        {children}
      </div>
      <style>{`
        .scroll-container {
          scrollbar-gutter: stable;
          border-radius: 15px;
        }
        .scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 15px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 15px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: #D0D0D0;
        }
      `}</style>
    </SidebarInset>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="ahkam-app-layout min-h-screen p-[13px]" dir="rtl">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarToggle}>
        <div className="relative z-10 flex w-full min-h-[calc(100vh-26px)]">
          <Sidebar isOpen={sidebarOpen} onClose={handleSidebarToggle} />

          <SidebarInsetWrapper>
            <PageTransition>
              {children}
            </PageTransition>
          </SidebarInsetWrapper>
        </div>
      </SidebarProvider>
    </div>
  );
};