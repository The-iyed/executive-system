import React from 'react';
import { PortalHeader } from './portal-header';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl" style={{ textAlign: 'right' }}>
      <PortalHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8" style={{ textAlign: 'right' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

