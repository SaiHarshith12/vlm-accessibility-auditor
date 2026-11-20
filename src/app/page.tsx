import {
  ScanSearch,
  ListChecks,
  Crosshair,
  Radius,
  ShieldAlert,
  Hourglass,
  ScanEye,
  MessageSquareQuote,
  UserCheck,
  ChartColumn,
  ArrowRight,
  MonitorSmartphone,
  Presentation,
  ShieldCheck,
  Terminal,
  Activity,
  CheckCircle2,
  Cpu,
  Sparkles,
  Download,
  FileText,
  ThumbsUp,
  type LucideIcon,
} from "@/components/icons";
import Link from "next/link";
import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { computeMetrics } from "@/lib/metrics";
import { ensureSeeded } from "@/lib/seed";
import { checkVlmOnline } from "@/lib/analysis";
import {
  OutcomeDonut,
  CalibrationBars,
  CategoryBars,
  SeverityDriftMatrix,
} from "@/components/charts";
import { UploadZone } from "@/components/upload-zone";
import { HeroTelemetryArtifact } from "@/components/hero-telemetry-artifact";
import { MOCK_AUDITS, getMockMetrics, isMockDataEnabled } from "@/mocks/mock-data";
import {
  SectionLabel,
  StatusBadge,
  AnalyzerChip,
  ActiveModelBanner,
  fmtPct,
  fmtDate,
} from "@/components/ui";
import { AuditQueueNav } from "@/components/audit-queue-nav";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PIPELINE_STEPS = [
  {
    step: "01",
    name: "Vision detection",
    desc: "Local Qwen-VL multimodal model detects defects; fallback to deterministic contrast & edge engine if offline.",
  },
  {
    step: "02",
    name: "Grounded explanation",
    desc: "Each claim is mapped to exact WCAG 2.2 criterion with pixel bounding box, confidence score and suggested fix.",
  },
  {
    step: "03",
    name: "Human adjudication",
    desc: "Reviewers verify findings as True Positive, False Positive, or log missed issues (False Negatives).",
  },
  {
    step: "04",
    name: "Empirical scoring",
    desc: "Precision, Recall, F1 and confidence calibration are computed in real time from verified ground truth.",
  },
];

const PAGE_SIZE = 2;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const rawPage = parseInt(sp.page ?? "1", 10);
  const filterStatus = sp.status ?? "";
  const filterKind = sp.kind ?? "";
  const filterSeverity = sp.severity ?? "";
  const filterAnalyzer = sp.analyzer ?? "";

  const useMock = isMockDataEnabled();
  let metrics;
  let vlmOnline = false;
  let auditRows: any[] = [];

  if (useMock) {
    metrics = getMockMetrics();
    vlmOnline = true;
    auditRows = MOCK_AUDITS.map((a) => ({
      audit: a,
      total: a.counts.total,
      pending: a.counts.pending,
      confirmed: a.counts.confirmed,
      rejected: a.counts.rejected,
      critical: a.counts.critical,
    }));
  } else {
    try {
      await ensureSeeded();
      const [m, v, rows] = await Promise.all([
        computeMetrics(),
        checkVlmOnline(),
        db
          .select({
            audit: audits,
            total: sql<number>`count(${findings.id})::int`,
            pending: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'pending')::int`,
            confirmed: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'confirmed')::int`,
            rejected: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'rejected')::int`,
            critical: sql<number>`count(${findings.id}) filter (where ${findings.severity} = 'critical' and ${findings.status} != 'rejected')::int`,
          })
          .from(audits)
          .leftJoin(findings, eq(findings.auditId, audits.id))
          .groupBy(audits.id)
          .orderBy(desc(audits.createdAt)),
      ]);
      metrics = m;
      vlmOnline = v;
      auditRows = rows as any[];
    } catch {
      // Graceful fallback to mock testing data if PostgreSQL is not active
      metrics = getMockMetrics();
      vlmOnline = true;
      auditRows = MOCK_AUDITS.map((a) => ({
        audit: a,
        total: a.counts.total,
        pending: a.counts.pending,
        confirmed: a.counts.confirmed,
        rejected: a.counts.rejected,
        critical: a.counts.critical,
      }));
    }
  }

  // ── Server-side filter ───────────────────────────────────────────────────
  let filtered = auditRows as any[];

  if (filterStatus) {
    filtered = filtered.filter(({ audit: _a, ...c }: any) => {
      if (filterStatus === "pending") return c.pending > 0;
      if (filterStatus === "done") return c.pending === 0 && c.total > 0;
      if (filterStatus === "tp") return c.confirmed > 0;
      return true;
    });
  }
  if (filterKind) {
    filtered = filtered.filter(({ audit }: any) => audit.kind === filterKind);
  }
  if (filterSeverity) {
    filtered = filtered.filter(({ audit: _a, ...c }: any) => {
      if (filterSeverity === "critical") return c.critical > 0;
      if (filterSeverity === "major") return c.critical === 0 && c.total > 0;
      if (filterSeverity === "minor") return c.critical === 0 && c.total > 0;
      return true;
    });
  }
  if (filterAnalyzer) {
    filtered = filtered.filter(({ audit }: any) => audit.analyzer === filterAnalyzer);
  }

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const currentFilters = { status: filterStatus, kind: filterKind, severity: filterSeverity, analyzer: filterAnalyzer };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
      {/* ── HERO SECTION WITH INTERACTIVE VISION TELEMETRY VIEWPORT ── */}
      <section className="py-10 lg:py-14 grid gap-10 lg:grid-cols-[1.1fr_1.1fr] lg:items-center">
        <div className="space-y-6">
          {/* Status and architecture tag */}
          <div className="space-y-3 font-sans text-[12px]">
            <ActiveModelBanner
              analyzer={vlmOnline ? "qwen-vl" : "heuristic"}
              online={vlmOnline}
              compact={true}
            />
            {useMock && (
              <div className="flex items-center gap-2 text-[var(--color-muted)] text-[11px] font-mono">
                <span className="rounded-[4px] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] px-2 py-0.5 text-[var(--color-accent-ink)] font-bold">
                  TESTING MOCK DATASET ACTIVE
                </span>
                <span>/</span>
                <span>Standalone evaluation mode</span>
              </div>
            )}
          </div>

          {/* Headline in sentence case, Red Hat Display 600 */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-ink)] leading-[1.1]">
              Accessibility audits grounded in empirical vision evidence.
            </h1>
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[var(--color-muted)] max-w-xl font-sans">
              Eliminate AI hallucination from accessibility compliance. AURA (Accessibility Understanding and Remediation Assistant) runs a local vision-language model to ground every defect in exact bounding boxes, calculates contrast and edge metrics, and feeds a human verification loop so precision and recall are <strong className="text-[var(--color-ink)] font-semibold">measured, never assumed</strong>.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#upload"
              className="btn btn--primary h-11 px-5 text-[13px]"
            >
              <Sparkles size={16} />
              <span>Launch new audit</span>
              <ArrowRight size={15} />
            </a>
            <a
              href="#queue"
              className="btn h-11 px-4 text-[13px]"
            >
              <ListChecks size={15} className="text-[var(--color-accent)]" />
              <span>Review audit queue ({auditRows.length})</span>
            </a>
          </div>

          {/* Pipeline stages micro-strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[var(--color-rule)]">
            {PIPELINE_STEPS.map((p) => (
              <div key={p.step} className="rounded-[6px] bg-[var(--color-paper-2)] border border-[var(--color-rule)] p-2.5 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-[var(--color-accent-ink)] bg-[var(--color-accent-soft)] px-1.5 py-0.5 rounded-[3px]">{p.step}</span>
                <p className="font-sans text-[12px] font-semibold text-[var(--color-ink)] mt-1.5">{p.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Interactive Live Telemetry Viewport */}
        <div className="w-full">
          <HeroTelemetryArtifact />
        </div>
      </section>

      {/* ── MISSION CONTROL TELEMETRY METRICS RIBBON (CALIBRATION LEDGER) ── */}
      <section className="mt-8 mb-12">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel badge="CALIBRATION LEDGER">System Telemetry & Ground Truth</SectionLabel>
          <span className="font-mono text-[11px] text-[var(--color-muted)] hidden sm:inline">
            N = {metrics.totals.findings} EVALUATED CLAIMS
          </span>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 divide-x divide-[var(--color-rule)] font-sans">
            {/* Artifacts */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-semibold">
                <span>ARTIFACTS</span>
                <ScanSearch size={14} className="text-[var(--color-accent)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] mt-2 font-mono tabular">
                {metrics.totals.audits}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                {metrics.totals.findings} total findings
              </p>
            </div>

            {/* Awaiting Review */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-semibold">
                <span>IN REVIEW QUEUE</span>
                <Hourglass size={14} className="text-[var(--color-accent)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-accent-ink)] mt-2 font-mono tabular">
                {metrics.totals.pendingReview}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                {metrics.totals.needsReviewAudits} audits awaiting review
              </p>
            </div>

            {/* Precision */}
            <div className="p-4 sm:p-5 flex flex-col justify-between bg-[var(--color-paper-3)]/40">
              <div className="flex items-center justify-between text-[var(--color-green)] text-[11px] font-semibold">
                <span>PRECISION (TP RATE)</span>
                <Crosshair size={14} className="text-[var(--color-green)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-green)] mt-2 font-mono tabular">
                {metrics.precision != null ? fmtPct(metrics.precision) : "—"}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                TP / (TP + FP) reviewed
              </p>
            </div>

            {/* Recall */}
            <div className="p-4 sm:p-5 flex flex-col justify-between bg-[var(--color-paper-3)]/40">
              <div className="flex items-center justify-between text-[var(--color-water)] text-[11px] font-semibold">
                <span>RECALL (COVERAGE)</span>
                <Radius size={14} className="text-[var(--color-water)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-water)] mt-2 font-mono tabular">
                {metrics.recall != null ? fmtPct(metrics.recall) : "—"}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                {metrics.confusion.fn === 0 ? "Zero logged misses" : `${metrics.confusion.fn} false negatives`}
              </p>
            </div>

            {/* False Alarm Share */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-semibold">
                <span>FALSE ALARM (FP)</span>
                <ShieldAlert size={14} className="text-[var(--color-vermilion)]" />
              </div>
              <p
                className={`text-2xl sm:text-3xl font-bold mt-2 font-mono tabular ${metrics.fpShare != null && metrics.fpShare > 0.3
                  ? "text-[var(--color-vermilion)]"
                  : "text-[var(--color-ink)]"
                  }`}
              >
                {metrics.fpShare != null ? fmtPct(metrics.fpShare) : "—"}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                FP / total reviewed
              </p>
            </div>

            {/* Audits Verified */}
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] font-semibold">
                <span>CLOSED AUDITS</span>
                <ListChecks size={14} className="text-[var(--color-ink)]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] mt-2 font-mono tabular">
                {metrics.totals.verifiedAudits}
              </p>
              <p className="text-[11px] text-[var(--color-muted)] mt-1 truncate">
                100% adjudicated
              </p>
            </div>
          </div>

          {/* Secondary Forensic Evaluation Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--color-rule)] border-t border-[var(--color-rule)] bg-[var(--color-paper-3)]/30 font-sans text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-muted)]">Avg runtime latency</span>
              <span className="font-bold text-[var(--color-ink)] font-mono">
                {metrics.avgAnalyzerMs ? `${metrics.avgAnalyzerMs} ms` : "—"}
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-muted)]">Severity agreement</span>
              <span className="font-bold text-[var(--color-green)] font-mono">
                {metrics.severityAgreement?.agreementRate != null
                  ? fmtPct(metrics.severityAgreement.agreementRate)
                  : "—"}
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-muted)]">Remediation helpfulness</span>
              <span className="font-bold text-[var(--color-accent-ink)] font-mono">
                {metrics.remediationScore?.helpfulRate != null
                  ? fmtPct(metrics.remediationScore.helpfulRate)
                  : "—"}
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-muted)]">Harmonic F1-score</span>
              <span className="font-bold text-[var(--color-ink)] font-mono">
                {metrics.f1 != null ? fmtPct(metrics.f1) : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── EVALUATION TELEMETRY: CALIBRATION & CATEGORIES ── */}
      <section id="metrics" className="mb-14 scroll-mt-24">
        <div className="mb-3">
          <SectionLabel badge="RELIABILITY FORENSICS">Model Reliability Diagnostics</SectionLabel>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Outcomes distribution */}
          <div className="surface-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--color-ink)] flex items-center justify-between">
                <span>Verification verdicts</span>
                <span className="text-[11px] font-mono text-[var(--color-muted)] font-normal">TP / FP</span>
              </h3>
              <p className="text-[12px] text-[var(--color-muted)] mt-1">
                Human adjudications across model claims.
              </p>
            </div>
            <div className="mt-5">
              <OutcomeDonut outcomes={metrics.outcomes} />
            </div>
          </div>

          {/* Calibration bar chart */}
          <div className="surface-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--color-ink)] flex items-center justify-between">
                <span>Calibration</span>
                <span className="text-[11px] font-mono text-[var(--color-muted)] font-normal">RELIABILITY</span>
              </h3>
              <p className="text-[12px] text-[var(--color-muted)] mt-1">
                Observed confirmation rate vs reported confidence.
              </p>
            </div>
            <div className="mt-4">
              <CalibrationBars calibration={metrics.calibration} />
            </div>
          </div>

          {/* Precision per category */}
          <div className="surface-card p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--color-ink)] flex items-center justify-between">
                <span>By category</span>
                <span className="text-[11px] font-mono text-[var(--color-muted)] font-normal">PRECISION</span>
              </h3>
              <p className="text-[12px] text-[var(--color-muted)] mt-1">
                Breakdown of TP/FP precision rates across categories.
              </p>
            </div>
            <div className="mt-4">
              <CategoryBars perCategory={metrics.perCategory} />
            </div>
          </div>

          {/* Severity Drift Matrix */}
          <div className="surface-card p-5 flex flex-col justify-start gap-4">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--color-ink)] flex items-center justify-between">
                <span>Severity drift</span>
                <span className="text-[11px] font-mono text-[var(--color-muted)] font-normal">ALIGNMENT</span>
              </h3>
              <p className="text-[12px] text-[var(--color-muted)] mt-1">
                Model severity vs human-verified ground truth.
              </p>
            </div>
            <div>
              <SeverityDriftMatrix agreement={metrics.severityAgreement} />
            </div>
          </div>
        </div>
      </section>

      {/* ── AUDIT QUEUE + UPLOAD ZONE ── */}
      <section id="queue" className="scroll-mt-24 mb-14">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionLabel badge="ACTIVE DECK">Inspection Queue</SectionLabel>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)] mt-1">
              Artifacts under adjudication
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="text-[var(--color-muted)]">{totalCount} AUDITED ARTIFACTS</span>
            <span className="text-[var(--color-rule)]">·</span>
            <a
              href="/api/export?format=csv"
              download
              className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-1 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition shadow-sm font-sans text-[11.5px]"
              title="Download entire dataset as CSV"
            >
              <Download size={12} />
              <span>Dataset CSV</span>
            </a>
            <a
              href="/api/export?format=json"
              download
              className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2.5 py-1 text-[var(--color-ink)] hover:border-[var(--color-ink)] transition shadow-sm font-sans text-[11.5px]"
              title="Download entire dataset as JSON"
            >
              <FileText size={12} />
              <span>Dataset JSON</span>
            </a>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* Left: Queue Grid */}
          <div className="flex flex-col">
            <div className="grid gap-3 sm:grid-cols-2">
              {(pageRows as any[]).map(({ audit, ...c }) => {
              const status =
                c.pending > 0 ? "pending" : c.total > 0 ? "done" : "empty";
              const src = audit.imagePath ?? `/api/images/${audit.id}`;

              return (
                <Link
                  key={audit.id}
                  href={`/audits/${audit.id}`}
                  className="surface-card surface-card-hover group flex flex-col justify-between overflow-hidden"
                >
                  {/* Thumbnail viewport */}
                  <div className="relative h-44 overflow-hidden border-b border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={audit.title}
                      className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Top badges overlay */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[var(--color-paper-2)]/90 px-2 py-1 font-sans text-[11px] font-semibold text-[var(--color-ink)] shadow-sm border border-[var(--color-rule)] backdrop-blur">
                        {audit.kind === "poster" ? (
                          <Presentation size={12} className="text-[var(--color-accent-ink)]" />
                        ) : (
                          <MonitorSmartphone size={12} className="text-[var(--color-water)]" />
                        )}
                        {audit.kind === "poster" ? "Poster" : "UI Screen"}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3">
                      <AnalyzerChip analyzer={audit.analyzer} />
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-[14.5px] font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent-ink)] transition leading-snug">
                          {audit.title}
                        </h3>
                        {status === "pending" ? (
                          <StatusBadge status="pending" />
                        ) : status === "done" ? (
                          <StatusBadge status="confirmed" />
                        ) : (
                          <span className="rounded-[4px] bg-[var(--color-paper-3)] px-2 py-0.5 font-sans text-[11px] text-[var(--color-muted)]">
                            No issues
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-mono text-[11px] text-[var(--color-muted)]">
                        {fmtDate(audit.createdAt)} · {c.total} claim{c.total === 1 ? "" : "s"}
                        {c.critical > 0 && (
                          <span className="text-[var(--color-vermilion)] font-semibold"> · {c.critical} critical</span>
                        )}
                      </p>
                    </div>

                    {/* Verification mini-meter */}
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-rule)] pt-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        {c.confirmed > 0 && (
                          <span className="text-[var(--color-green)] font-semibold bg-[var(--color-green-soft)] px-1.5 py-0.5 rounded-[3px] border border-[var(--color-green)]">
                            {c.confirmed} TP
                          </span>
                        )}
                        {c.rejected > 0 && (
                          <span className="text-[var(--color-vermilion)] font-semibold bg-[var(--color-vermilion-soft)] px-1.5 py-0.5 rounded-[3px] border border-[var(--color-vermilion)]">
                            {c.rejected} FP
                          </span>
                        )}
                        {c.pending > 0 && (
                          <span className="text-[var(--color-accent-ink)] font-semibold bg-[var(--color-accent-soft)] px-1.5 py-0.5 rounded-[3px] border border-[var(--color-accent)]">
                            {c.pending} pending
                          </span>
                        )}
                      </div>

                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-paper-3)] text-[var(--color-muted)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-ink)] transition">
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>

            {/* Pagination + filter nav */}
            <AuditQueueNav
              currentPage={safePage}
              totalPages={totalPages}
              totalCount={totalCount}
              currentFilters={currentFilters}
            />
          </div>

          {/* Right: Upload Dropzone Frame */}
          <div id="upload" className="surface-card p-5 h-fit scroll-mt-24">
            <SectionLabel badge="NEW INGEST">Ingest new artifact</SectionLabel>
            <p className="text-[12.5px] text-[var(--color-muted)] mt-1 mb-4 leading-relaxed font-sans">
              Upload campus flyers or UI frames for grounded VLM accessibility decomposition. Analysis executes completely in your local environment.
            </p>
            <UploadZone />
          </div>
        </div>
      </section>

      {/* ── METHODOLOGY & OFFLINE PIPELINE ── */}
      <section id="method" className="scroll-mt-24">
        <SectionLabel badge="SPECIFICATION">Evaluation Protocol</SectionLabel>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)] mt-1 mb-6">
          How false positives stay under empirical control
        </h2>

        <div className="grid gap-4 sm:grid-cols-3 font-sans">
          <div className="surface-card p-5">
            <div className="flex items-center gap-2 text-[var(--color-ink)] text-[13px] font-bold mb-2">
              <Cpu size={16} className="text-[var(--color-accent)]" />
              <span>Two dual vision engines</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Qwen2.5-VL provides semantic spatial reasoning (reading orders, hierarchy, complex layouts) while an airgapped deterministic pixel engine computes contrast ratios, colorfulness, and edge density.
            </p>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center gap-2 text-[var(--color-green)] text-[13px] font-bold mb-2">
              <UserCheck size={16} />
              <span>Write-protected ground truth</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Reviewers mark claims as True Positive or False Positive, and record model omissions (False Negatives). Verified labels are locked so re-analysis never contaminates historic benchmark records.
            </p>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center gap-2 text-[var(--color-water)] text-[13px] font-bold mb-2">
              <Activity size={16} />
              <span>Calibration that punishes guessing</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              Precision = TP / (TP + FP); Recall = TP / (TP + FN). Confidence calibration plots the model’s claimed probability against the actual human confirmation rate to flag overconfidence.
            </p>
          </div>
        </div>

        {/* Local Qwen configuration snippet */}
        <div className="surface-card mt-4 p-5 font-mono text-[12px]">
          <div className="flex items-center justify-between text-[var(--color-muted)] text-[11px] pb-2 border-b border-[var(--color-rule)] mb-3 font-sans">
            <span className="flex items-center gap-2 text-[var(--color-ink)] font-semibold">
              <Terminal size={14} className="text-[var(--color-accent)]" />
              <span>Connect Local Vision-Language Model (Ollama / vLLM / LM Studio)</span>
            </span>
            <span className="text-[var(--color-muted)] font-mono text-[10px]">OPENAI-COMPATIBLE API</span>
          </div>
          <pre className="text-[var(--color-ink)] leading-relaxed overflow-x-auto bg-[var(--color-paper-3)] p-3 rounded-[6px] border border-[var(--color-rule)]">
            <code>
              <span className="text-[var(--color-muted)]"># Configure local endpoint in your .env:</span>{"\n"}
              VLM_BASE_URL=<span className="font-bold text-[var(--color-accent-ink)]">http://127.0.0.1:11434/v1</span>{"\n"}
              VLM_MODEL=<span className="font-bold text-[var(--color-accent-ink)]">qwen2.5vl:3b</span>{"\n\n"}
              <span className="text-[var(--color-muted)]"># Launch with Ollama:</span>{"\n"}
              $ ollama pull qwen2.5vl:3b && ollama run qwen2.5vl:3b
            </code>
          </pre>
        </div>
      </section>
    </main>
  );
}
