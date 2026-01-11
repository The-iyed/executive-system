import React from 'react';
import { PortalHeader } from './portal-header';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl" style={{ textAlign: 'right' }}>
      <PortalHeader />
      <main className="flex-1 overflow-y-auto" style={{ width: '100%', minWidth: 0 }}>
        <div className="w-full" style={{ textAlign: 'right', minWidth: 0 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

