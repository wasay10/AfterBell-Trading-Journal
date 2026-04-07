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
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 bg-[#111827] border-r border-white/[0.08] z-50 flex flex-col transition-transform duration-200",
          "lg:translate-x-0 lg:relative lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <span className="font-bold tracking-tight">
              <span className="text-[#E2E8F0]">After</span>
              <span className="text-[#06B6D4]">Bell</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-2 py-1 text-[10px] font-semibold text-[#64748B] uppercase tracking-[1.5px] mb-1">
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#06B6D4]/10 text-[#06B6D4] border-l-[3px] border-[#06B6D4] pl-[9px]"
                    : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/[0.05] border-l-[3px] border-transparent pl-[9px]"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/[0.08]" />
          <p className="px-2 py-1 text-[10px] font-semibold text-[#64748B] uppercase tracking-[1.5px] mb-1">
            Settings
          </p>
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/settings"
                ? "bg-[#06B6D4]/10 text-[#06B6D4] border-l-[3px] border-[#06B6D4] pl-[9px]"
                : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/[0.05] border-l-[3px] border-transparent pl-[9px]"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Account
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F43F5E] hover:bg-white/[0.05] transition-all duration-150 border-l-[3px] border-transparent pl-[9px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </nav>

        {/* Account widget */}
        {user && (
          <div className="px-3 py-3 border-t border-white/[0.08]">
            <div className="bg-[#0A0E12] rounded-lg p-3 border border-white/[0.08]">
              <p className="text-xs text-[#64748B] mb-0.5 truncate">{user.email}</p>
              <p className="text-sm font-semibold text-[#E2E8F0] mb-2 truncate">
                {user.displayName || user.email}
              </p>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="text-[#64748B]">Balance</p>
                  <p className="text-[#10B981] font-mono font-semibold">
                    ${((user.startingBalance ?? 0) + (user.currentBalance ?? 0)).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#64748B]">Starting</p>
                  <p className="text-[#94A3B8] font-mono">
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
