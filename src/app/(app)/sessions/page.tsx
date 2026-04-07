"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface TradingSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface SessionStats {
  name: string;
  winRate: number;
  totalPnl: number;
  trades: number;
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#0A0E12] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-[#E2E8F0] focus:outline-none focus:border-[#06B6D4] transition-all [color-scheme:dark]"
    />
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [stats] = useState<Record<string, SessionStats>>({});
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", startTime: "", endTime: "", timezone: "" });
  const [creating, setCreating] = useState(false);
  const [newData, setNewData] = useState({ name: "", startTime: "09:30", endTime: "16:00", timezone: "America/New_York" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (s: TradingSession) => {
    setEditId(s.id);
    setEditData({ name: s.name, startTime: s.startTime, endTime: s.endTime, timezone: s.timezone });
  };

  const saveEdit = async () => {
    if (!editData.name.trim()) { setError("Name required"); return; }
    setError("");
    await fetch(`/api/sessions/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditId(null);
    load();
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this session? Trades tagged to it will lose the session reference.")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    load();
  };

  const createSession = async () => {
    if (!newData.name.trim()) { setError("Name required"); return; }
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });
    if (res.ok) {
      setCreating(false);
      setNewData({ name: "", startTime: "09:30", endTime: "16:00", timezone: "America/New_York" });
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create session");
    }
  };

  const TIMEZONES = [
    "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Denver",
    "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney", "UTC",
  ];

  const inputCls = "w-full bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-all";

  return (
    <AppShell title="Sessions" onTradeAdded={() => {}}>
      <div className="p-4 max-w-screen-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#94A3B8]">
            Configure your trading sessions for session-based analysis.
          </p>
          {!creating && (
            <button
              onClick={() => { setCreating(true); setError(""); }}
              className="flex items-center gap-1.5 bg-[#06B6D4] hover:bg-[#22D3EE] active:scale-[0.98] text-[#042F2E] font-semibold text-sm px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Session
            </button>
          )}
        </div>

        {error && (
          <p className="mb-3 text-sm text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {creating && (
            <div className="bg-[#111827] border border-[#06B6D4]/30 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#06B6D4] uppercase tracking-[0.5px] mb-3">
                New Session
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Name</label>
                  <input type="text" value={newData.name} onChange={(e) => setNewData((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. NY AM" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Start</label>
                  <TimeInput value={newData.startTime} onChange={(v) => setNewData((d) => ({ ...d, startTime: v }))} />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">End</label>
                  <TimeInput value={newData.endTime} onChange={(v) => setNewData((d) => ({ ...d, endTime: v }))} />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Timezone</label>
                  <select value={newData.timezone} onChange={(e) => setNewData((d) => ({ ...d, timezone: e.target.value }))} className="w-full bg-[#0A0E12] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-[#E2E8F0] focus:outline-none focus:border-[#06B6D4] transition-all">
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createSession} className="flex items-center gap-1.5 bg-[#06B6D4] hover:bg-[#22D3EE] text-[#042F2E] font-semibold text-sm px-3 py-1.5 rounded-lg transition-all">
                  <Check className="w-4 h-4" />Save
                </button>
                <button onClick={() => { setCreating(false); setError(""); }} className="flex items-center gap-1.5 border border-white/10 text-[#94A3B8] hover:text-[#E2E8F0] hover:border-white/20 text-sm px-3 py-1.5 rounded-lg transition-all">
                  <X className="w-4 h-4" />Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-[#64748B] text-sm text-center py-8">Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-8 text-center">
              <p className="text-[#64748B] text-sm">No sessions configured yet.</p>
            </div>
          ) : (
            sessions.map((session) =>
              editId === session.id ? (
                <div key={session.id} className="bg-[#111827] border border-[#06B6D4]/30 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Name</label>
                      <input type="text" value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Start</label>
                      <TimeInput value={editData.startTime} onChange={(v) => setEditData((d) => ({ ...d, startTime: v }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">End</label>
                      <TimeInput value={editData.endTime} onChange={(v) => setEditData((d) => ({ ...d, endTime: v }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Timezone</label>
                      <select value={editData.timezone} onChange={(e) => setEditData((d) => ({ ...d, timezone: e.target.value }))} className="w-full bg-[#0A0E12] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-[#E2E8F0] focus:outline-none focus:border-[#06B6D4] transition-all">
                        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#06B6D4] hover:bg-[#22D3EE] text-[#042F2E] font-semibold text-sm px-3 py-1.5 rounded-lg transition-all">
                      <Check className="w-4 h-4" />Save
                    </button>
                    <button onClick={() => { setEditId(null); setError(""); }} className="flex items-center gap-1.5 border border-white/10 text-[#94A3B8] hover:text-[#E2E8F0] hover:border-white/20 text-sm px-3 py-1.5 rounded-lg transition-all">
                      <X className="w-4 h-4" />Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div key={session.id} className="bg-[#111827] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between hover:border-white/[0.12] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-10 rounded-full bg-[#06B6D4]" />
                    <div>
                      <p className="font-semibold text-[#E2E8F0] text-sm">{session.name}</p>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        {session.startTime} – {session.endTime} {session.timezone.replace("America/", "").replace("Europe/", "").replace("Asia/", "")}
                      </p>
                    </div>
                    {stats[session.name] && (
                      <div className="flex items-center gap-4 ml-4 text-xs">
                        <span className="text-[#64748B]">{stats[session.name].trades} trades</span>
                        <span className={stats[session.name].totalPnl >= 0 ? "text-[#10B981]" : "text-[#F43F5E]"}>
                          {stats[session.name].totalPnl >= 0 ? "+" : ""}${stats[session.name].totalPnl.toFixed(0)}
                        </span>
                        <span className="text-[#E2E8F0]">{stats[session.name].winRate.toFixed(0)}% WR</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(session)} className="p-2 text-[#64748B] hover:text-[#E2E8F0] hover:bg-white/[0.06] rounded-lg transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSession(session.id)} className="p-2 text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
