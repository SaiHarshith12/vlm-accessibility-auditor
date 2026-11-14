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
  Crosshair,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
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

const SEV_BORDER: Record<string, string> = {
  critical: "border-l-rose-500",
  major: "border-l-amber-400",
  minor: "border-l-cyan-400",
};

const SEV_STROKE: Record<string, string> = {
  critical: "#f43f5e",
  major: "#f59e0b",
  minor: "#06b6d4",
};

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
        setNotice("Verification update failed — please retry.");
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
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setNotice(
        `Re-analyzed with ${json.analyzer === "qwen-vl" ? "Qwen-VL model" : "deterministic heuristic engine"}. ${json.added} candidate finding(s) refreshed. Existing verified ground-truth labels remained write-protected.`,
      );
      router.refresh();
    } catch {
      setNotice("Re-analysis failed — source image bytes may be unreachable.");
    } finally {
      setActing(null);
    }
  };

  const destroy = async () => {
    if (
      !window.confirm(
        `Permanently delete "${audit.title}" and its associated verification records?`,
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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-8 border-b border-hairline/80">
        <div className="min-w-0">
          <Link
            href="/#queue"
            className="mb-2.5 inline-flex items-center gap-1.5 font-mono text-[11.5px] font-medium text-inkdim transition hover:text-brand"
          >
            <ArrowLeft size={13} />
            <span>RETURN TO INSPECTION QUEUE</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-3">
            <span>{audit.title}</span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-1 px-2.5 py-1 font-mono text-[11px] font-medium text-inktext">
              {audit.kind === "poster" ? (
                <Presentation size={13} className="text-brand" />
              ) : (
                <MonitorSmartphone size={13} className="text-cyan-400" />
              )}
              {audit.kind === "poster" ? "Campus Poster" : "UI Screen"}
            </span>

            <AnalyzerChip analyzer={audit.analyzer} online={vlmOnline} />

            <span className="tabular rounded-md border border-hairline bg-surface-1 px-2.5 py-1 font-mono text-[11px] text-inkdim">
              {fmtDate(audit.createdAt)}
              {audit.width ? ` · ${audit.width}×${audit.height}px` : ""}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono text-[12px]">
          <button
            onClick={reanalyze}
            disabled={acting !== null}
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface-1 px-3.5 py-2 font-semibold text-white transition hover:border-brand/40 hover:bg-surface-2 disabled:opacity-50"
          >
            {acting === "reanalyze" ? (
              <Loader2 size={14} className="animate-spin text-brand" />
            ) : (
              <RefreshCw size={14} className="text-brand" />
            )}
            <span>Re-Run Vision Model</span>
          </button>
          <button
            onClick={destroy}
            disabled={acting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-3.5 py-2 font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            {acting === "delete" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="my-4 rounded-xl border border-brand/40 bg-brand/[0.08] px-4 py-3 font-mono text-[12px] text-brand-bright flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-brand hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── SPLIT VIEWPORT & FINDINGS ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_460px]">
        {/* Left: Viewport and Pixel Stats */}
        <div className="space-y-4">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-hairline bg-surface-0/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <SectionLabel badge={`${findings.filter((f) => f.bbox).length} REGIONS`}>
                  Annotated Viewport
                </SectionLabel>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                    showOverlay
                      ? "border-brand/40 bg-brand/15 text-brand shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "border-hairline bg-surface-1 text-inkdim hover:text-white"
                  }`}
                >
                  <Layers size={13} />
                  <span>{showOverlay ? "Overlays Active" : "Overlays Hidden"}</span>
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="relative grid max-h-[76vh] place-items-center overflow-auto bg-ink-950/95 p-4 select-none">
              <figure className="relative inline-block rounded-lg overflow-hidden border border-hairline/80 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={audit.imageSrc}
                  alt={audit.title}
                  className="block max-h-[70vh] max-w-full"
                />

                {/* SVG Bounding Boxes Overlay */}
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
                            ? "#a78bfa"
                            : SEV_STROKE[f.severity] ?? "#38bdf8";

                        return (
                          <g key={f.id} opacity={dim ? 0.22 : 1}>
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.w}
                              height={b.h}
                              fill={color}
                              fillOpacity={active ? 0.22 : 0.08}
                              stroke={color}
                              strokeWidth={active ? 3 : 1.5}
                              vectorEffect="non-scaling-stroke"
                              strokeDasharray={f.source === "human" ? "4 3" : undefined}
                              rx={0.003}
                            />
                          </g>
                        );
                      })}
                  </svg>
                )}

                {/* Click Targets */}
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

          {/* Measured Pixel Forensics Strip */}
          {audit.stats && (
            <div className="surface-card p-5">
              <SectionLabel badge="PIXEL ENGINE">Measured Ground-Truth Evidence</SectionLabel>
              <div className="tabular font-mono mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  {
                    k: "Luminance",
                    v: `${Math.round(audit.stats.meanLum * 100)}%`,
                    sub: "Mean Intensity",
                  },
                  {
                    k: "Tonal Range",
                    v: `${audit.stats.tonalRangeRatio.toFixed(1)}:1`,
                    sub: "p10–p90 spread",
                  },
                  {
                    k: "Colorfulness",
                    v: audit.stats.colorfulness.toFixed(2),
                    sub: "Hasler-Süsstrunk",
                  },
                  {
                    k: "Edge Density",
                    v: audit.stats.edgeDensity.toFixed(3),
                    sub: "Sobel Gradient",
                  },
                  {
                    k: "Dark Pixels",
                    v: `${Math.round(audit.stats.darkPixelPct * 100)}%`,
                    sub: "Lum < 0.15",
                  },
                  {
                    k: "Red/Green Share",
                    v: `${Math.round(audit.stats.redShare * 100)}% / ${Math.round(
                      audit.stats.greenShare * 100,
                    )}%`,
                    sub: "Deuteranopia",
                  },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg border border-hairline/60 bg-surface-0/60 p-2.5">
                    <p className="text-[10px] uppercase text-inkdim tracking-wider font-semibold">
                      {s.k}
                    </p>
                    <p className="mt-1 text-[16px] font-bold text-white">{s.v}</p>
                    <p className="text-[9px] text-brand-light/70">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Findings Adjudication Panel */}
        <div className="space-y-4" ref={listRef}>
          {/* Adjudication Status Bar */}
          <div className="surface-card flex items-center justify-between px-4 py-3">
            <SectionLabel badge={`${findings.length} TOTAL`}>Candidate Findings</SectionLabel>
            <div className="tabular font-mono flex items-center gap-2.5 text-[11px]">
              <span className="text-emerald-400 font-bold">{counts.confirmed} TP</span>
              <span className="text-rose-400 font-bold">{counts.rejected} FP</span>
              <span className="text-amber-400 font-bold">{counts.pending} In Queue</span>
            </div>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-3">
            {findings.length === 0 && (
              <div className="surface-card p-8 text-center font-mono">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-[14px] font-bold text-white">No Issues Detected</p>
                <p className="mt-1 text-[12px] text-inkdim leading-relaxed">
                  Both models reported 0 candidate defects. If you spot a violation they missed, report it below to register a False Negative.
                </p>
              </div>
            )}

            {findings.map((f, i) => {
              const active = selectedId === f.id;
              const busy = busyIds.has(f.id);
              const human = f.source === "human";
              const borderCls = SEV_BORDER[f.severity] || "border-l-brand";

              return (
                <article
                  key={f.id}
                  onClick={() => select(f.id)}
                  className={`surface-card p-5 cursor-pointer border-l-4 transition-all ${borderCls} ${
                    active
                      ? "ring-2 ring-brand/50 bg-surface-1 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      : "hover:border-hairline-bright"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="tabular font-mono text-[11px] font-bold text-inkdim">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <SeverityBadge severity={f.severity} />
                      <CategoryChip category={f.category} />
                      {human && (
                        <span className="inline-flex items-center gap-1 rounded bg-violet-400/10 border border-violet-400/30 px-2 py-0.5 font-mono text-[10px] text-violet-300">
                          <UserRound size={11} /> Human Ground Truth
                        </span>
                      )}
                    </div>
                    <StatusBadge status={f.status} />
                  </div>

                  {/* Finding Title */}
                  <h3 className="mt-2.5 font-mono text-[14px] font-bold leading-snug text-white">
                    {f.title}
                  </h3>

                  {/* Reasoning & Suggestion Box */}
                  <div className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed">
                    <p className="text-inktext/85">{f.explanation}</p>
                    <div className="rounded-lg border border-brand/20 bg-brand/[0.06] p-3">
                      <p className="mb-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-brand">
                        Suggested Remediation
                      </p>
                      <p className="text-brand-bright/90 font-medium text-[12px]">{f.suggestion}</p>
                    </div>
                  </div>

                  {/* Technical Footer */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline/60 pt-3 font-mono text-[10.5px]">
                    <div className="flex items-center gap-3">
                      {f.wcag && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-cyan-300 border border-cyan-400/30">
                          WCAG {f.wcag}
                        </span>
                      )}
                      {!human && <ConfidenceMeter value={f.confidence} />}
                    </div>

                    {f.verifiedBy && (
                      <span className="text-inkdim text-[10px]">
                        adjudicated by {f.verifiedBy}
                      </span>
                    )}
                  </div>

                  {/* Adjudication Buttons */}
                  <div
                    className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-hairline/60 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-mono text-[10px] uppercase font-bold text-inkdim tracking-wider mr-1">
                      {human ? "Ground Truth" : "Adjudicate:"}
                    </span>

                    {!human && (
                      <>
                        <button
                          onClick={() => verify(f, "confirmed")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition border ${
                            f.status === "confirmed"
                              ? "bg-emerald-500 text-ink-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                              : "border-hairline bg-surface-2 text-inkdim hover:text-emerald-300 hover:border-emerald-500/40"
                          }`}
                        >
                          <Check size={13} />
                          <span>Correct (TP)</span>
                        </button>

                        <button
                          onClick={() => verify(f, "rejected")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition border ${
                            f.status === "rejected"
                              ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                              : "border-hairline bg-surface-2 text-inkdim hover:text-rose-300 hover:border-rose-500/40"
                          }`}
                        >
                          <X size={13} />
                          <span>False Alarm (FP)</span>
                        </button>

                        <button
                          onClick={() => verify(f, "uncertain")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-medium transition border ${
                            f.status === "uncertain"
                              ? "bg-surface-3 text-white border-white/30"
                              : "border-hairline bg-surface-2 text-inkdim hover:text-white"
                          }`}
                        >
                          <CircleHelp size={12} />
                          <span>Unsure</span>
                        </button>
                      </>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      {busy && <Loader2 size={13} className="animate-spin text-brand" />}
                      {f.status !== "pending" && !human && (
                        <button
                          title="Reset status back to pending"
                          disabled={busy}
                          onClick={() => verify(f, "pending")}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-surface-2 text-inkdim transition hover:text-white hover:border-brand/40"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      {human && (
                        <button
                          title="Delete human finding"
                          disabled={busy}
                          onClick={() => removeFinding(f)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-surface-2 text-inkdim transition hover:text-rose-400 hover:border-rose-500/40"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Add Missed Issue (False Negative) */}
          <AddFindingForm auditId={audit.id} />
        </div>
      </div>
    </main>
  );
}

const CATEGORY_OPTIONS = [
  ["contrast", "Low Contrast (1.4.3)"],
  ["color", "Color Reliance (1.4.1)"],
  ["typography", "Typography & Spacing (1.4.12)"],
  ["clutter", "Visual Clutter & Crowding"],
  ["hierarchy", "Heading & Visual Hierarchy"],
  ["touch_target", "Touch Target Size (2.5.5)"],
  ["label", "Labels & Accessible Text (3.3.2)"],
  ["other", "Other WCAG Defect"],
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
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
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
    "w-full rounded-lg border border-hairline bg-surface-0 px-3 py-2 font-mono text-[12px] text-white placeholder:text-inkdim/60 outline-none transition focus:border-brand/70";

  return (
    <div className="surface-card p-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hairline-bright py-3.5 font-mono text-[12px] font-semibold text-brand transition hover:border-brand hover:bg-brand/[0.05]"
        >
          <Plus size={14} />
          <span>Report Missed Violation (Logs False Negative for Recall)</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
            <SectionLabel badge="GROUND TRUTH INPUT">Record Model Omission</SectionLabel>
            <button onClick={() => setOpen(false)} className="text-inkdim hover:text-white">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
              <option value="critical">Critical Severity</option>
              <option value="major">Major Severity</option>
              <option value="minor">Minor Severity</option>
            </select>
          </div>

          <input
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="Short Title (e.g., Unlabeled Schedule Table Header)"
            className={field}
          />

          <textarea
            value={form.explanation}
            onChange={(e) => set("explanation")(e.target.value)}
            placeholder="Detailed Explanation: what was missed, who is affected, and what the model overlooked"
            rows={3}
            className={`${field} resize-none`}
          />

          <textarea
            value={form.suggestion}
            onChange={(e) => set("suggestion")(e.target.value)}
            placeholder="Recommended Fix: exact visual or structural remediation"
            rows={2}
            className={`${field} resize-none`}
          />

          <input
            value={form.wcag}
            onChange={(e) => set("wcag")(e.target.value)}
            placeholder="WCAG Criterion (e.g. 1.4.3 Contrast Minimum)"
            className={field}
          />

          {error && <p className="font-mono text-[11.5px] text-rose-400">{error}</p>}

          <button
            onClick={submit}
            disabled={
              sending ||
              form.title.trim().length < 3 ||
              form.explanation.trim().length < 5 ||
              form.suggestion.trim().length < 5
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-amber-500 py-2.5 font-mono text-[12.5px] font-bold text-ink-950 shadow-[0_0_20px_-3px_rgba(245,158,11,0.5)] transition hover:brightness-110 disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>Commit Ground-Truth Finding</span>
          </button>
        </div>
      )}
    </div>
  );
}
