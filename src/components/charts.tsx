import type { Metrics } from "@/lib/metrics";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#2b8a3e", // Grass green
  rejected: "#c92a2a",  // Vermilion
  pending: "#d97706",   // Tangerine
  uncertain: "#6b7280", // Pencil slate
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "True positives (TP)",
  rejected: "False positives (FP)",
  pending: "Awaiting review",
  uncertain: "Uncertain / flagged",
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
            stroke="var(--color-rule)"
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
                    className="transition-all duration-500 ease-out"
                  />
                );
                offset += frac;
                return el;
              })}
        </svg>

        {/* Center telemetry hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="tabular font-mono text-[28px] font-bold leading-none text-[var(--color-ink)] tracking-tight">
            {total}
          </p>
          <p className="mt-1 font-mono text-[9.5px] font-medium text-[var(--color-muted)]">
            CLAIMS
          </p>
        </div>
      </div>

      <div className="space-y-2 w-full">
        {outcomes.map((o) => {
          const pct = total > 0 ? Math.round((o.count / total) * 100) : 0;
          return (
            <div
              key={o.status}
              className="flex items-center justify-between gap-3 text-[12px] rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-3)] px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: STATUS_COLORS[o.status] }}
                />
                <span className="text-[var(--color-ink)] font-medium text-[12px] whitespace-nowrap">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="text-[var(--color-muted)] text-[11px]">{pct}%</span>
                <span className="tabular font-bold text-[var(--color-ink)] text-[12px]">
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
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-muted)] mb-2 border-b border-[var(--color-rule)] pb-1">
        <span>EMPIRICAL CONFIRM RATE</span>
        <span className="text-[var(--color-accent-ink)] font-semibold">IDEAL = MONOTONIC RISING</span>
      </div>

      <div className="relative flex h-[130px] items-end gap-3 border-b border-[var(--color-ink)] px-2 pb-0 bg-[var(--color-paper-3)] rounded-t-[6px] pt-4">
        {/* Benchmark 50% line */}
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[var(--color-rule)] pointer-events-none" />

        {calibration.map((b) => {
          const ratePct = Math.round(b.confirmRate * 100);
          return (
            <div
              key={b.bucket}
              className="group flex flex-1 flex-col items-center gap-1.5 self-stretch justify-end relative"
            >
              <span className="tabular font-mono text-[10.5px] font-semibold text-[var(--color-ink)]">
                {b.n > 0 ? `${ratePct}%` : "—"}
              </span>

              <div className="relative w-full max-w-[48px] h-full flex items-end justify-center">
                <div
                  className="w-full rounded-t-[2px] transition-all duration-300 ease-out"
                  style={{
                    height: `${Math.max(b.n > 0 ? b.confirmRate * 100 : 0, b.n > 0 ? 6 : 2)}%`,
                    background:
                      b.n > 0
                        ? "var(--color-accent)"
                        : "var(--color-rule)",
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
            <p className="text-[10.5px] font-semibold text-[var(--color-ink)]">{b.bucket}</p>
            <p className="text-[9.5px] text-[var(--color-muted)]">n={b.n}</p>
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
      <div className="py-10 text-center font-sans text-[12px] text-[var(--color-muted)] bg-[var(--color-paper-3)] rounded-[6px] border border-[var(--color-rule)]">
        No reviewed categories recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {perCategory.map((c) => {
        const precPct = c.precision != null ? Math.round(c.precision * 100) : null;
        return (
          <div
            key={c.category}
            className="rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2.5"
          >
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--color-accent)]" />
                {c.label}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded-[4px] whitespace-nowrap ${
                    precPct != null && precPct >= 70
                      ? "bg-[var(--color-green-soft)] text-[var(--color-green)] border border-[var(--color-green)]"
                      : precPct != null
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] border border-[var(--color-accent)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {precPct != null ? `${precPct}% precision` : "unrated"}
                </span>
                <span className="text-[var(--color-muted)] whitespace-nowrap">
                  {c.tp} TP · {c.fp} FP
                </span>
              </div>
            </div>

            {/* Split Progress Track */}
            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-paper)] border border-[var(--color-rule)]">
              <div
                className="h-full bg-[var(--color-green)] transition-all duration-300"
                style={{ width: `${(c.tp / Math.max(c.total, 1)) * 100}%` }}
                title={`${c.tp} Confirmed True Positives`}
              />
              <div
                className="h-full bg-[var(--color-vermilion)] transition-all duration-300"
                style={{ width: `${(c.fp / Math.max(c.total, 1)) * 100}%` }}
                title={`${c.fp} Rejected False Positives`}
              />
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1 text-[11px] font-sans text-[var(--color-muted)] border-t border-[var(--color-rule)]">
        <span className="flex items-center gap-1.5 text-[var(--color-green)] font-medium">
          <span className="h-2 w-2 rounded-full bg-[var(--color-green)]" /> Confirmed (TP)
        </span>
        <span className="flex items-center gap-1.5 text-[var(--color-vermilion)] font-medium">
          <span className="h-2 w-2 rounded-full bg-[var(--color-vermilion)]" /> False alarm (FP)
        </span>
        <span className="flex items-center gap-1.5 text-[var(--color-muted)] font-medium">
          <span className="h-2 w-2 rounded-full bg-[var(--color-rule)]" /> In review
        </span>
      </div>
    </div>
  );
}

/** Confusion matrix of model-predicted severity vs human-adjudicated severity. */
export function SeverityDriftMatrix({
  agreement,
}: {
  agreement: Metrics["severityAgreement"];
}) {
  const sevs: Array<"critical" | "major" | "minor"> = ["critical", "major", "minor"];
  const labels: Record<string, string> = {
    critical: "Critical",
    major: "Major",
    minor: "Minor",
  };

  const ratePct =
    agreement.agreementRate != null ? Math.round(agreement.agreementRate * 100) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11.5px] font-sans">
        <span className="text-[var(--color-muted)] font-medium">Model vs reviewer adjudication</span>
        <span className="font-semibold text-[var(--color-accent-ink)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-[4px] border border-[var(--color-accent)] font-mono text-[11px]">
          {ratePct != null ? `${ratePct}% SEVERITY AGREEMENT` : "INSUFFICIENT DATA"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-ink)]">
              <th className="p-2 text-left font-medium text-[var(--color-muted)] text-[10.5px]">
                MODEL \ HUMAN
              </th>
              {sevs.map((s) => (
                <th key={s} className="p-2 font-bold text-[var(--color-ink)] uppercase text-[10.5px]">
                  {labels[s]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sevs.map((mSev) => (
              <tr key={mSev} className="border-b border-[var(--color-rule)]">
                <td className="p-2 text-left font-semibold text-[var(--color-ink)] uppercase text-[10.5px]">
                  {labels[mSev]}
                </td>
                {sevs.map((hSev) => {
                  const count = agreement?.matrix?.[mSev]?.[hSev] ?? 0;
                  const isDiag = mSev === hSev;
                  const cellBg =
                    count === 0
                      ? "bg-[var(--color-paper-3)] text-[var(--color-muted)]"
                      : isDiag
                      ? "bg-[var(--color-green-soft)] text-[var(--color-green)] font-bold border border-[var(--color-green)]"
                      : "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] border border-[var(--color-accent)] font-semibold";

                  return (
                    <td key={hSev} className="p-1.5">
                      <div className={`py-2 rounded-[4px] text-[12px] ${cellBg}`}>{count}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[10.5px] font-sans text-[var(--color-muted)] pt-1 border-t border-[var(--color-rule)]">
        <span className="flex items-center gap-1.5 text-[var(--color-green)] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" /> Exact match (diagonal)
        </span>
        <span className="flex items-center gap-1.5 text-[var(--color-accent-ink)] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Severity drift (off-diagonal)
        </span>
      </div>
    </div>
  );
}
