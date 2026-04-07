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
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#21262d] bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-[#8b949e] hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
            <p className="text-xs text-[#8b949e]">{today}</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00e676] text-black font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
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
