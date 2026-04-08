"use client";

import { Menu, Plus } from "lucide-react";
import { useState } from "react";
import { NewTradeModal } from "@/components/trades/NewTradeModal";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  onTradeAdded?: () => void;
}

export function TopBar({ title, onMenuClick, onTradeAdded }: TopBarProps) {
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#111827] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-[#E2E8F0] leading-tight">{title}</h1>
            <p className="text-xs text-[#64748B]">{today}</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#06B6D4] hover:bg-[#22D3EE] active:scale-[0.98] text-[#042F2E] font-semibold text-sm px-3 py-1.5 rounded-lg transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          New Trade
        </button>
      </header>

      {showModal && (
        <NewTradeModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onTradeAdded?.();
          }}
        />
      )}
    </>
  );
}
