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

export function ActiveModelBanner({
  analyzer,
  online = true,
  compact = false,
}: {
  analyzer: string;
  online?: boolean | null;
  compact?: boolean;
}) {
  const isVlm = analyzer === "qwen-vl";

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-1/90 px-3 py-1.5 font-mono text-[11px] shadow-sm">
        <span className="flex h-2 w-2 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isVlm ? "bg-violet-400" : "bg-brand"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isVlm ? "bg-violet-400" : "bg-brand"
            }`}
          />
        </span>
        <span className="text-inkdim uppercase font-semibold">Active Model:</span>
        <span className={`font-bold ${isVlm ? "text-violet-300" : "text-brand-light"}`}>
          {isVlm ? "Qwen2.5-VL-3B (Local VLM)" : "Deterministic Pixel Engine"}
        </span>
        <span className="text-inkdim/50">|</span>
        <span className="text-[10px] text-emerald-400 font-medium">
          {online ? "ONLINE · GPU/LOCAL" : "OFFLINE FALLBACK"}
        </span>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 border border-hairline/80 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid h-8 w-8 place-items-center rounded-lg border ${
              isVlm
                ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                : "border-brand/40 bg-brand/15 text-brand"
            }`}
          >
            <span className="text-[13px] font-bold">{isVlm ? "VL" : "PX"}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-inkdim uppercase font-bold tracking-wider">
                Active Vision Model:
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  online
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {online ? "Model Operational" : "Standby"}
              </span>
            </div>
            <h4 className="text-[13.5px] font-bold text-white tracking-tight">
              {isVlm ? "Qwen2.5-VL-3B Multimodal Engine" : "Airgapped Deterministic Pixel Engine"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded bg-surface-2 px-2.5 py-1 text-inktext border border-hairline">
            {isVlm ? "Ollama / vLLM / OpenAI API" : "Sharp 320px Dual-Pass Filter"}
          </span>
          <span className="rounded bg-surface-2 px-2.5 py-1 text-brand-light border border-hairline">
            WCAG 2.2 AA/AAA
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 text-inkdim">
        <div className="rounded border border-hairline/50 bg-surface-0/50 p-2">
          <span className="text-[9px] uppercase tracking-wider block text-inkdim/70">Inference Mode</span>
          <span className="text-white font-semibold mt-0.5 block">
            {isVlm ? "Spatial Visual Tokens" : "Direct Pixel Sampling"}
          </span>
        </div>
        <div className="rounded border border-hairline/50 bg-surface-0/50 p-2">
          <span className="text-[9px] uppercase tracking-wider block text-inkdim/70">Bounding Box Engine</span>
          <span className="text-white font-semibold mt-0.5 block">
            {isVlm ? "Normalized [0..1] Fractions" : "Sobel 8×8 Cluster Grids"}
          </span>
        </div>
        <div className="rounded border border-hairline/50 bg-surface-0/50 p-2">
          <span className="text-[9px] uppercase tracking-wider block text-inkdim/70">Contrast Evaluation</span>
          <span className="text-white font-semibold mt-0.5 block">Relative Luminance (sRGB)</span>
        </div>
        <div className="rounded border border-hairline/50 bg-surface-0/50 p-2">
          <span className="text-[9px] uppercase tracking-wider block text-inkdim/70">Adjudication Pipeline</span>
          <span className="text-emerald-400 font-semibold mt-0.5 block">Write-Protected Ground Truth</span>
        </div>
      </div>
    </div>
  );
}
