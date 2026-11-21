"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "@/components/icons";
import type { ImageStats } from "@/lib/taxonomy";
import {
  SeverityBadge,
  CategoryChip,
  StatusBadge,
  AnalyzerChip,
  ConfidenceMeter,
  ActiveModelBanner,
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
  humanSeverity?: string | null;
  remediationRating?: string | null;
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
  critical: "border-l-[var(--color-vermilion)]",
  major: "border-l-[var(--color-sienna)]",
  minor: "border-l-[var(--point-mid)]",
};

const SEV_STROKE: Record<string, string> = {
  critical: "var(--color-vermilion)",
  major: "var(--color-sienna)",
  minor: "var(--point-mid)",
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
  const [ratings, setRatings] = useState<Record<string, "helpful" | "not_helpful" | null>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const c = { confirmed: 0, rejected: 0, pending: 0, uncertain: 0 };
    for (const f of findings) c[f.status as keyof typeof c]++;
    return c;
  }, [findings]);

  const sevCounts = useMemo(() => {
    const s = { critical: 0, major: 0, minor: 0 };
    for (const f of findings) {
      if (f.severity in s) s[f.severity as keyof typeof s]++;
    }
    return s;
  }, [findings]);

  const [sevFilter, setSevFilter] = useState<"all" | "critical" | "major" | "minor">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");
  const [viewMode, setViewMode] = useState<"single" | "list">("single");

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (sevFilter !== "all" && f.severity !== sevFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      return true;
    });
  }, [findings, sevFilter, statusFilter]);

  const activeIndex = useMemo(() => {
    if (!selectedId) return 0;
    const idx = filteredFindings.findIndex((f) => f.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [filteredFindings, selectedId]);

  const currentFinding = filteredFindings[activeIndex] ?? null;

  useEffect(() => {
    if (filteredFindings.length > 0) {
      if (!selectedId || !filteredFindings.some((f) => f.id === selectedId)) {
        setSelectedId(filteredFindings[0].id);
      }
    }
  }, [filteredFindings, selectedId]);

  const nextPendingId = useMemo(() => {
    if (filteredFindings.length === 0) return null;
    for (let i = activeIndex + 1; i < filteredFindings.length; i++) {
      if (filteredFindings[i].status === "pending") return filteredFindings[i].id;
    }
    for (let i = 0; i < activeIndex; i++) {
      if (filteredFindings[i].status === "pending") return filteredFindings[i].id;
    }
    return null;
  }, [filteredFindings, activeIndex]);

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

  const reanalyze = async (allowFallback = false) => {
    setActing("reanalyze");
    setNotice("");
    try {
      const res = await fetch(`/api/audits/${audit.id}/reanalyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowFallback }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.vlmFailed || res.status === 424) {
          const proceed = window.confirm(
            "Primary Qwen-VL model failed to respond or is currently offline.\n\nWould you like to proceed with the alternative Deterministic Pixel Engine fallback?",
          );
          if (proceed) {
            return reanalyze(true);
          }
          setNotice("Re-analysis cancelled: Qwen-VL model was unavailable.");
          return;
        }
        throw new Error(json.error ?? "Failed");
      }
      setNotice(
        `Re-analyzed with ${json.analyzer === "qwen-vl" ? "Qwen-VL model" : "Deterministic Pixel Engine fallback"}. ${json.added} candidate finding(s) refreshed. Existing verified ground-truth labels remained write-protected.`,
      );
      router.refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Re-analysis failed — source image bytes may be unreachable.");
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

  const rateRemediation = async (findingId: string, rating: "helpful" | "not_helpful") => {
    const current = (ratings[findingId] !== undefined
      ? ratings[findingId]
      : findings.find((f) => f.id === findingId)?.remediationRating ?? null) as
      | "helpful"
      | "not_helpful"
      | null;
    const nextRating = current === rating ? null : rating;

    // Optimistic state update
    setRatings((prev) => ({ ...prev, [findingId]: nextRating }));

    try {
      await fetch(`/api/findings/${findingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ remediationRating: nextRating }),
      });
      router.refresh();
    } catch {
      // Revert if network failed
      setRatings((prev) => ({ ...prev, [findingId]: current }));
    }
  };

  const select = (id: string) => {
    if (viewMode === "single") {
      setSelectedId(id);
    } else {
      setSelectedId((prev) => (prev === id ? null : id));
    }
    const isFilteredOut = !findings
      .filter((f) => {
        if (sevFilter !== "all" && f.severity !== sevFilter) return false;
        if (statusFilter !== "all" && f.status !== statusFilter) return false;
        return true;
      })
      .some((f) => f.id === id);
    if (isFilteredOut) {
      setSevFilter("all");
      setStatusFilter("all");
    }
    const cardEl = document.getElementById(`finding-card-${id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const [focusMode, setFocusMode] = useState<"all" | "selected">("all");
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-8 border-b border-[var(--color-rule)]">
        <div className="min-w-0">
          <Link
            href="/#queue"
            className="mb-2.5 inline-flex items-center gap-1.5 font-sans text-[12px] text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
          >
            <ArrowLeft size={13} />
            <span>Return to inspection queue</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-ink)] font-display flex items-center gap-3">
            <span>{audit.title}</span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-1 font-sans text-[11.5px] text-[var(--color-ink)]">
              {audit.kind === "poster" ? (
                <Presentation size={13} className="text-[var(--color-accent)]" />
              ) : (
                <MonitorSmartphone size={13} className="text-[var(--point-mid)]" />
              )}
              {audit.kind === "poster" ? "Campus Poster" : "UI Screen"}
            </span>

            <AnalyzerChip analyzer={audit.analyzer} online={vlmOnline} />

            <span className="tabular num rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-muted)]">
              {fmtDate(audit.createdAt)}
              {audit.width ? ` · ${audit.width}×${audit.height}px` : ""}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 font-sans text-[12px]">
          <Link
            href={`/report/${audit.id}`}
            className="btn btn--primary btn--sm"
          >
            <FileText size={14} />
            <span>Executive report →</span>
          </Link>
          <button
            onClick={() => void reanalyze(false)}
            disabled={acting !== null}
            className="btn btn--line btn--sm disabled:opacity-50"
          >
            {acting === "reanalyze" ? (
              <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
            ) : (
              <RefreshCw size={14} className="text-[var(--color-accent)]" />
            )}
            <span>Re-run vision model</span>
          </button>
          <button
            onClick={destroy}
            disabled={acting !== null}
            className="btn btn--line btn--sm border-[var(--color-vermilion)]/40 text-[var(--color-vermilion)] hover:bg-[var(--color-vermilion)]/10 disabled:opacity-50"
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
        <div className="my-4 rounded-[var(--radius-card)] border border-[var(--color-accent)] bg-[var(--color-paper-2)] px-4 py-3 font-sans text-[12.5px] text-[var(--color-accent)] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-[var(--color-accent)] hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── ACTIVE MODEL TELEMETRY HUD ── */}
      <div className="mt-6">
        <ActiveModelBanner analyzer={audit.analyzer} online={vlmOnline} />
      </div>

      {/* ── SPLIT VIEWPORT & FINDINGS ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_460px]">
        {/* Left: Viewport and Pixel Stats */}
        <div className="space-y-4">
          <div className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-3 font-sans">
              <div className="flex items-center gap-2">
                <SectionLabel badge={`${findings.filter((f) => f.bbox).length} HIGHLIGHT WINDOWS`}>
                  Annotated Viewport
                </SectionLabel>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono">
                {mouseCoords && (
                  <span className="text-[var(--color-muted)] hidden sm:inline-flex items-center gap-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-2 py-0.5 rounded-[4px] text-[10px]">
                    <Crosshair size={11} className="text-[var(--color-accent)]" />
                    <span>X:{mouseCoords.x}% Y:{mouseCoords.y}%</span>
                  </span>
                )}
                
                <button
                  onClick={() => setFocusMode((m) => (m === "all" ? "selected" : "all"))}
                  className={`inline-flex items-center gap-1 rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium border font-sans transition ${
                    focusMode === "selected"
                      ? "border-[var(--color-ink)] bg-[var(--color-paper-3)] text-[var(--color-ink)] font-semibold"
                      : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                  title="Toggle between displaying all bounding boxes or only the currently selected window"
                >
                  <span>{focusMode === "all" ? "Show all" : "Focus selected"}</span>
                </button>

                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium border font-sans transition ${
                    showOverlay
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] font-semibold"
                      : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  <Layers size={13} />
                  <span>{showOverlay ? "Overlays active" : "Overlays hidden"}</span>
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              className="relative grid max-h-[76vh] place-items-center overflow-auto bg-[var(--color-paper-3)] p-4 select-none cursor-crosshair border-b border-[var(--color-rule)]"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMouseCoords({
                  x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                  y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
                });
              }}
              onMouseLeave={() => setMouseCoords(null)}
            >
              {/* Image & Overlay Container (Wraps image snugly so bounding boxes align perfectly) */}
              <div className="relative inline-block max-w-full rounded-lg overflow-visible border border-[var(--color-rule)] shadow-md bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={audit.imageSrc}
                  alt={audit.title}
                  className="block max-h-[70vh] w-auto max-w-full object-contain mx-auto rounded-[6px]"
                />

                {/* Tactical Bounding Box Highlight Windows */}
                {showOverlay && (
                  <div className="absolute inset-0 pointer-events-none rounded-[6px]">
                    {findings
                      .filter((f) => f.bbox)
                      .map((f, i) => {
                        const b = f.bbox!;
                        const active = selectedId === f.id;
                        const isHuman = f.source === "human";
                        const sev = f.severity;

                        // If user switched to "focus selected only", hide other boxes
                        if (focusMode === "selected" && !active) {
                          return null;
                        }

                        // Determine tactical border & tint color classes
                        const colorCls = isHuman
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : sev === "critical"
                          ? "border-[var(--color-vermilion)] bg-[var(--color-vermilion)]/10 text-[var(--color-vermilion)]"
                          : sev === "major"
                          ? "border-[var(--color-sienna)] bg-[var(--color-sienna)]/10 text-[var(--color-sienna)]"
                          : "border-[var(--point-mid)] bg-[var(--point-mid)]/10 text-[var(--point-mid)]";

                        return (
                          <div
                            key={`bbox-${f.id}`}
                            id={`bbox-box-${f.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              select(f.id);
                            }}
                            style={{
                              left: `${b.x * 100}%`,
                              top: `${b.y * 100}%`,
                              width: `${b.w * 100}%`,
                              height: `${b.h * 100}%`,
                            }}
                            className={`absolute pointer-events-auto rounded-[3px] cursor-pointer transition-all duration-150 border-2 ${colorCls} ${
                              active
                                ? "ring-2 ring-[var(--color-ink)] shadow-md z-30"
                                : "hover:ring-1 hover:ring-[var(--color-ink)] z-10"
                            }`}
                          >
                            {/* Tactical Reticle Bracket Corners */}
                            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-inherit" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-inherit" />
                            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-inherit" />
                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-inherit" />

                            {/* Floating Window Identification Pill */}
                            <div
                              className={`absolute -top-6 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[9.5px] border ${
                                active
                                  ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]"
                                  : "bg-[var(--color-paper-2)] text-[var(--color-ink)] border-[var(--color-rule)]"
                              }`}
                            >
                              <span>#{String(i + 1).padStart(2, "0")}</span>
                              <span className="opacity-50">·</span>
                              <span>{f.wcag ? f.wcag.split(" ")[0] : f.category}</span>
                              {f.confidence != null && (
                                <>
                                  <span className="opacity-50">·</span>
                                  <span>{Math.round(f.confidence * 100)}%</span>
                                </>
                              )}
                            </div>

                            {/* Active Reticle Target */}
                            {active && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Crosshair size={18} className="text-[var(--color-accent)]" />
                              </div>
                            )}

                            {/* Corner Coordinate Readout */}
                            {active && (
                              <div className="absolute -bottom-5 right-0 rounded-[3px] bg-[var(--color-paper-2)] border border-[var(--color-rule)] px-1.5 py-0.2 font-mono text-[9px] text-[var(--color-ink)] shadow-sm">
                                X:{Math.round(b.x * 100)}% Y:{Math.round(b.y * 100)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
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
                  <div key={s.k} className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-2.5">
                    <p className="text-[10px] text-[var(--color-muted)] font-mono">
                      {s.k}
                    </p>
                    <p className="mt-1 text-[15px] text-[var(--color-ink)] font-mono num tabular">{s.v}</p>
                    <p className="text-[9px] text-[var(--color-muted)]">{s.sub}</p>
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
            <div className="tabular font-mono flex items-center gap-2.5 text-[11.5px]">
              <span className="text-[var(--color-accent)]">{counts.confirmed} TP</span>
              <span className="text-[var(--color-vermilion)]">{counts.rejected} FP</span>
              <span className="text-[var(--color-sienna)]">{counts.pending} In queue</span>
            </div>
          </div>

          {/* Interactive Grouping, Filter & View Controls */}
          {findings.length > 0 && (
            <div className="surface-card p-3.5 space-y-3 font-sans text-[12px]">
              {/* Top Row: View Mode Toggle & Single-View Stepper */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-2.5">
                {/* View Mode Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[var(--color-muted)] mr-1">View:</span>
                  <button
                    type="button"
                    onClick={() => setViewMode("single")}
                    className={`rounded-full px-3 py-1 text-[11.5px] transition border ${
                      viewMode === "single"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                        : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    Single focus
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-full px-3 py-1 text-[11.5px] transition border ${
                      viewMode === "list"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                        : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    List ({filteredFindings.length})
                  </button>
                </div>

                {/* Single View Stepper Controls */}
                {viewMode === "single" && filteredFindings.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* « First */}
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={() => setSelectedId(filteredFindings[0].id)}
                      title="First finding"
                      className="h-7 w-7 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] hover:border-[var(--color-rule-2)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-mono text-[11px]"
                    >
                      «
                    </button>
                    {/* ‹ Prev */}
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={() => setSelectedId(filteredFindings[Math.max(0, activeIndex - 1)].id)}
                      title="Previous finding"
                      className="h-7 w-7 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] hover:border-[var(--color-rule-2)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[13px] font-mono"
                    >
                      ‹
                    </button>

                    {/* Counter readout */}
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] font-mono num tabular text-[11px]">
                      #{String(activeIndex + 1).padStart(2, "0")} / {String(filteredFindings.length).padStart(2, "0")}
                    </span>

                    {/* › Next */}
                    <button
                      type="button"
                      disabled={activeIndex >= filteredFindings.length - 1}
                      onClick={() =>
                        setSelectedId(
                           filteredFindings[Math.min(filteredFindings.length - 1, activeIndex + 1)].id
                        )
                      }
                      title="Next finding"
                      className="h-7 w-7 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] hover:border-[var(--color-rule-2)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-[13px] font-mono"
                    >
                      ›
                    </button>
                    {/* » Last */}
                    <button
                      type="button"
                      disabled={activeIndex >= filteredFindings.length - 1}
                      onClick={() =>
                        setSelectedId(filteredFindings[filteredFindings.length - 1].id)
                      }
                      title="Last finding"
                      className="h-7 w-7 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] hover:border-[var(--color-rule-2)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-mono text-[11px]"
                    >
                      »
                    </button>

                    {/* Next Pending Shortcut */}
                    {nextPendingId && (
                      <button
                        type="button"
                        onClick={() => setSelectedId(nextPendingId)}
                        title="Jump to next pending finding needing review"
                        className="ml-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-accent)]/30 px-2.5 py-1 text-[11px] text-[var(--color-accent)] hover:border-[var(--color-accent)] transition"
                      >
                        <span>Next pending</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Filter Chips Rows */}
              <div className="space-y-2 font-sans">
                {/* Severity Filter Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--color-muted)] mr-1">Severity:</span>
                  {(
                    [
                      ["all", `All (${findings.length})`],
                      ["critical", `Critical (${sevCounts.critical})`],
                      ["major", `Major (${sevCounts.major})`],
                      ["minor", `Minor (${sevCounts.minor})`],
                    ] as const
                  ).map(([val, label]) => {
                    const active = sevFilter === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSevFilter(val)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] transition border ${
                          active
                            ? val === "critical"
                              ? "bg-[var(--color-paper-3)] text-[var(--color-vermilion)] border-[var(--color-vermilion)]/40 font-medium"
                              : val === "major"
                              ? "bg-[var(--color-paper-3)] text-[var(--color-sienna)] border-[var(--color-sienna)]/40 font-medium"
                              : val === "minor"
                              ? "bg-[var(--color-paper-3)] text-[var(--point-mid)] border-[var(--color-rule)] font-medium"
                              : "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-medium"
                            : "bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Status Filter Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--color-muted)] mr-1">Status:</span>
                  {(
                    [
                      ["all", "All"],
                      ["pending", `Awaiting (${counts.pending})`],
                      ["confirmed", `TP (${counts.confirmed})`],
                      ["rejected", `FP (${counts.rejected})`],
                    ] as const
                  ).map(([val, label]) => {
                    const active = statusFilter === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStatusFilter(val)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] transition border ${
                          active
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-medium"
                            : "bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}

                  {(sevFilter !== "all" || statusFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSevFilter("all");
                        setStatusFilter("all");
                      }}
                      className="ml-auto text-[11px] text-[var(--color-muted)] hover:text-[var(--color-vermilion)] underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Finding Cards List */}
          <div className="space-y-3">
            {findings.length === 0 && (
              <div className="surface-card p-8 text-center font-sans">
                <CheckCircle2 size={28} className="mx-auto text-[var(--color-accent)] mb-2" />
                <p className="text-[14px] text-[var(--color-ink)]">No issues detected</p>
                <p className="mt-1 text-[12px] text-[var(--color-muted)] leading-relaxed">
                  Both models reported 0 candidate defects. If you spot a violation they missed, report it below to register a False Negative.
                </p>
              </div>
            )}

            {findings.length > 0 && filteredFindings.length === 0 && (
              <div className="surface-card p-8 text-center font-sans">
                <p className="text-[13px] text-[var(--color-ink)]">No findings match the current filters</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  Try adjusting the severity or status filters above.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSevFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-3 btn btn--line btn--sm"
                >
                  Clear filters
                </button>
              </div>
            )}

            {(viewMode === "single" && currentFinding ? [currentFinding] : filteredFindings).map((f) => {
              const originalIndex = findings.findIndex((item) => item.id === f.id);
              const active = selectedId === f.id;
              const busy = busyIds.has(f.id);
              const human = f.source === "human";
              const borderCls = SEV_BORDER[f.severity] || "border-l-[var(--color-accent)]";

              return (
                <article
                  key={f.id}
                  id={`finding-card-${f.id}`}
                  onClick={() => select(f.id)}
                  className={`surface-card p-5 cursor-pointer border-l-2 transition-all ${borderCls} ${
                    active
                      ? "ring-1 ring-[var(--color-accent)] bg-[var(--color-paper-3)]"
                      : "hover:border-[var(--color-rule-2)]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="tabular num font-mono text-[11px] text-[var(--color-muted)]">
                        #{String(originalIndex + 1).padStart(2, "0")}
                      </span>
                      <SeverityBadge severity={f.severity} />
                      <CategoryChip category={f.category} />
                      {human && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-accent)]/30 px-2 py-0.5 font-sans text-[10.5px] text-[var(--color-accent)]">
                          <UserRound size={11} /> Human Ground Truth
                        </span>
                      )}
                    </div>
                    <StatusBadge status={f.status} />
                  </div>

                  {/* Finding Title */}
                  <h3 className="mt-2.5 font-display text-[15px] font-normal leading-snug text-[var(--color-ink)] flex items-center justify-between gap-2">
                    <span>{f.title}</span>
                    {f.bbox && (
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-sans ${
                          active
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]"
                            : "bg-[var(--color-paper-2)] text-[var(--color-muted)] border-[var(--color-rule)] hover:text-[var(--color-ink)]"
                        }`}
                        title="Click to locate on picture"
                      >
                        <Crosshair size={10} className={active ? "text-[var(--color-accent-ink)]" : "text-[var(--color-accent)]"} />
                        <span>Window #{String(originalIndex + 1).padStart(2, "0")}</span>
                      </span>
                    )}
                  </h3>

                  {/* Grounded Evidence Strip */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    {f.bbox && (
                      <span className="rounded-[4px] bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-2 py-0.5 text-[var(--color-muted)] flex items-center gap-1">
                        <span className="text-[var(--color-accent-ink)] font-bold">POS:</span>
                        <span>
                          {Math.round(f.bbox.x * 100)}%, {Math.round(f.bbox.y * 100)}% ({Math.round(f.bbox.w * 100)}×{Math.round(f.bbox.h * 100)}%)
                        </span>
                      </span>
                    )}
                    {f.wcag && (
                      <span className="rounded-[4px] bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-2 py-0.5 text-[var(--color-ink)]">
                        {f.wcag}
                      </span>
                    )}
                    {f.explanation.includes(":1") && (
                      <span className="rounded-[4px] bg-[var(--color-vermilion-soft)] border border-[var(--color-vermilion)] px-2 py-0.5 text-[var(--color-vermilion)] font-bold">
                        {f.explanation.match(/\d+\.?\d*:\d+/)?.[0]} contrast (fails 4.5:1)
                      </span>
                    )}
                  </div>

                  {/* Reasoning & Suggestion Box */}
                  {(() => {
                    const activeRating = ratings[f.id] !== undefined ? ratings[f.id] : f.remediationRating;
                    return (
                      <div className="mt-3 space-y-2.5 text-[13px] leading-relaxed font-sans">
                        <p className="text-[var(--color-ink)]/90">{f.explanation}</p>
                        <div className="rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-sans text-[11px] font-semibold text-[var(--color-muted)]">
                              Suggested remediation
                            </p>
                            <div className="flex items-center gap-1 font-sans text-[11px]">
                              <span className="text-[var(--color-muted)] text-[10px] mr-0.5">Useful?</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rateRemediation(f.id, "helpful");
                                }}
                                className={`p-1 rounded-[4px] transition ${
                                  activeRating === "helpful"
                                    ? "bg-[var(--color-green-soft)] text-[var(--color-green)] border border-[var(--color-green)]"
                                    : "text-[var(--color-muted)] hover:text-[var(--color-green)]"
                                }`}
                                title="Helpful fix"
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rateRemediation(f.id, "not_helpful");
                                }}
                                className={`p-1 rounded-[4px] transition ${
                                  activeRating === "not_helpful"
                                    ? "bg-[var(--color-vermilion-soft)] text-[var(--color-vermilion)] border border-[var(--color-vermilion)]"
                                    : "text-[var(--color-muted)] hover:text-[var(--color-vermilion)]"
                                }`}
                                title="Not helpful fix"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[var(--color-ink)] font-medium text-[12.5px]">{f.suggestion}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Technical Footer */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-rule)] pt-3 font-sans text-[11px]">
                    <div className="flex items-center gap-3">
                      {f.wcag && (
                        <span className="rounded-[4px] bg-[var(--color-paper-3)] px-1.5 py-0.5 text-[var(--color-ink)] border border-[var(--color-rule)] font-mono text-[10.5px]">
                          WCAG {f.wcag}
                        </span>
                      )}
                      {!human && <ConfidenceMeter value={f.confidence} />}
                    </div>

                    {f.verifiedBy && (
                      <span className="text-[var(--color-muted)] text-[10.5px]">
                        adjudicated by {f.verifiedBy}
                      </span>
                    )}
                  </div>

                  {/* Adjudication Buttons */}
                  <div
                    className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[var(--color-rule)] pt-3 font-sans"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] font-semibold text-[var(--color-muted)] mr-1">
                      {human ? "Ground truth:" : "Adjudicate:"}
                    </span>

                    {!human && (
                      <>
                        <button
                          onClick={() => verify(f, "confirmed")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] transition border ${
                            f.status === "confirmed"
                              ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]"
                              : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-accent)] hover:border-[var(--color-accent)]"
                          }`}
                        >
                          <Check size={13} />
                          <span>Correct (TP)</span>
                        </button>

                        <button
                          onClick={() => verify(f, "rejected")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] transition border ${
                            f.status === "rejected"
                              ? "bg-[var(--color-vermilion)] text-white border-[var(--color-vermilion)]"
                              : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-vermilion)] hover:border-[var(--color-vermilion)]"
                          }`}
                        >
                          <X size={13} />
                          <span>False alarm (FP)</span>
                        </button>

                        <button
                          onClick={() => verify(f, "uncertain")}
                          disabled={busy}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] transition border ${
                            f.status === "uncertain"
                              ? "bg-[var(--color-paper-3)] text-[var(--color-ink)] border-[var(--color-rule-2)]"
                              : "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                          }`}
                        >
                          <CircleHelp size={12} />
                          <span>Unsure</span>
                        </button>
                      </>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      {busy && <Loader2 size={13} className="animate-spin text-[var(--color-accent)]" />}
                      {f.status !== "pending" && !human && (
                        <button
                          title="Reset status back to pending"
                          disabled={busy}
                          onClick={() => verify(f, "pending")}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] transition hover:text-[var(--color-ink)] hover:border-[var(--color-rule-2)]"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      {human && (
                        <button
                          title="Delete human finding"
                          disabled={busy}
                          onClick={() => removeFinding(f)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] transition hover:text-[var(--color-vermilion)] hover:border-[var(--color-vermilion)]"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Bottom Quick-Stepper for Single Focus View */}
            {viewMode === "single" && filteredFindings.length > 1 && (
              <div className="flex items-center justify-between font-mono text-[11px] pt-1 px-1">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => setSelectedId(filteredFindings[Math.max(0, activeIndex - 1)].id)}
                  className="btn btn--line btn--sm inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span>‹ Previous finding</span>
                </button>

                <span className="text-[10.5px] text-[var(--color-muted)] num tabular">
                  Finding {activeIndex + 1} of {filteredFindings.length}
                </span>

                <button
                  type="button"
                  disabled={activeIndex >= filteredFindings.length - 1}
                  onClick={() =>
                    setSelectedId(
                      filteredFindings[Math.min(filteredFindings.length - 1, activeIndex + 1)].id
                    )
                  }
                  className="btn btn--line btn--sm inline-flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span>Next finding ›</span>
                </button>
              </div>
            )}
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
    "w-full rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 font-sans text-[12px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition focus:border-[var(--color-accent)]";

  return (
    <div className="surface-card p-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn btn--line w-full py-3 text-[12px] rounded-full flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          <span>Report missed violation (logs false negative for recall)</span>
        </button>
      ) : (
        <div className="space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-2">
            <SectionLabel badge="GROUND TRUTH">Record model omission</SectionLabel>
            <button onClick={() => setOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">
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
              <option value="critical">Critical severity</option>
              <option value="major">Major severity</option>
              <option value="minor">Minor severity</option>
            </select>
          </div>

          <input
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="Short title (e.g. Unlabeled schedule table header)"
            className={field}
          />

          <textarea
            value={form.explanation}
            onChange={(e) => set("explanation")(e.target.value)}
            placeholder="Detailed explanation: what was missed, who is affected, and what the model overlooked"
            rows={3}
            className={`${field} resize-none`}
          />

          <textarea
            value={form.suggestion}
            onChange={(e) => set("suggestion")(e.target.value)}
            placeholder="Recommended fix: exact visual or structural remediation"
            rows={2}
            className={`${field} resize-none`}
          />

          <input
            value={form.wcag}
            onChange={(e) => set("wcag")(e.target.value)}
            placeholder="WCAG criterion (e.g. 1.4.3 Contrast minimum)"
            className={field}
          />

          {error && <p className="font-mono text-[11.5px] text-[var(--color-vermilion)]">{error}</p>}

          <button
            onClick={submit}
            disabled={
              sending ||
              form.title.trim().length < 3 ||
              form.explanation.trim().length < 5 ||
              form.suggestion.trim().length < 5
            }
            className="btn btn--primary w-full py-2.5 text-[12.5px] rounded-full flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>Commit ground-truth finding</span>
          </button>
        </div>
      )}
    </div>
  );
}
