import type { Metrics } from "@/lib/metrics";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#34d399",
  rejected: "#fb7185",
  pending: "#fbbf24",
  uncertain: "#79828f",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "True positives",
  rejected: "False positives",
  pending: "Awaiting review",
  uncertain: "Uncertain",
};

/** Donut of verification outcomes across all findings. */
export function OutcomeDonut({
  outcomes,
}: {
  outcomes: Metrics["outcomes"];
}) {
  const total = outcomes.reduce((s, o) => s + o.count, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[132px] w-[132px] shrink-0">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
          <circle
            cx="66" cy="66" r={R} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="13"
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
                    cx="66" cy="66" r={R} fill="none"
                    stroke={STATUS_COLORS[o.status]}
                    strokeWidth="13"
                    strokeDasharray={dash}
                    strokeDashoffset={-offset * C}
                    strokeLinecap="butt"
                  />
                );
                offset += frac;
                return el;
              })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="tabular text-[26px] font-semibold leading-none text-white">
              {total}
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-inkdim">
              findings
            </p>
          </div>
        </div>
      </div>
      <ul className="space-y-2.5">
        {outcomes.map((o) => (
          <li key={o.status} className="flex items-center gap-2.5 text-[12px]">
            <span
              className="h-2.5 w-2.5 rounded-[4px]"
              style={{ background: STATUS_COLORS[o.status] }}
            />
            <span className="w-28 text-inkdim">{STATUS_LABELS[o.status]}</span>
            <span className="tabular font-semibold text-white">{o.count}</span>
          </li>
        ))}
      </ul>
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
    <div>
      <div className="flex h-[132px] items-end gap-6 border-b border-hairline px-2 pb-0">
        {calibration.map((b) => (
          <div key={b.bucket} className="group flex flex-1 flex-col items-center gap-2 self-stretch">
            <div className="flex w-full flex-1 items-end justify-center">
              <div className="relative flex w-full max-w-[54px] flex-col items-center">
                <span className="tabular mb-1.5 text-[11px] font-semibold text-white">
                  {b.n > 0 ? `${Math.round(b.confirmRate * 100)}%` : "—"}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-info/40 to-brand/80 transition-all"
                  style={{
                    height: `${Math.max(b.n > 0 ? b.confirmRate * 100 : 0, b.n > 0 ? 4 : 2)}%`,
                    minHeight: b.n === 0 ? 2 : undefined,
                    opacity: b.n === 0 ? 0.2 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-6 px-2">
        {calibration.map((b) => (
          <div key={b.bucket} className="flex-1 text-center">
            <p className="tabular text-[10px] font-medium text-inkdim">{b.bucket}</p>
            <p className="tabular text-[9px] text-inkdim/60">n={b.n}</p>
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
    return <p className="py-8 text-center text-[12px] text-inkdim">No reviewed findings yet.</p>;
  }
  return (
    <ul className="space-y-3.5">
      {perCategory.map((c) => (
        <li key={c.category}>
          <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
            <span className="font-medium text-inktext">{c.label}</span>
            <span className="tabular text-inkdim">
              <span className="font-semibold text-white">
                {c.precision == null ? "—" : `${Math.round(c.precision * 100)}%`}
              </span>
              <span className="ml-2 text-[10px] text-inkdim/70">
                {c.tp} TP · {c.fp} FP
              </span>
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-pass/80"
              style={{ width: `${(c.tp / Math.max(c.total, 1)) * 100}%` }}
              title={`${c.tp} confirmed`}
            />
            <div
              className="h-full bg-fail/70"
              style={{ width: `${(c.fp / Math.max(c.total, 1)) * 100}%` }}
              title={`${c.fp} rejected`}
            />
          </div>
        </li>
      ))}
      <li className="flex gap-4 pt-1 text-[10px] text-inkdim">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-pass/80" /> confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-fail/70" /> rejected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-white/10" /> awaiting review
        </span>
      </li>
    </ul>
  );
}
