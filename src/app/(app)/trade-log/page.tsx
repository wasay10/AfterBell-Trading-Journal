"use client";

import { useEffect, useState, useCallback } from "react";
import { Fragment } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPnl, getPnlColor, formatDate } from "@/lib/utils";
import { NewTradeModal } from "@/components/trades/NewTradeModal";
import { Pencil, Trash2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  asset: string;
  direction: string;
  date: string;
  pnl: number;
  rr: number | null;
  rating: number | null;
  letterRating: string | null;
  session: { name: string } | null;
  tradeTags: { tag: { name: string } }[];
  tradeMistakes: { mistake: { name: string } }[];
  psychologyBefore: string | null;
  psychologyAfter: string | null;
  notes: string | null;
}

type SortKey = "date" | "asset" | "pnl" | "rr";
type SortDir = "asc" | "desc";

export default function TradeLogPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (search) params.set("asset", search);
    const res = await fetch(`/api/trades?${params}`);
    const data = await res.json();
    setTrades(data.trades ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...trades].sort((a, b) => {
    let av: number | string = 0, bv: number | string = 0;
    if (sortKey === "date") { av = a.date; bv = b.date; }
    else if (sortKey === "asset") { av = a.asset; bv = b.asset; }
    else if (sortKey === "pnl") { av = a.pnl; bv = b.pnl; }
    else if (sortKey === "rr") { av = a.rr ?? 0; bv = b.rr ?? 0; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    load();
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc"
        ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
        : <ChevronDown className="w-3 h-3 inline ml-0.5" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5 opacity-30" />;

  return (
    <AppShell title="Trade Log" onTradeAdded={load}>
      <div className="p-4 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset..."
              className="w-full bg-[#111827] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/15 transition-all"
            />
          </div>
          <p className="text-sm text-[#64748B] shrink-0">{total} trades</p>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  {[
                    { key: "date" as SortKey, label: "Date" },
                    { key: "asset" as SortKey, label: "Asset" },
                    { key: null, label: "Direction" },
                    { key: "pnl" as SortKey, label: "P&L" },
                    { key: "rr" as SortKey, label: "R:R" },
                    { key: null, label: "Session" },
                    { key: null, label: "Tags" },
                    { key: null, label: "Rating" },
                    { key: null, label: "" },
                  ].map(({ key, label }, i) => (
                    <th
                      key={i}
                      onClick={() => key && handleSort(key)}
                      className={cn(
                        "px-4 py-3 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.5px] whitespace-nowrap",
                        key && "cursor-pointer hover:text-[#94A3B8] transition-colors"
                      )}
                    >
                      {label}
                      {key && <SortIcon k={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[#64748B]">
                      Loading...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[#64748B]">
                      No trades yet. Click &quot;+ New Trade&quot; to add your first trade.
                    </td>
                  </tr>
                ) : (
                  sorted.map((trade) => (
                    <Fragment key={trade.id}>
                      <tr
                        onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                        className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-[#64748B] whitespace-nowrap text-xs">
                          {formatDate(trade.date)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#E2E8F0] whitespace-nowrap">
                          {trade.asset}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded",
                            trade.direction === "LONG"
                              ? "bg-[#10B981]/15 text-[#10B981]"
                              : "bg-[#F43F5E]/15 text-[#F43F5E]"
                          )}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-mono font-semibold whitespace-nowrap ${getPnlColor(trade.pnl)}`}>
                          {formatPnl(trade.pnl)}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">
                          {trade.rr ? trade.rr.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">
                          {trade.session?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {trade.tradeTags.slice(0, 3).map((tt) => (
                              <span
                                key={tt.tag.name}
                                className="text-[10px] px-1.5 py-0.5 bg-[#06B6D4]/10 text-[#06B6D4] rounded border border-[#06B6D4]/20"
                              >
                                {tt.tag.name}
                              </span>
                            ))}
                            {trade.tradeTags.length > 3 && (
                              <span className="text-[10px] text-[#64748B]">
                                +{trade.tradeTags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {trade.rating ? (
                            <span className="text-[#94A3B8] text-xs">{"★".repeat(trade.rating)}</span>
                          ) : trade.letterRating ? (
                            <span className="text-[#94A3B8] text-xs font-bold">{trade.letterRating}</span>
                          ) : (
                            <span className="text-[#475569] text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setEditId(trade.id)}
                              className="p-1.5 text-[#64748B] hover:text-[#E2E8F0] hover:bg-white/[0.06] rounded transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTrade(trade.id)}
                              className="p-1.5 text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === trade.id && (
                        <tr className="bg-[#0A0E12]">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {trade.psychologyBefore && (
                                <div>
                                  <p className="text-[#64748B] mb-0.5">Before</p>
                                  <p className="text-[#E2E8F0]">{trade.psychologyBefore}</p>
                                </div>
                              )}
                              {trade.psychologyAfter && (
                                <div>
                                  <p className="text-[#64748B] mb-0.5">After</p>
                                  <p className="text-[#E2E8F0]">{trade.psychologyAfter}</p>
                                </div>
                              )}
                              {trade.tradeMistakes.length > 0 && (
                                <div>
                                  <p className="text-[#64748B] mb-1">Mistakes</p>
                                  <div className="flex flex-wrap gap-1">
                                    {trade.tradeMistakes.map((tm) => (
                                      <span key={tm.mistake.name} className="px-1.5 py-0.5 bg-[#F43F5E]/15 text-[#F43F5E] rounded text-[10px] border border-[#F43F5E]/20">
                                        {tm.mistake.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {trade.notes && (
                                <div className="col-span-2">
                                  <p className="text-[#64748B] mb-0.5">Notes</p>
                                  <p className="text-[#E2E8F0] leading-relaxed">{trade.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editId && (
        <NewTradeModal
          tradeId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); load(); }}
        />
      )}
    </AppShell>
  );
}
