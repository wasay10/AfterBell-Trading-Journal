"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Calendar,
  Brain,
  Lightbulb,
  Clock,
  Settings,
  LogOut,
  TrendingUp,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/trade-log", icon: BookOpen, label: "Trade Log" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/psychology", icon: Brain, label: "Psychology" },
  { href: "/insights", icon: Lightbulb, label: "Insights" },
  { href: "/sessions", icon: Clock, label: "Sessions" },
];

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  user?: { displayName?: string; email?: string; startingBalance?: number; currentBalance?: number };
}

export function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 bg-[#0d1117] border-r border-[#21262d] z-50 flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:relative lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7c4dff] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">AfterBell</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#8b949e] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-2 py-1 text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-1">
            Navigation
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-[#7c4dff]/20 text-[#7c4dff]"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-3 border-t border-[#21262d]" />
          <p className="px-2 py-1 text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-1">
            Settings
          </p>
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-[#7c4dff]/20 text-[#7c4dff]"
                : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Account
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </nav>

        {/* Account widget */}
        {user && (
          <div className="px-3 py-3 border-t border-[#21262d]">
            <div className="bg-[#161b22] rounded-lg p-3">
              <p className="text-xs text-[#8b949e] mb-1 truncate">{user.email}</p>
              <p className="text-sm font-semibold text-white mb-2 truncate">
                {user.displayName || user.email}
              </p>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="text-[#8b949e]">Balance</p>
                  <p className="text-white font-mono">
                    ${((user.startingBalance ?? 0) + (user.currentBalance ?? 0)).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#8b949e]">Starting</p>
                  <p className="text-white font-mono">
                    ${(user.startingBalance ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
