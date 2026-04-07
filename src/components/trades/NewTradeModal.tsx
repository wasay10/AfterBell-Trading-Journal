"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Star, ChevronDown, Plus, Search } from "lucide-react";
import { cn, PSYCHOLOGY_OPTIONS, LETTER_GRADES } from "@/lib/utils";

interface Session { id: string; name: string }
interface Tag { id: string; name: string }
interface Mistake { id: string; name: string }
interface UserSettings { ratingStyle: "STARS" | "GRADES" }

interface NewTradeModalProps {
  onClose: () => void;
  onSaved: () => void;
  tradeId?: string;
}

// ── Asset Combobox ────────────────────────────────────────────────────────────
function AssetCombobox({
  value,
  onChange,
  allAssets,
}: {
  value: string;
  onChange: (v: string) => void;
  allAssets: string[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? allAssets.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : allAssets.slice(0, 20);

  const selectAsset = (a: string) => {
    onChange(a);
    setQuery(a);
    setOpen(false);
  };

  const handleInputChange = (v: string) => {
    setQuery(v);
    onChange(v);
    setOpen(true);
  };

  const showCreate =
    query.trim() &&
    !allAssets.some((a) => a.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search or type asset…"
          autoComplete="off"
          className="w-full bg-[#0A0E12] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-all"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#1E293B] border border-white/10 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 && !showCreate && (
            <p className="px-3 py-2 text-xs text-[#64748B]">No matches</p>
          )}
          {filtered.map((a) => (
            <button
              key={a}
              type="button"
              onMouseDown={() => selectAsset(a)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors font-mono",
                value === a ? "text-[#06B6D4]" : "text-[#E2E8F0]"
              )}
            >
              {a}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={() => selectAsset(query.trim().toUpperCase())}
              className="w-full text-left px-3 py-2 text-sm text-[#10B981] hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 border-t border-white/[0.08]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add &ldquo;{query.trim().toUpperCase()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function NewTradeModal({ onClose, onSaved, tradeId }: NewTradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [pnl, setPnl] = useState("");
  const [rr, setRr] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [rating, setRating] = useState(0);
  const [letterRating, setLetterRating] = useState("");
  const [notes, setNotes] = useState("");
  const [psychBefore, setPsychBefore] = useState("");
  const [psychAfter, setPsychAfter] = useState("");

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [pendingNewTags, setPendingNewTags] = useState<string[]>([]);

  const [availableMistakes, setAvailableMistakes] = useState<Mistake[]>([]);
  const [selectedMistakeIds, setSelectedMistakeIds] = useState<string[]>([]);
  const [newMistakeInput, setNewMistakeInput] = useState("");

  const [allAssets, setAllAssets] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({ ratingStyle: "STARS" });

  const load = useCallback(async () => {
    const [tags, mistakes, sess, settings, assets] = await Promise.all([
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/mistakes").then((r) => r.json()),
      fetch("/api/sessions").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
    ]);
    setAvailableTags(Array.isArray(tags) ? tags : []);
    setAvailableMistakes(Array.isArray(mistakes) ? mistakes : []);
    setSessions(Array.isArray(sess) ? sess : []);
    if (settings?.ratingStyle) setUserSettings({ ratingStyle: settings.ratingStyle });
    setAllAssets(Array.isArray(assets) ? assets : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tradeId) return;
    fetch(`/api/trades/${tradeId}`).then((r) => r.json()).then((t) => {
      setAsset(t.asset ?? "");
      setDirection(t.direction ?? "LONG");
      setDate(t.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]);
      setPnl(String(t.pnl ?? ""));
      setRr(String(t.rr ?? ""));
      setSessionId(t.sessionId ?? "");
      setRating(t.rating ?? 0);
      setLetterRating(t.letterRating ?? "");
      setNotes(t.notes ?? "");
      setPsychBefore(t.psychologyBefore ?? "");
      setPsychAfter(t.psychologyAfter ?? "");
      setSelectedTagIds(t.tradeTags?.map((tt: { tag: Tag }) => tt.tag.id) ?? []);
      setSelectedMistakeIds(t.tradeMistakes?.map((tm: { mistake: Mistake }) => tm.mistake.id) ?? []);
    });
  }, [tradeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const addNewTag = () => {
    const val = newTagInput.trim();
    if (!val || pendingNewTags.includes(val)) return;
    setPendingNewTags((prev) => [...prev, val]);
    setNewTagInput("");
  };

  const addNewMistake = async () => {
    const val = newMistakeInput.trim();
    if (!val) return;
    const res = await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: val }),
    });
    if (res.ok) {
      const m = await res.json();
      setAvailableMistakes((prev) => [...prev, m]);
      setSelectedMistakeIds((prev) => [...prev, m.id]);
      setNewMistakeInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) { setError("Asset is required"); return; }
    const pnlNum = parseFloat(pnl);
    if (pnl === "" || isNaN(pnlNum)) { setError("P&L must be a valid number"); return; }
    const rrNum = rr ? parseFloat(rr) : null;
    if (rr && (rrNum === null || isNaN(rrNum))) { setError("R:R must be a valid number"); return; }
    setError("");
    setLoading(true);

    const body = {
      asset: asset.trim().toUpperCase(),
      direction,
      date,
      pnl: pnlNum,
      rr: rrNum,
      sessionId: sessionId || null,
      rating: userSettings.ratingStyle === "STARS" ? (rating || null) : null,
      letterRating: userSettings.ratingStyle === "GRADES" ? (letterRating || null) : null,
      notes: notes || null,
      psychologyBefore: psychBefore || null,
      psychologyAfter: psychAfter || null,
      tagIds: selectedTagIds,
      mistakeIds: selectedMistakeIds,
      newTags: pendingNewTags,
    };

    const url = tradeId ? `/api/trades/${tradeId}` : "/api/trades";
    const method = tradeId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save trade");
    }
  };

  const inputCls = "w-full bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-all";
  const selectCls = "w-full appearance-none bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E2E8F0] focus:outline-none focus:border-[#06B6D4] transition-all pr-8";

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 bg-[#111827] z-10">
          <h2 className="text-base font-semibold text-[#E2E8F0]">
            {tradeId ? "Edit Trade" : "New Trade"}
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#E2E8F0] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Section 1: Trade Details */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#06B6D4] uppercase tracking-[0.5px] mb-3">
              Trade Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-[#94A3B8] mb-1">Asset *</label>
                <AssetCombobox value={asset} onChange={setAsset} allAssets={allAssets} />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Direction</label>
                <div className="flex gap-2">
                  {(["LONG", "SHORT"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-semibold border transition-all",
                        direction === d && d === "LONG"
                          ? "bg-[#10B981]/15 border-[#10B981]/50 text-[#10B981]"
                          : direction === d && d === "SHORT"
                          ? "bg-[#F43F5E]/15 border-[#F43F5E]/50 text-[#F43F5E]"
                          : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={cn(inputCls, "[color-scheme:dark]")}
                />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">P&L ($) *</label>
                <input
                  type="number"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  placeholder="e.g. 250 or -150"
                  step="0.01"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">R:R</label>
                <input
                  type="number"
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  placeholder="e.g. 2.5"
                  step="0.1"
                  min="0"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Session</label>
                <div className="relative">
                  <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={selectCls}>
                    <option value="">— None —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Rating */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-3">
              Rating
            </h3>
            {userSettings.ratingStyle === "STARS" ? (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={cn("w-7 h-7", star <= rating ? "text-[#94A3B8] fill-[#94A3B8]" : "text-white/10")} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {LETTER_GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setLetterRating(letterRating === g ? "" : g)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-bold border transition-all",
                      letterRating === g
                        ? "bg-[#06B6D4]/15 border-[#06B6D4]/50 text-[#06B6D4]"
                        : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: Tags */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#06B6D4] uppercase tracking-[0.5px] mb-3">
              Tags / Setup
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTagIds((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    )
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    selectedTagIds.includes(tag.id)
                      ? "bg-[#06B6D4]/15 border-[#06B6D4]/50 text-[#06B6D4]"
                      : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]"
                  )}
                >
                  {tag.name}
                </button>
              ))}
              {pendingNewTags.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#06B6D4]/15 border border-[#06B6D4]/50 text-[#06B6D4] flex items-center gap-1"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => setPendingNewTags((prev) => prev.filter((t) => t !== name))}
                    className="hover:text-[#E2E8F0]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } }}
                placeholder="Add tag..."
                className={inputCls}
              />
              <button
                type="button"
                onClick={addNewTag}
                className="bg-[#0A0E12] border border-white/10 text-[#64748B] hover:text-[#E2E8F0] hover:border-white/20 px-3 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Section 4: Mistakes */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#F43F5E] uppercase tracking-[0.5px] mb-3">
              Mistakes
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableMistakes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setSelectedMistakeIds((prev) =>
                      prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                    )
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    selectedMistakeIds.includes(m.id)
                      ? "bg-[#F43F5E]/15 border-[#F43F5E]/50 text-[#F43F5E]"
                      : "bg-[#0A0E12] border-white/10 text-[#64748B] hover:border-white/20 hover:text-[#94A3B8]"
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMistakeInput}
                onChange={(e) => setNewMistakeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewMistake(); } }}
                placeholder="Custom mistake..."
                className="flex-1 bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#F43F5E] transition-all"
              />
              <button
                type="button"
                onClick={addNewMistake}
                className="bg-[#0A0E12] border border-white/10 text-[#64748B] hover:text-[#E2E8F0] hover:border-white/20 px-3 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Section 5: Psychology */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-3">
              Psychology
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Before Trade</label>
                <div className="relative">
                  <select
                    value={psychBefore}
                    onChange={(e) => setPsychBefore(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">— None —</option>
                    {PSYCHOLOGY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">After Trade</label>
                <div className="relative">
                  <select
                    value={psychAfter}
                    onChange={(e) => setPsychAfter(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">— None —</option>
                    {PSYCHOLOGY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Notes */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] mb-3">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Context, thesis, lessons learned..."
              className="w-full bg-[#0A0E12] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[#06B6D4] transition-all resize-none"
            />
          </section>

          {error && (
            <p className="text-sm text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-[#111827] pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 text-[#94A3B8] hover:text-[#E2E8F0] hover:border-white/20 rounded-lg text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#06B6D4] hover:bg-[#22D3EE] active:scale-[0.98] disabled:opacity-50 text-[#042F2E] font-semibold rounded-lg text-sm transition-all"
            >
              {loading ? "Saving..." : tradeId ? "Update Trade" : "Save Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
