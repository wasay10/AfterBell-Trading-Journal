"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettings {
  email: string;
  displayName: string;
  startingBalance: number;
  currentBalance: number;
  breakevenCap: number;
  ratingStyle: "STARS" | "GRADES";
}

const BREAKEVEN_PRESETS = [0, 10, 20, 35, 50];

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [breakevenCap, setBreakevenCap] = useState("");
  const [ratingStyle, setRatingStyle] = useState<"STARS" | "GRADES">("STARS");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
    setDisplayName(data.displayName ?? "");
    setStartingBalance(String(data.startingBalance ?? 0));
    setBreakevenCap(String(data.breakevenCap ?? 0));
    setRatingStyle(data.ratingStyle ?? "STARS");
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const body: Record<string, unknown> = {
      displayName,
      startingBalance: parseFloat(startingBalance) || 0,
      breakevenCap: parseFloat(breakevenCap) || 0,
      ratingStyle,
    };

    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSuccess("Settings saved successfully.");
      setCurrentPassword("");
      setNewPassword("");
      load();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save settings");
    }
  };

  const inputCls = "w-full bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-all";

  return (
    <AppShell title="Account Settings" user={settings ?? undefined} onTradeAdded={() => {}}>
      <div className="p-4 max-w-screen-sm mx-auto">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-4">
              Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Email</label>
                <input
                  type="email"
                  value={settings?.email ?? ""}
                  disabled
                  className="w-full bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#475569] cursor-not-allowed"
                />
                <p className="text-[10px] text-[#475569] mt-1">Email cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* Trading Config */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-4">
              Trading Config
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Starting Balance ($)</label>
                <input
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  placeholder="e.g. 50000"
                  step="100"
                  min="0"
                  className={cn(inputCls, "font-mono")}
                />
                <p className="text-[10px] text-[#475569] mt-1">Used for return % calculations.</p>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Breakeven Cap ($)</label>
                <div className="flex gap-2 mb-2">
                  {BREAKEVEN_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBreakevenCap(String(p))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        parseFloat(breakevenCap) === p
                          ? "bg-[#06B6D4]/15 border-[#06B6D4]/50 text-[#06B6D4]"
                          : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]"
                      )}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={breakevenCap}
                  onChange={(e) => setBreakevenCap(e.target.value)}
                  placeholder="e.g. 10"
                  step="1"
                  min="0"
                  className={cn(inputCls, "font-mono")}
                />
                <p className="text-[10px] text-[#475569] mt-1">
                  Trades within ±${breakevenCap || 0} are classified as Breakeven.
                </p>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Rating Style</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRatingStyle("STARS")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all",
                      ratingStyle === "STARS"
                        ? "bg-[#06B6D4]/15 border-[#06B6D4]/50 text-[#06B6D4]"
                        : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]"
                    )}
                  >
                    ★ Stars (1–5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingStyle("GRADES")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all",
                      ratingStyle === "GRADES"
                        ? "bg-[#06B6D4]/15 border-[#06B6D4]/50 text-[#06B6D4]"
                        : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]"
                    )}
                  >
                    A+ Grades
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-4">
              Change Password
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#06B6D4] hover:bg-[#22D3EE] active:scale-[0.98] disabled:opacity-50 text-[#042F2E] font-semibold py-3 rounded-xl text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
