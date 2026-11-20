"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    label: "STATUS",
    options: [
      { value: "", label: "All" },
      { value: "pending", label: "Awaiting" },
      { value: "done", label: "Verified" },
      { value: "tp", label: "True Positive" },
    ],
  },
  {
    key: "kind",
    label: "KIND",
    options: [
      { value: "", label: "All" },
      { value: "poster", label: "Poster" },
      { value: "ui_screenshot", label: "UI Screen" },
    ],
  },
  {
    key: "severity",
    label: "SEVERITY",
    options: [
      { value: "", label: "All" },
      { value: "critical", label: "Has Critical" },
      { value: "major", label: "Has Major" },
      { value: "minor", label: "Minor Only" },
    ],
  },
  {
    key: "analyzer",
    label: "ENGINE",
    options: [
      { value: "", label: "All" },
      { value: "qwen-vl", label: "Qwen-VL" },
      { value: "heuristic", label: "Heuristic" },
    ],
  },
] as const;

// ── Helper: build href preserving all params except the changed one ──────────

function buildHref(
  base: string,
  currentFilters: AuditQueueNavProps["currentFilters"],
  currentPage: number,
  overrides: Record<string, string>
): string {
  const params = new URLSearchParams();
  const all = {
    page: String(currentPage),
    status: currentFilters.status ?? "",
    kind: currentFilters.kind ?? "",
    severity: currentFilters.severity ?? "",
    analyzer: currentFilters.analyzer ?? "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(all)) {
    if (v && v !== "1" || (k === "page" && v !== "1")) {
      // only include non-default values to keep URLs clean
      if (k === "page" && v === "1") continue;
      if (v) params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${base}#queue` : `${base}#queue`;
  // Note: we always scroll to #queue; params go in the URL before the hash
}

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
  // reset to page 1 when filters change
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
    "inline-flex items-center justify-center rounded border font-mono text-[11px] font-semibold transition select-none";
  const btnActive =
    "border-brand bg-brand/15 text-brand-light";
  const btnInactive =
    "border-hairline bg-surface-1 text-inktext hover:border-brand/40 hover:text-brand";
  const btnDisabled =
    "border-hairline/30 bg-surface-0 text-inkdim/40 cursor-not-allowed pointer-events-none";
  const arrowSz = "h-7 w-7 text-[13px]";
  const pageSz = "h-7 min-w-[28px] px-1.5";

  return (
    <div className="mt-5 space-y-3">
      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {FILTERS.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5">
            <span className="font-mono text-[9.5px] font-bold text-inkdim tracking-widest">
              {f.label}
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
                    className={`${btnBase} ${pageSz} ${
                      active ? btnActive : btnInactive
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
        <div className="flex items-center justify-between border-t border-hairline/60 pt-3">
          {/* Left info */}
          <span className="font-mono text-[10.5px] text-inkdim">
            PAGE {currentPage} / {totalPages} · {totalCount} TOTAL
          </span>

          {/* Nav arrows + page numbers */}
          <div className="flex items-center gap-1">
            {/* « First */}
            <Link
              href={pageHref(currentFilters, 1)}
              scroll={false}
              aria-label="First page"
              className={`${btnBase} ${arrowSz} ${
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
              className={`${btnBase} ${arrowSz} ${
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
                className={`${btnBase} ${pageSz} ${
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
              className={`${btnBase} ${arrowSz} ${
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
              className={`${btnBase} ${arrowSz} ${
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
        <p className="text-center font-mono text-[12px] text-inkdim py-8">
          No audits match the selected filters.
        </p>
      )}
    </div>
  );
}
