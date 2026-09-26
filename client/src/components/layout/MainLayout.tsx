import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { UserDrawer } from './UserDrawer.js';
import { TicketDrawer } from './TicketDrawer.js';

interface MainLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f2f5] relative">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenUserDrawer={() => setIsUserDrawerOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Dynamic Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Floating Ticket Button on the Right Edge (TopKPI authentic style) */}
      <div
        onClick={() => setIsTicketDrawerOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#1677ff] hover:bg-[#4096ff] active:bg-[#0958d9] text-white text-[11px] font-bold ticket-floating-btn py-3 px-1.5 rounded-l-md shadow-lg cursor-pointer select-none transition-all duration-150 hover:px-2 flex items-center justify-center"
        title="Gửi Ticket Hỗ Trợ & Báo Cáo Sự Cố"
      >
        TICKET
      </div>

      {/* Ticket Support Slide-over Drawer */}
      <TicketDrawer
        isOpen={isTicketDrawerOpen}
        onClose={() => setIsTicketDrawerOpen(false)}
      />

      {/* User Profile Slide-over Drawer */}
      <UserDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
      />
    </div>
  );
};
