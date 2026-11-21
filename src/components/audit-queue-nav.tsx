"use client";

import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AuditQueueNavProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentFilters: {
    status?: string;
    kind?: string;
    severity?: string;
    analyzer?: string;
  };
}

// ── Filter definitions ───────────────────────────────────────────────────────

const FILTERS = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "", label: "All" },
      { value: "pending", label: "Awaiting" },
      { value: "done", label: "Verified" },
      { value: "tp", label: "True positive" },
    ],
  },
  {
    key: "kind",
    label: "Artifact",
    options: [
      { value: "", label: "All" },
      { value: "poster", label: "Poster" },
      { value: "ui_screenshot", label: "UI frame" },
    ],
  },
  {
    key: "severity",
    label: "Severity",
    options: [
      { value: "", label: "All" },
      { value: "critical", label: "Has critical" },
      { value: "major", label: "Has major" },
      { value: "minor", label: "Minor only" },
    ],
  },
  {
    key: "analyzer",
    label: "Engine",
    options: [
      { value: "", label: "All" },
      { value: "qwen-vl", label: "Qwen-VL" },
      { value: "heuristic", label: "Heuristic" },
    ],
  },
] as const;

// ── Helper: build href preserving all params except the changed one ──────────

function filterHref(
  currentFilters: AuditQueueNavProps["currentFilters"],
  key: string,
  value: string
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string> = {
    status: currentFilters.status ?? "",
    kind: currentFilters.kind ?? "",
    severity: currentFilters.severity ?? "",
    analyzer: currentFilters.analyzer ?? "",
    [key]: value,
  };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/?${qs}#queue` : `/#queue`;
}

function pageHref(
  currentFilters: AuditQueueNavProps["currentFilters"],
  page: number
): string {
  const params = new URLSearchParams();
  const f = currentFilters;
  if (f.status) params.set("status", f.status);
  if (f.kind) params.set("kind", f.kind);
  if (f.severity) params.set("severity", f.severity);
  if (f.analyzer) params.set("analyzer", f.analyzer);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}#queue` : `/#queue`;
}

// ── Pagination bar helpers ───────────────────────────────────────────────────

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
  if (current === 1) return [1, 2, 3].filter((p) => p <= total);
  if (current === total) return [total - 2, total - 1, total].filter((p) => p >= 1);
  return [current - 1, current, current + 1];
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AuditQueueNav({
  currentPage,
  totalPages,
  totalCount,
  currentFilters,
}: AuditQueueNavProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

  const btnBase =
    "inline-flex items-center justify-center rounded-full border font-sans text-[12px] transition select-none min-h-[36px] min-w-[36px]";
  const btnActive =
    "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-medium";
  const btnInactive =
    "border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink-2)] hover:border-[var(--color-rule-2)] hover:text-[var(--color-ink)]";
  const btnDisabled =
    "border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-muted)] cursor-not-allowed opacity-30 pointer-events-none";

  return (
    <div className="mt-6 space-y-3 font-sans">
      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
        {FILTERS.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5">
            <span className="text-[11.5px] text-[var(--color-muted)]">
              {f.label}:
            </span>
            <div className="flex items-center gap-1">
              {f.options.map((opt) => {
                const active =
                  (currentFilters[f.key as keyof typeof currentFilters] ?? "") ===
                  opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={filterHref(currentFilters, f.key, opt.value)}
                    scroll={false}
                    className={`h-7 px-2.5 rounded-full border font-sans text-[11.5px] flex items-center justify-center transition ${
                      active
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)]"
                        : "bg-[var(--color-paper-2)] text-[var(--color-muted)] border-[var(--color-rule)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule-2)]"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination bar ───────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-rule)] pt-3.5">
          {/* Left info */}
          <span className="num tabular font-mono text-[11.5px] text-[var(--color-muted)]">
            Page {currentPage} / {totalPages} · {totalCount} total
          </span>

          {/* Nav arrows + page numbers */}
          <div className="flex items-center gap-1.5">
            {/* « First */}
            <Link
              href={pageHref(currentFilters, 1)}
              scroll={false}
              aria-label="First page"
              className={`${btnBase} ${
                currentPage <= 1 ? btnDisabled : btnInactive
              }`}
            >
              «
            </Link>

            {/* ‹ Prev */}
            <Link
              href={pageHref(currentFilters, Math.max(1, currentPage - 1))}
              scroll={false}
              aria-label="Previous page"
              className={`${btnBase} ${
                currentPage <= 1 ? btnDisabled : btnInactive
              }`}
            >
              ‹
            </Link>

            {/* Page numbers (3 visible) */}
            {visiblePages.map((p) => (
              <Link
                key={p}
                href={pageHref(currentFilters, p)}
                scroll={false}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className={`${btnBase} px-3 ${
                  p === currentPage ? btnActive : btnInactive
                }`}
              >
                {p}
              </Link>
            ))}

            {/* › Next */}
            <Link
              href={pageHref(currentFilters, Math.min(totalPages, currentPage + 1))}
              scroll={false}
              aria-label="Next page"
              className={`${btnBase} ${
                currentPage >= totalPages ? btnDisabled : btnInactive
              }`}
            >
              ›
            </Link>

            {/* » Last */}
            <Link
              href={pageHref(currentFilters, totalPages)}
              scroll={false}
              aria-label="Last page"
              className={`${btnBase} ${
                currentPage >= totalPages ? btnDisabled : btnInactive
              }`}
            >
              »
            </Link>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {totalCount === 0 && (
        <p className="text-center font-sans text-[13px] text-[var(--color-muted)] py-8">
          No audits match the selected filters.
        </p>
      )}
    </div>
  );
}
