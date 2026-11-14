import type { Metrics } from "@/lib/metrics";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10b981", // Emerald
  rejected: "#f43f5e",  // Rose
  pending: "#f59e0b",   // Amber
  uncertain: "#64748b", // Slate
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "True Positives (TP)",
  rejected: "False Positives (FP)",
  pending: "Awaiting Review",
  uncertain: "Uncertain / Flagged",
};

/** Donut of verification outcomes across all findings. */
export function OutcomeDonut({
  outcomes,
}: {
  outcomes: Metrics["outcomes"];
}) {
  const total = outcomes.reduce((s, o) => s + o.count, 0);
  const R = 50;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="14"
          />
          {total > 0 &&
            outcomes
              .filter((o) => o.count > 0)
              .map((o) => {
                const frac = o.count / total;
                const dash = `${frac * C} ${C}`;
                const el = (
                  <circle
                    key={o.status}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke={STATUS_COLORS[o.status]}
                    strokeWidth="14"
                    strokeDasharray={dash}
                    strokeDashoffset={-offset * C}
                    strokeLinecap="butt"
                    className="transition-all duration-700 ease-out"
                  />
                );
                offset += frac;
                return el;
              })}
        </svg>

        {/* Center telemetry hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="tabular font-mono text-[28px] font-bold leading-none text-white tracking-tight">
            {total}
          </p>
          <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-brand-light">
            CLAIMS
          </p>
        </div>
      </div>

      <div className="space-y-2.5 w-full">
        {outcomes.map((o) => {
          const pct = total > 0 ? Math.round((o.count / total) * 100) : 0;
          return (
            <div
              key={o.status}
              className="flex items-center justify-between gap-3 text-[12px] rounded-lg border border-hairline/60 bg-surface-2/40 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shadow-sm"
                  style={{ background: STATUS_COLORS[o.status] }}
                />
                <span className="text-inktext/90 font-medium text-[11.5px]">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-inkdim text-[10.5px]">{pct}%</span>
                <span className="tabular font-bold text-white text-[12px]">
                  {o.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Confirm-rate per confidence bucket — calibration view. */
export function CalibrationBars({
  calibration,
}: {
  calibration: Metrics["calibration"];
}) {
  return (
    <div className="w-full">
      {/* Target reference line info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-inkdim mb-2 border-b border-hairline/40 pb-1">
        <span>EMPIRICAL CONFIRM RATE</span>
        <span className="text-brand-light">IDEAL = MONOTONIC RISING</span>
      </div>

      <div className="relative flex h-[130px] items-end gap-3 border-b border-hairline px-2 pb-0 bg-surface-0/50 rounded-t-lg pt-4">
        {/* Benchmark 50% line */}
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-white/10 pointer-events-none" />

        {calibration.map((b) => {
          const ratePct = Math.round(b.confirmRate * 100);
          return (
            <div
              key={b.bucket}
              className="group flex flex-1 flex-col items-center gap-1.5 self-stretch justify-end relative"
            >
              <span className="tabular font-mono text-[10.5px] font-semibold text-white group-hover:text-brand transition">
                {b.n > 0 ? `${ratePct}%` : "—"}
              </span>

              <div className="relative w-full max-w-[48px] h-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: `${Math.max(b.n > 0 ? b.confirmRate * 100 : 0, b.n > 0 ? 6 : 2)}%`,
                    background:
                      b.n > 0
                        ? "linear-gradient(180deg, #fbbf24 0%, #b45309 100%)"
                        : "rgba(255,255,255,0.05)",
                    boxShadow: b.n > 0 ? "0 0 12px -2px rgba(245,158,11,0.4)" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex gap-3 px-2">
        {calibration.map((b) => (
          <div key={b.bucket} className="flex-1 text-center font-mono">
            <p className="text-[10px] font-semibold text-inktext">{b.bucket}</p>
            <p className="text-[9px] text-inkdim/70">n={b.n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal precision bars per finding category. */
export function CategoryBars({
  perCategory,
}: {
  perCategory: Metrics["perCategory"];
}) {
  if (perCategory.length === 0) {
    return (
      <div className="py-10 text-center font-mono text-[12px] text-inkdim bg-surface-0/40 rounded-lg border border-hairline/60">
        No reviewed categories recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {perCategory.map((c) => {
        const precPct = c.precision != null ? Math.round(c.precision * 100) : null;
        return (
          <div
            key={c.category}
            className="rounded-lg border border-hairline/60 bg-surface-2/40 p-2.5"
          >
            <div className="mb-2 flex items-center justify-between text-[11.5px]">
              <span className="font-medium text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-sm bg-brand" />
                {c.label}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span
                  className={`font-bold px-1.5 py-0.5 rounded ${
                    precPct != null && precPct >= 70
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : precPct != null
                      ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                      : "text-inkdim"
                  }`}
                >
                  {precPct != null ? `${precPct}% PREC` : "UNRATED"}
                </span>
                <span className="text-inkdim">
                  {c.tp} TP · {c.fp} FP
                </span>
              </div>
            </div>

            {/* Split Progress Track */}
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-0 border border-hairline/50">
              <div
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-all duration-500"
                style={{ width: `${(c.tp / Math.max(c.total, 1)) * 100}%` }}
                title={`${c.tp} Confirmed True Positives`}
              />
              <div
                className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] transition-all duration-500"
                style={{ width: `${(c.fp / Math.max(c.total, 1)) * 100}%` }}
                title={`${c.fp} Rejected False Positives`}
              />
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-inkdim border-t border-hairline/50">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Confirmed (TP)
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="h-2 w-2 rounded-sm bg-rose-500" /> False Alarm (FP)
        </span>
        <span className="flex items-center gap-1.5 text-inkdim">
          <span className="h-2 w-2 rounded-sm bg-surface-3" /> In Review
        </span>
      </div>
    </div>
  );
}
