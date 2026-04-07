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
      className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7c4dff] [color-scheme:dark]"
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
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "America/Denver",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
    "UTC",
  ];

  return (
    <AppShell title="Sessions" onTradeAdded={() => {}}>
      <div className="p-4 max-w-screen-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#8b949e]">
            Configure your trading sessions for session-based analysis.
          </p>
          {!creating && (
            <button
              onClick={() => { setCreating(true); setError(""); }}
              className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00e676] text-black font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Session
            </button>
          )}
        </div>

        {error && (
          <p className="mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {/* Create new */}
          {creating && (
            <div className="bg-[#161b22] border border-[#7c4dff]/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#7c4dff] uppercase tracking-widest mb-3">
                New Session
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">Name</label>
                  <input
                    type="text"
                    value={newData.name}
                    onChange={(e) => setNewData((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. NY AM"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">Start</label>
                  <TimeInput value={newData.startTime} onChange={(v) => setNewData((d) => ({ ...d, startTime: v }))} />
                </div>
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">End</label>
                  <TimeInput value={newData.endTime} onChange={(v) => setNewData((d) => ({ ...d, endTime: v }))} />
                </div>
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">Timezone</label>
                  <select
                    value={newData.timezone}
                    onChange={(e) => setNewData((d) => ({ ...d, timezone: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7c4dff]"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createSession}
                  className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00e676] text-black font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => { setCreating(false); setError(""); }}
                  className="flex items-center gap-1.5 border border-[#30363d] text-[#8b949e] hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-[#8b949e] text-sm text-center py-8">Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-8 text-center">
              <p className="text-[#8b949e] text-sm">No sessions configured yet.</p>
            </div>
          ) : (
            sessions.map((session) =>
              editId === session.id ? (
                <div key={session.id} className="bg-[#161b22] border border-[#7c4dff]/40 rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#7c4dff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Start</label>
                      <TimeInput value={editData.startTime} onChange={(v) => setEditData((d) => ({ ...d, startTime: v }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">End</label>
                      <TimeInput value={editData.endTime} onChange={(v) => setEditData((d) => ({ ...d, endTime: v }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b949e] mb-1">Timezone</label>
                      <select
                        value={editData.timezone}
                        onChange={(e) => setEditData((d) => ({ ...d, timezone: e.target.value }))}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7c4dff]"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00e676] text-black font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => { setEditId(null); setError(""); }}
                      className="flex items-center gap-1.5 border border-[#30363d] text-[#8b949e] hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={session.id}
                  className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 rounded-full bg-[#7c4dff]" />
                    <div>
                      <p className="font-semibold text-white text-sm">{session.name}</p>
                      <p className="text-xs text-[#8b949e] font-mono mt-0.5">
                        {session.startTime} – {session.endTime} {session.timezone.replace("America/", "").replace("Europe/", "").replace("Asia/", "")}
                      </p>
                    </div>
                    {stats[session.name] && (
                      <div className="flex items-center gap-4 ml-4 text-xs">
                        <span className="text-[#8b949e]">
                          {stats[session.name].trades} trades
                        </span>
                        <span className={stats[session.name].totalPnl >= 0 ? "text-[#00c853]" : "text-[#ff1744]"}>
                          {stats[session.name].totalPnl >= 0 ? "+" : ""}${stats[session.name].totalPnl.toFixed(0)}
                        </span>
                        <span className="text-white">
                          {stats[session.name].winRate.toFixed(0)}% WR
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(session)}
                      className="p-2 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="p-2 text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] rounded-lg transition-colors"
                    >
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
