import type { ReactNode } from "react";
import {
  CATEGORY_META,
  type Category,
  type Severity,
} from "@/lib/taxonomy";

export const fmtPct = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : `${(n * 100).toFixed(digits)}%`;

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function SectionLabel({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="h-1.5 w-1.5 rounded-sm bg-brand shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-inkdim">
        {children}
      </span>
      {badge && (
        <span className="rounded bg-brand/10 border border-brand/20 px-1.5 py-0.2 font-mono text-[9px] text-brand-light">
          {badge}
        </span>
      )}
    </div>
  );
}

const SEV: Record<Severity, { dot: string; text: string; bg: string; border: string }> = {
  critical: {
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
    text: "text-rose-400",
    bg: "bg-rose-500/[0.08]",
    border: "border-rose-500/30",
  },
  major: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
    text: "text-amber-300",
    bg: "bg-amber-400/[0.08]",
    border: "border-amber-400/30",
  },
  minor: {
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]",
    text: "text-cyan-300",
    bg: "bg-cyan-400/[0.08]",
    border: "border-cyan-400/30",
  },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEV[severity as Severity] ?? SEV.minor;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.border} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const meta = CATEGORY_META[category as Category] ?? CATEGORY_META.other;
  return (
    <span className="inline-flex items-center rounded-md border border-hairline bg-surface-2/80 px-2 py-0.5 font-mono text-[10.5px] text-inktext/90">
      {meta.label}
    </span>
  );
}

const STATUS_STYLE: Record<string, { cls: string; label: string; dot: string }> = {
  pending: {
    cls: "text-amber-300 border-amber-400/30 bg-amber-400/[0.08]",
    label: "Awaiting Review",
    dot: "bg-amber-400 blink",
  },
  confirmed: {
    cls: "text-emerald-300 border-emerald-500/30 bg-emerald-500/[0.08]",
    label: "True Positive",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
  },
  rejected: {
    cls: "text-rose-300 border-rose-500/30 bg-rose-500/[0.08]",
    label: "False Positive",
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
  },
  uncertain: {
    cls: "text-inkdim border-hairline bg-surface-2",
    label: "Uncertain",
    dot: "bg-inkdim",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const conf = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${conf.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
}

export function AnalyzerChip({
  analyzer,
  online,
}: {
  analyzer: string;
  online?: boolean | null;
}) {
  const isVlm = analyzer === "qwen-vl";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider shadow-sm ${
        isVlm
          ? "border-violet-500/40 bg-violet-500/[0.12] text-violet-200"
          : "border-brand/40 bg-brand/[0.1] text-brand-light"
      }`}
      title={
        isVlm
          ? "Findings produced by local Qwen2.5-VL model"
          : "Local VLM offline · processed via deterministic heuristic contrast engine"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isVlm ? "bg-violet-400 shadow-[0_0_6px_#c084fc]" : "bg-brand shadow-[0_0_6px_#f59e0b]"
        }`}
      />
      {isVlm ? "Qwen-VL · Local" : "Pixel Heuristics"}
      {online != null && (
        <span
          className={`ml-0.5 h-1.5 w-1.5 rounded-full ${
            online ? "bg-emerald-400" : "bg-rose-500"
          }`}
        />
      )}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number | null }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  return (
    <span className="inline-flex items-center gap-2">
      <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-surface-2 border border-hairline">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-brand to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular font-mono text-[11px] font-bold text-brand-light">
        {pct}%
      </span>
    </span>
  );
}
