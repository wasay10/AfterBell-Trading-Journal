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

  // Keep input in sync when value is set externally (edit mode)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? allAssets.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : allAssets.slice(0, 20); // show top 20 when empty

  const selectAsset = (a: string) => {
    onChange(a);
    setQuery(a);
    setOpen(false);
  };

  const handleInputChange = (v: string) => {
    setQuery(v);
    onChange(v); // keep parent in sync as user types
    setOpen(true);
  };

  // "Create" option: show when query doesn't match any existing asset exactly
  const showCreate =
    query.trim() &&
    !allAssets.some((a) => a.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b949e] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search or type asset…"
          autoComplete="off"
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff]"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#1c2128] border border-[#30363d] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 && !showCreate && (
            <p className="px-3 py-2 text-xs text-[#8b949e]">No matches</p>
          )}
          {filtered.map((a) => (
            <button
              key={a}
              type="button"
              onMouseDown={() => selectAsset(a)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-[#30363d] transition-colors font-mono",
                value === a ? "text-[#7c4dff]" : "text-white"
              )}
            >
              {a}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={() => selectAsset(query.trim().toUpperCase())}
              className="w-full text-left px-3 py-2 text-sm text-[#00c853] hover:bg-[#30363d] transition-colors flex items-center gap-1.5 border-t border-[#30363d]"
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

  // Form state
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

  // Tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [pendingNewTags, setPendingNewTags] = useState<string[]>([]);

  // Mistakes
  const [availableMistakes, setAvailableMistakes] = useState<Mistake[]>([]);
  const [selectedMistakeIds, setSelectedMistakeIds] = useState<string[]>([]);
  const [newMistakeInput, setNewMistakeInput] = useState("");

  // Assets / Sessions / Settings
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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d] sticky top-0 bg-[#0d1117] z-10">
          <h2 className="text-base font-semibold text-white">
            {tradeId ? "Edit Trade" : "New Trade"}
          </h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Section 1: Trade Details */}
          <section>
            <h3 className="text-xs font-semibold text-[#00c853] uppercase tracking-widest mb-3">
              Trade Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Asset */}
              <div className="col-span-2">
                <label className="block text-xs text-[#8b949e] mb-1">Asset *</label>
                <AssetCombobox
                  value={asset}
                  onChange={setAsset}
                  allAssets={allAssets}
                />
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">Direction</label>
                <div className="flex gap-2">
                  {(["LONG", "SHORT"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors",
                        direction === d && d === "LONG"
                          ? "bg-[#00c853]/20 border-[#00c853] text-[#00c853]"
                          : direction === d && d === "SHORT"
                          ? "bg-[#ff1744]/20 border-[#ff1744] text-[#ff1744]"
                          : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c4dff] [color-scheme:dark]"
                />
              </div>

              {/* P&L */}
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">P&L ($) *</label>
                <input
                  type="number"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  placeholder="e.g. 250 or -150"
                  step="0.01"
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff]"
                />
              </div>

              {/* RR */}
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">R:R</label>
                <input
                  type="number"
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  placeholder="e.g. 2.5"
                  step="0.1"
                  min="0"
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff]"
                />
              </div>

              {/* Session */}
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">Session</label>
                <div className="relative">
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full appearance-none bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c4dff] pr-8"
                  >
                    <option value="">— None —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Rating */}
          <section>
            <h3 className="text-xs font-semibold text-[#00c853] uppercase tracking-widest mb-3">
              Rating
            </h3>
            {userSettings.ratingStyle === "STARS" ? (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    <Star className={cn("w-7 h-7", star <= rating ? "text-[#ffc107] fill-[#ffc107]" : "text-[#30363d]")} />
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
                      "px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors",
                      letterRating === g
                        ? "bg-[#ffc107]/20 border-[#ffc107] text-[#ffc107]"
                        : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
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
            <h3 className="text-xs font-semibold text-[#00c853] uppercase tracking-widest mb-3">
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
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    selectedTagIds.includes(tag.id)
                      ? "bg-[#7c4dff]/20 border-[#7c4dff] text-[#7c4dff]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
                  )}
                >
                  {tag.name}
                </button>
              ))}
              {pendingNewTags.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#7c4dff]/20 border border-[#7c4dff] text-[#7c4dff] flex items-center gap-1"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => setPendingNewTags((prev) => prev.filter((t) => t !== name))}
                    className="hover:text-white"
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
                className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff]"
              />
              <button
                type="button"
                onClick={addNewTag}
                className="bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Section 4: Mistakes */}
          <section>
            <h3 className="text-xs font-semibold text-[#ff1744] uppercase tracking-widest mb-3">
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
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    selectedMistakeIds.includes(m.id)
                      ? "bg-[#ff1744]/20 border-[#ff1744] text-[#ff1744]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
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
                className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#ff1744]"
              />
              <button
                type="button"
                onClick={addNewMistake}
                className="bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Section 5: Psychology */}
          <section>
            <h3 className="text-xs font-semibold text-[#2979ff] uppercase tracking-widest mb-3">
              Psychology
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">Before Trade</label>
                <div className="relative">
                  <select
                    value={psychBefore}
                    onChange={(e) => setPsychBefore(e.target.value)}
                    className="w-full appearance-none bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2979ff] pr-8"
                  >
                    <option value="">— None —</option>
                    {PSYCHOLOGY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#8b949e] mb-1">After Trade</label>
                <div className="relative">
                  <select
                    value={psychAfter}
                    onChange={(e) => setPsychAfter(e.target.value)}
                    className="w-full appearance-none bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2979ff] pr-8"
                  >
                    <option value="">— None —</option>
                    {PSYCHOLOGY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e] pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Notes */}
          <section>
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Context, thesis, lessons learned..."
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:border-[#7c4dff] resize-none"
            />
          </section>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-[#0d1117] pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e] rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#00c853] hover:bg-[#00e676] disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? "Saving..." : tradeId ? "Update Trade" : "Save Trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
