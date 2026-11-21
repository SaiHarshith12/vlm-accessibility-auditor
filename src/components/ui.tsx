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
    <div className="flex items-center gap-2 mb-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
      <span className="font-sans text-[12px] font-normal text-[var(--color-ink)]">
        {children}
      </span>
      {badge && (
        <span className="rounded-full bg-[var(--color-paper-2)] border border-[var(--color-rule)] px-2 py-0.5 text-[10px] text-[var(--color-muted)] font-mono">
          {badge}
        </span>
      )}
    </div>
  );
}

const SEV: Record<Severity, { border: string; text: string; dot: string }> = {
  critical: {
    border: "border-l-2 border-l-[var(--color-vermilion)] border-[var(--color-rule)]",
    text: "text-[var(--color-vermilion)]",
    dot: "bg-[var(--color-vermilion)]",
  },
  major: {
    border: "border-l-2 border-l-[var(--color-sienna)] border-[var(--color-rule)]",
    text: "text-[var(--color-sienna)]",
    dot: "bg-[var(--color-sienna)]",
  },
  minor: {
    border: "border-l-2 border-l-[var(--point-mid)] border-[var(--color-rule)]",
    text: "text-[var(--point-mid)]",
    dot: "bg-[var(--point-mid)]",
  },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEV[severity as Severity] ?? SEV.minor;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[var(--color-paper-2)] px-2 py-0.5 font-sans text-[11px] capitalize ${s.border} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const meta = CATEGORY_META[category as Category] ?? CATEGORY_META.other;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-0.5 font-sans text-[11px] text-[var(--color-muted)]">
      {meta.label}
    </span>
  );
}

const STATUS_STYLE: Record<string, { cls: string; label: string; dot: string }> = {
  pending: {
    cls: "text-[var(--color-sienna)] border-[var(--color-rule)] bg-[var(--color-paper-2)]",
    label: "Awaiting review",
    dot: "bg-[var(--color-sienna)]",
  },
  confirmed: {
    cls: "text-[var(--color-accent)] border-[var(--color-rule)] bg-[var(--color-paper-2)]",
    label: "True positive",
    dot: "bg-[var(--color-accent)]",
  },
  rejected: {
    cls: "text-[var(--color-vermilion)] border-[var(--color-rule)] bg-[var(--color-paper-2)]",
    label: "False alarm",
    dot: "bg-[var(--color-vermilion)]",
  },
  uncertain: {
    cls: "text-[var(--color-muted)] border-[var(--color-rule)] bg-[var(--color-paper-2)]",
    label: "Uncertain",
    dot: "bg-[var(--color-muted)]",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const conf = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[11px] ${conf.cls}`}
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
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-0.5 font-sans text-[11px] text-[var(--color-ink-2)]"
      title={
        isVlm
          ? "Findings produced by local Qwen2.5-VL model"
          : "Local VLM offline · processed via deterministic heuristic contrast engine"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isVlm ? "bg-[var(--color-accent)]" : "bg-[var(--point-mid)]"
        }`}
      />
      {isVlm ? "Qwen-VL local" : "Pixel heuristics"}
      {online != null && (
        <span
          className={`ml-0.5 h-1.5 w-1.5 rounded-full ${
            online ? "bg-[var(--color-accent)]" : "bg-[var(--color-vermilion)]"
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
      <div className="relative h-1 w-16 overflow-hidden rounded-full bg-[var(--color-paper-3)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="num tabular font-mono text-[11px] text-[var(--color-ink)]">
        {pct}<span className="u">%</span>
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
      <div className="inline-flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-3 py-1.5 font-sans text-[12px]">
        <span className="flex h-2 w-2 relative">
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isVlm ? "bg-[var(--color-accent)]" : "bg-[var(--point-mid)]"
            }`}
          />
        </span>
        <span className="text-[var(--color-muted)]">Active model:</span>
        <span className="text-[var(--color-ink)]">
          {isVlm ? "Qwen2.5-VL-3B (Local VLM)" : "Deterministic Pixel Engine"}
        </span>
        <span className="text-[var(--color-rule)]">/</span>
        <span className="text-[11px] text-[var(--color-accent)]">
          {online ? "Online · local GPU" : "Offline fallback"}
        </span>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 border border-[var(--color-rule)] font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-rule)]">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] font-mono text-[11px] text-[var(--color-accent)]">
            {isVlm ? "VL" : "PX"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-muted)]">
                Active vision model:
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                  online
                    ? "bg-[var(--color-paper-3)] text-[var(--color-accent)] border border-[var(--color-accent)]/40"
                    : "bg-[var(--color-paper-3)] text-[var(--color-sienna)] border border-[var(--color-sienna)]/40"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {online ? "Operational" : "Standby"}
              </span>
            </div>
            <h4 className="text-[14px] font-normal text-[var(--color-ink)] mt-0.5">
              {isVlm ? "Qwen2.5-VL-3B Multimodal Engine" : "Airgapped Deterministic Pixel Engine"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-[var(--color-paper-3)] px-2.5 py-0.5 text-[var(--color-muted)] border border-[var(--color-rule)]">
            {isVlm ? "Ollama / OpenAI API" : "Sharp 320px dual-pass"}
          </span>
          <span className="rounded-full bg-[var(--color-paper-3)] px-2.5 py-0.5 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
            WCAG 2.2 AA/AAA
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4 text-[var(--color-muted)]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2">
          <span className="text-[10px] block text-[var(--color-muted)]">Inference mode</span>
          <span className="text-[var(--color-ink)] mt-0.5 block">
            {isVlm ? "Spatial Visual Tokens" : "Direct Pixel Sampling"}
          </span>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2">
          <span className="text-[10px] block text-[var(--color-muted)]">Bounding box engine</span>
          <span className="text-[var(--color-ink)] mt-0.5 block">
            {isVlm ? "Normalized Fractions" : "Sobel 8×8 Cluster Grids"}
          </span>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2">
          <span className="text-[10px] block text-[var(--color-muted)]">Contrast evaluation</span>
          <span className="text-[var(--color-ink)] mt-0.5 block">Relative Luminance</span>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2">
          <span className="text-[10px] block text-[var(--color-muted)]">Adjudication pipeline</span>
          <span className="text-[var(--color-accent)] mt-0.5 block">Write-Protected Truth</span>
        </div>
      </div>
    </div>
  );
}
