"use client";

import { useState, useTransition } from "react";
import { Search, Star } from "lucide-react";
import { searchCatalog, addSolvedProblem, type CatalogHit } from "@/features/train/actions";
import { suggestPatterns } from "@/features/train/patterns";
import { PatternPicker } from "./pattern-picker";
import { CompanyPicker } from "./company-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddProblem() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [picked, setPicked] = useState<CatalogHit | null>(null);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [important, setImportant] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function runSearch(q: string) {
    setQuery(q); setMsg(null);
    if (!q.trim()) return setHits([]);
    start(async () => setHits(await searchCatalog(q)));
  }
  function pick(h: CatalogHit) {
    setPicked(h); setHits([]); setQuery(h.title);
    setPatterns(suggestPatterns(h.topicTags)); // pre-fill suggestions
  }
  function submit() {
    if (!picked) return;
    start(async () => {
      const res = await addSolvedProblem({
        slug: picked.slug, important, myRating: rating, comment: comment || null, patterns, companies,
      });
      if (!res.ok) return setMsg(res.error);
      setMsg(`Added "${picked.title}".`);
      setPicked(null); setQuery(""); setPatterns([]); setImportant(false); setRating(null); setComment(""); setCompanies([]);
    });
  }

  return (
    <div className="rounded-xl border border-(--color-border) p-5">
      <h2 className="mb-4 text-sm font-medium">Add a solved problem</h2>

      {!picked ? (
        <div className="relative">
          <div className="flex items-center gap-2 rounded-md border border-(--color-border) px-3">
            <Search className="size-4 text-(--color-ink-muted)" />
            <input value={query} placeholder="Search LeetCode by name…"
              onChange={(e) => runSearch(e.target.value)}
              className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          {hits.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-(--color-border) bg-(--color-surface) shadow-lg">
              {hits.map((h) => (
                <li key={h.slug}>
                  <button type="button" onClick={() => pick(h)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-(--color-surface-sunken)">
                    <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">
                      {h.frontendId ?? "—"}
                    </span>
                    <span className="flex-1 truncate">{h.title}</span>
                    <span className={cn("text-xs",
                      h.difficulty === "Easy" && "text-green-500",
                      h.difficulty === "Medium" && "text-amber-500",
                      h.difficulty === "Hard" && "text-red-500")}>{h.difficulty}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* auto-filled summary */}
          <div className="flex items-center justify-between rounded-md bg-(--color-surface-sunken) px-3 py-2">
            <div>
              <p className="text-sm font-medium">{picked.title}</p>
              <p className="text-xs text-(--color-ink-muted)">
                {picked.difficulty} · {picked.topicTags.join(", ") || "no tags"}
              </p>
            </div>
            <button type="button" onClick={() => { setPicked(null); setQuery(""); }}
              className="text-xs text-(--color-ink-muted) hover:text-(--color-ink)">change</button>
          </div>

          <div>
            <label className="mb-2 block text-xs text-(--color-ink-muted)">Pattern(s)</label>
            <PatternPicker value={patterns} suggestions={suggestPatterns(picked.topicTags)} onChange={setPatterns} />
          </div>

          <div>
            <label className="mb-2 block text-xs text-(--color-ink-muted)">Asked at (optional)</label>
            <CompanyPicker value={companies} onChange={setCompanies} />
          </div>

          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setImportant((v) => !v)}
              className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                important ? "border-amber-500 text-amber-500" : "border-(--color-border) text-(--color-ink-muted)")}>
              <Star className={cn("size-4", important && "fill-amber-500")} /> Important
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-(--color-ink-muted)">My difficulty:</span>
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n === rating ? null : n)}
                  className={cn("size-6 rounded text-xs", rating && n <= rating ? "bg-(--color-ink) text-(--color-surface)" : "border border-(--color-border) text-(--color-ink-muted)")}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Textarea rows={2} value={comment} placeholder="Optional comment — the trap, the trick, the insight"
            onChange={(e) => setComment(e.target.value)} />

          <div className="flex items-center gap-3">
            <Button disabled={pending} onClick={submit}>{pending ? "Adding…" : "Add problem"}</Button>
            {msg ? <span className="text-xs text-(--color-ink-muted)">{msg}</span> : null}
          </div>
        </div>
      )}
      {msg && !picked ? <p className="mt-3 text-xs text-(--color-ink-muted)">{msg}</p> : null}
    </div>
  );
}
