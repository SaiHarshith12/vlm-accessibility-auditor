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

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-inkdim">
      {children}
    </p>
  );
}

const SEV: Record<Severity, { dot: string; text: string; ring: string }> = {
  critical: { dot: "bg-fail", text: "text-fail", ring: "stroke-fail" },
  major: { dot: "bg-warn", text: "text-warn", ring: "stroke-warn" },
  minor: { dot: "bg-info", text: "text-info", ring: "stroke-info" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = (SEV[severity as Severity] ?? SEV.minor)!;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const meta =
    CATEGORY_META[category as Category] ?? CATEGORY_META.other;
  return (
    <span className="inline-flex items-center rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-inktext ring-1 ring-hairline">
      {meta.label}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "text-warn border-warn/30 bg-warn/[0.08]",
  confirmed: "text-pass border-pass/30 bg-pass/[0.08]",
  rejected: "text-fail border-fail/30 bg-fail/[0.08]",
  uncertain: "text-inkdim border-hairline bg-white/[0.04]",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting review",
  confirmed: "True positive",
  rejected: "False positive",
  uncertain: "Uncertain",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}
    >
      {status === "pending" && (
        <span className="blink h-1.5 w-1.5 rounded-full bg-warn" />
      )}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function AnalyzerChip({ analyzer, online }: { analyzer: string; online?: boolean | null }) {
  const isVlm = analyzer === "qwen-vl";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        isVlm
          ? "border-violet-400/30 bg-violet-400/[0.08] text-violet-300"
          : "border-sky-300/30 bg-sky-300/[0.08] text-sky-300"
      }`}
      title={
        isVlm
          ? "Findings produced by the local Qwen-VL model"
          : "Local VLM offline — produced by the deterministic heuristic engine"
      }
    >
      {isVlm ? "Qwen-VL · local" : "Heuristic engine"}
      {online != null && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${online ? "bg-pass" : "bg-fail"}`}
        />
      )}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-info to-brand"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="tabular text-[11px] font-medium text-inkdim">
        {Math.round(value * 100)}%
      </span>
    </span>
  );
}
