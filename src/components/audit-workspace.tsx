"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  Layers,
  Loader2,
  MonitorSmartphone,
  Plus,
  Presentation,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { ImageStats } from "@/lib/taxonomy";
import {
  SeverityBadge,
  CategoryChip,
  StatusBadge,
  AnalyzerChip,
  ConfidenceMeter,
  SectionLabel,
  fmtDate,
} from "@/components/ui";

/* ------------------------------------------------------------------ */

export interface WorkspaceAudit {
  id: string;
  title: string;
  kind: string;
  analyzer: string;
  createdAt: string;
  imageSrc: string;
  width: number | null;
  height: number | null;
  stats: ImageStats | null;
}

export interface WorkspaceFinding {
  id: string;
  source: string;
  category: string;
  severity: string;
  title: string;
  explanation: string;
  suggestion: string;
  wcag: string | null;
  confidence: number | null;
  bbox: { x: number; y: number; w: number; h: number } | null;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

const SEV_STROKE: Record<string, string> = {
  critical: "#fb7185",
  major: "#fbbf24",
  minor: "#7dd3fc",
};

/* ------------------------------------------------------------------ */

export function AuditWorkspace({
  audit,
  findings,
  vlmOnline,
}: {
  audit: WorkspaceAudit;
  findings: WorkspaceFinding[];
  vlmOnline: boolean;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    findings.find((f) => f.status === "pending")?.id ?? findings[0]?.id ?? null,
  );
  const [showOverlay, setShowOverlay] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<"reanalyze" | "delete" | null>(null);
  const [notice, setNotice] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const c = { confirmed: 0, rejected: 0, pending: 0, uncertain: 0 };
    for (const f of findings) c[f.status as keyof typeof c]++;
    return c;
  }, [findings]);

  const withBusy = (id: string, fn: () => Promise<void>) => {
    setBusyIds((s) => new Set(s).add(id));
    void fn().finally(() =>
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      }),
    );
  };

  const verify = (f: WorkspaceFinding, status: string) =>
    withBusy(f.id, async () => {
      const res = await fetch(`/api/findings/${f.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setNotice("Verification failed — please retry.");
        return;
      }
      setNotice("");
      router.refresh();
    });

  const removeFinding = (f: WorkspaceFinding) =>
    withBusy(f.id, async () => {
      await fetch(`/api/findings/${f.id}`, { method: "DELETE" });
      router.refresh();
    });

  const reanalyze = async () => {
    setActing("reanalyze");
    setNotice("");
    try {
      const res = await fetch(`/api/audits/${audit.id}/reanalyze`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setNotice(
        `Re-analyzed with ${json.analyzer === "qwen-vl" ? "Qwen-VL" : "the heuristic engine"} · ${json.added} pending finding${json.added === 1 ? "" : "s"} added. Verified verdicts were preserved.`,
      );
      router.refresh();
    } catch {
      setNotice("Re-analysis failed — image bytes may be unavailable.");
    } finally {
      setActing(null);
    }
  };

  const destroy = async () => {
    if (
      !window.confirm(
        `Delete “${audit.title}” and all of its findings? This also removes its labels from the evaluation set.`,
      )
    )
      return;
    setActing("delete");
    await fetch(`/api/audits/${audit.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  const select = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20">
      {/* header */}
      <div className="rise flex flex-wrap items-start justify-between gap-4 py-8">
        <div className="min-w-0">
          <Link
            href="/#queue"
            className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-inkdim transition hover:text-white"
          >
            <ArrowLeft size={13} /> Audit queue
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-white">
            {audit.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-inktext ring-1 ring-hairline">
              {audit.kind === "poster" ? (
                <Presentation size={12} />
              ) : (
                <MonitorSmartphone size={12} />
              )}
              {audit.kind === "poster" ? "Campus poster" : "UI screenshot"}
            </span>
            <AnalyzerChip analyzer={audit.analyzer} online={vlmOnline} />
            <span className="tabular rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-inkdim ring-1 ring-hairline">
              {fmtDate(audit.createdAt)}
              {audit.width ? ` · ${audit.width}×${audit.height}px` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reanalyze}
            disabled={acting !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-inktext transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            {acting === "reanalyze" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Re-run analysis
          </button>
          <button
            onClick={destroy}
            disabled={acting !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-fail/25 bg-fail/[0.06] px-3.5 py-2 text-[12px] font-medium text-fail transition hover:bg-fail/[0.12] disabled:opacity-50"
          >
            {acting === "delete" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>
        </div>
      </div>

      {notice && (
        <p className="rise mb-4 rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-[12px] text-inktext">
          {notice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        {/* ────────────────────────── image column */}
        <div className="rise rise-1">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
              <SectionLabel>Annotated artifact</SectionLabel>
              <div className="flex items-center gap-1.5">
                <span className="mr-1 text-[10px] text-inkdim">
                  {findings.filter((f) => f.bbox).length} regions
                </span>
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition ${
                    showOverlay
                      ? "bg-brand/15 text-brand ring-brand/30"
                      : "bg-white/[0.04] text-inkdim ring-hairline hover:text-white"
                  }`}
                >
                  <Layers size={12} />
                  {showOverlay ? "Overlays on" : "Overlays off"}
                </button>
              </div>
            </div>
            <div className="grid max-h-[74vh] place-items-center overflow-auto bg-ink/60 p-4">
              <figure className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={audit.imageSrc}
                  alt={audit.title}
                  className="block max-h-[68vh] max-w-full rounded-lg"
                />
                {showOverlay && (
                  <svg
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  >
                    {findings
                      .filter((f) => f.bbox)
                      .map((f) => {
                        const b = f.bbox!;
                        const active = selectedId === f.id;
                        const dim = selectedId && !active;
                        const color =
                          f.source === "human"
                            ? "#c4b5fd"
                            : SEV_STROKE[f.severity] ?? "#7dd3fc";
                        return (
                          <g key={f.id} opacity={dim ? 0.18 : 1}>
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.w}
                              height={b.h}
                              fill={color}
                              fillOpacity={active ? 0.16 : 0.05}
                              stroke={color}
                              strokeWidth={active ? 3 : 1.5}
                              vectorEffect="non-scaling-stroke"
                              strokeDasharray={
                                f.source === "human" ? "5 4" : undefined
                              }
                              rx={0.004}
                            />
                          </g>
                        );
                      })}
                  </svg>
                )}
                {/* click targets (HTML so we keep pointer events) */}
                {showOverlay &&
                  findings
                    .filter((f) => f.bbox)
                    .map((f) => {
                      const b = f.bbox!;
                      return (
                        <button
                          key={`t-${f.id}`}
                          aria-label={`Select finding: ${f.title}`}
                          onClick={() => select(f.id)}
                          className="absolute cursor-pointer"
                          style={{
                            left: `${b.x * 100}%`,
                            top: `${b.y * 100}%`,
                            width: `${b.w * 100}%`,
                            height: `${b.h * 100}%`,
                          }}
                        />
                      );
                    })}
              </figure>
            </div>
          </div>

          {/* evidence strip */}
          {audit.stats && (
            <div className="panel mt-3 p-5">
              <SectionLabel>Measured evidence (pixel analysis)</SectionLabel>
              <div className="tabular mt-4 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6">
                {[
                  {
                    k: "Mean luminance",
                    v: `${Math.round(audit.stats.meanLum * 100)}%`,
                  },
                  {
                    k: "Tonal range p10–p90",
                    v: `${audit.stats.tonalRangeRatio.toFixed(1)}:1`,
                  },
                  {
                    k: "Colorfulness",
                    v: audit.stats.colorfulness.toFixed(2),
                  },
                  {
                    k: "Edge density",
                    v: audit.stats.edgeDensity.toFixed(3),
                  },
                  {
                    k: "Dark pixels",
                    v: `${Math.round(audit.stats.darkPixelPct * 100)}%`,
                  },
                  {
                    k: "Red / green share",
                    v: `${Math.round(audit.stats.redShare * 100)}% / ${Math.round(
                      audit.stats.greenShare * 100,
                    )}%`,
                  },
                ].map((s) => (
                  <div key={s.k}>
                    <p className="text-[15px] font-semibold text-white">{s.v}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-inkdim">
                      {s.k}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ────────────────────────── findings column */}
        <div className="rise rise-2" ref={listRef}>
          <div className="panel flex items-center justify-between px-5 py-3.5">
            <SectionLabel>
              Findings · {findings.length}
            </SectionLabel>
            <div className="tabular flex gap-3 text-[11px]">
              <span className="text-pass">{counts.confirmed} TP</span>
              <span className="text-fail">{counts.rejected} FP</span>
              <span className="text-warn">{counts.pending} pending</span>
              {counts.uncertain > 0 && (
                <span className="text-inkdim">{counts.uncertain}? unsure</span>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {findings.length === 0 && (
              <div className="panel p-8 text-center">
                <p className="text-[14px] font-medium text-white">
                  No issues detected
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-inkdim">
                  The analyzer found no candidate issues. If you spot one it
                  missed, add it below — that counts as a false negative and
                  keeps recall honest.
                </p>
              </div>
            )}
            {findings.map((f, i) => {
              const active = selectedId === f.id;
              const busy = busyIds.has(f.id);
              const human = f.source === "human";
              return (
                <article
                  key={f.id}
                  onMouseEnter={() => setSelectedId(f.id)}
                  className={`panel panel-hover cursor-pointer p-5 ${
                    active ? "border-brand/40" : ""
                  }`}
                  onClick={() => select(f.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="tabular text-[11px] font-semibold text-inkdim">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <SeverityBadge severity={f.severity} />
                      <CategoryChip category={f.category} />
                      {human && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-violet-300/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">
                          <UserRound size={10} /> Human-added
                        </span>
                      )}
                    </div>
                    <StatusBadge status={f.status} />
                  </div>

                  <h3 className="mt-3 text-[14.5px] font-semibold leading-snug text-white">
                    {f.title}
                  </h3>

                  <div className="mt-3 space-y-3 text-[12.5px] leading-relaxed">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkdim">
                        Why it matters
                      </p>
                      <p className="text-inktext/85">{f.explanation}</p>
                    </div>
                    <div className="rounded-lg border border-brand/15 bg-brand/[0.05] p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                        Suggested fix
                      </p>
                      <p className="text-inktext/90">{f.suggestion}</p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {f.wcag && (
                      <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-info ring-1 ring-hairline">
                        WCAG {f.wcag}
                      </span>
                    )}
                    {!human && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-inkdim">
                        confidence <ConfidenceMeter value={f.confidence} />
                      </span>
                    )}
                    {f.verifiedBy && (
                      <span className="text-[10.5px] text-inkdim">
                        verified by {f.verifiedBy}
                      </span>
                    )}
                  </div>

                  {/* verification controls */}
                  <div
                    className="mt-4 flex items-center gap-1.5 border-t border-hairline pt-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkdim">
                      {human ? "Ground truth" : "Verify"}
                    </span>
                    {!human && (
                      <>
                        <VerifyButton
                          label="Correct"
                          icon={<Check size={13} />}
                          active={f.status === "confirmed"}
                          tone="pass"
                          disabled={busy}
                          onClick={() => verify(f, "confirmed")}
                        />
                        <VerifyButton
                          label="False alarm"
                          icon={<X size={13} />}
                          active={f.status === "rejected"}
                          tone="fail"
                          disabled={busy}
                          onClick={() => verify(f, "rejected")}
                        />
                        <VerifyButton
                          label="Unsure"
                          icon={<CircleHelp size={13} />}
                          active={f.status === "uncertain"}
                          tone="dim"
                          disabled={busy}
                          onClick={() => verify(f, "uncertain")}
                        />
                      </>
                    )}
                    <span className="ml-auto flex items-center gap-1">
                      {busy && (
                        <Loader2 size={13} className="animate-spin text-inkdim" />
                      )}
                      {f.status !== "pending" && !human && (
                        <button
                          title="Reset to pending"
                          disabled={busy}
                          onClick={() => verify(f, "pending")}
                          className="grid h-7 w-7 place-items-center rounded-md text-inkdim ring-1 ring-hairline transition hover:text-white"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      {human && (
                        <button
                          title="Remove this human-added note"
                          disabled={busy}
                          onClick={() => removeFinding(f)}
                          className="grid h-7 w-7 place-items-center rounded-md text-inkdim ring-1 ring-hairline transition hover:text-fail"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <AddFindingForm auditId={audit.id} />
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function VerifyButton({
  label,
  icon,
  active,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  tone: "pass" | "fail" | "dim";
  disabled: boolean;
  onClick: () => void;
}) {
  const tones = {
    pass: active
      ? "border-pass/50 bg-pass/15 text-pass"
      : "border-hairline bg-white/[0.03] text-inkdim hover:border-pass/40 hover:text-pass",
    fail: active
      ? "border-fail/50 bg-fail/15 text-fail"
      : "border-hairline bg-white/[0.03] text-inkdim hover:border-fail/40 hover:text-fail",
    dim: active
      ? "border-white/30 bg-white/[0.08] text-white"
      : "border-hairline bg-white/[0.03] text-inkdim hover:border-white/25 hover:text-white",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
  ["contrast", "Low contrast"],
  ["color", "Color reliance"],
  ["typography", "Type & legibility"],
  ["clutter", "Visual clutter"],
  ["hierarchy", "Hierarchy"],
  ["touch_target", "Target size"],
  ["label", "Labels / alt text"],
  ["other", "Other"],
] as const;

function AddFindingForm({ auditId }: { auditId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "contrast",
    severity: "major",
    title: "",
    explanation: "",
    suggestion: "",
    wcag: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/findings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auditId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      setForm({
        category: "contrast",
        severity: "major",
        title: "",
        explanation: "",
        suggestion: "",
        wcag: "",
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save finding");
    } finally {
      setSending(false);
    }
  };

  const field =
    "w-full rounded-lg border border-hairline bg-ink px-3 py-2 text-[12.5px] text-white placeholder:text-inkdim/60 outline-none transition focus:border-brand/50";

  return (
    <div className="panel mt-3 p-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-[12.5px] font-medium text-inkdim transition hover:border-brand/40 hover:text-brand"
        >
          <Plus size={14} />
          Report an issue the model missed (adds a false negative)
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Missed issue · counts as FN for recall</SectionLabel>
            <button
              onClick={() => setOpen(false)}
              className="text-inkdim transition hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <select
              value={form.category}
              onChange={(e) => set("category")(e.target.value)}
              className={field}
            >
              {CATEGORY_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={form.severity}
              onChange={(e) => set("severity")(e.target.value)}
              className={field}
            >
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
          <input
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="Short title — what is wrong?"
            className={`${field} mt-2.5`}
          />
          <textarea
            value={form.explanation}
            onChange={(e) => set("explanation")(e.target.value)}
            placeholder="Explanation — what did you see, who is affected, which WCAG criterion?"
            rows={3}
            className={`${field} mt-2.5 resize-none`}
          />
          <textarea
            value={form.suggestion}
            onChange={(e) => set("suggestion")(e.target.value)}
            placeholder="Suggested fix"
            rows={2}
            className={`${field} mt-2.5 resize-none`}
          />
          <input
            value={form.wcag}
            onChange={(e) => set("wcag")(e.target.value)}
            placeholder="WCAG criterion (optional, e.g. 1.1.1 Non-text Content)"
            className={`${field} mt-2.5`}
          />
          {error && <p className="mt-2.5 text-[12px] text-fail">{error}</p>}
          <button
            onClick={submit}
            disabled={
              sending ||
              form.title.trim().length < 3 ||
              form.explanation.trim().length < 5 ||
              form.suggestion.trim().length < 5
            }
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-[#ffc46b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Add as ground-truth finding
          </button>
        </div>
      )}
    </div>
  );
}
