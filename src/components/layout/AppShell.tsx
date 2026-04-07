"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  user?: {
    displayName?: string;
    email?: string;
    startingBalance?: number;
    currentBalance?: number;
  };
  onTradeAdded?: () => void;
}

export function AppShell({ title, children, user, onTradeAdded }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          onTradeAdded={onTradeAdded}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
