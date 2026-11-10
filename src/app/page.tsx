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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { computeMetrics } from "@/lib/metrics";
import { ensureSeeded } from "@/lib/seed";
import { checkVlmOnline } from "@/lib/analysis";
import { OutcomeDonut, CalibrationBars, CategoryBars } from "@/components/charts";
import { UploadZone } from "@/components/upload-zone";
import {
  SectionLabel,
  StatusBadge,
  AnalyzerChip,
  SeverityBadge,
  fmtPct,
  fmtDate,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PIPELINE = [
  {
    Icon: ScanEye,
    step: "01 · Detect",
    text: "A local Qwen-VL model scans each artifact; a deterministic pixel engine takes over when the VLM is offline.",
  },
  {
    Icon: MessageSquareQuote,
    step: "02 · Explain",
    text: "Every finding carries a grounded explanation, a WCAG 2.2 mapping, a suggested fix, a region, and a confidence score.",
  },
  {
    Icon: UserCheck,
    step: "03 · Verify",
    text: "Reviewers adjudicate each finding: true positive, false positive, or uncertain — and log what the model missed.",
  },
  {
    Icon: ChartColumn,
    step: "04 · Measure",
    text: "Adjudicated labels feed live precision, recall, F1, false-alarm share and confidence calibration.",
  },
];

export default async function DashboardPage() {
  await ensureSeeded();
  const [metrics, vlmOnline, auditRows] = await Promise.all([
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

  type Kpi = {
    Icon: LucideIcon;
    label: string;
    value: string;
    sub: string;
    tone?: "warn" | "pass" | "fail";
  };
  const kpis: Kpi[] = [
    {
      Icon: ScanSearch,
      label: "Artifacts analyzed",
      value: String(metrics.totals.audits),
      sub: `${metrics.totals.findings} findings flagged`,
    },
    {
      Icon: Hourglass,
      label: "Awaiting review",
      value: String(metrics.totals.pendingReview),
      sub: `${metrics.totals.needsReviewAudits} audits in queue`,
      tone: metrics.totals.pendingReview > 0 ? "warn" : "pass",
    },
    {
      Icon: Crosshair,
      label: "Precision",
      value: metrics.precision != null ? fmtPct(metrics.precision) : "—",
      sub: metrics.precision != null ? "TP / (TP + FP) reviewed" : "review findings to score",
      tone: metrics.precision != null && metrics.precision < 0.6 ? "fail" : undefined,
    },
    {
      Icon: Radius,
      label: "Recall",
      value: metrics.recall != null ? fmtPct(metrics.recall) : "—",
      sub:
        metrics.confusion.fn === 0
          ? "no missed issues logged"
          : `${metrics.confusion.tp} TP · ${metrics.confusion.fn} missed`,
    },
    {
      Icon: ShieldAlert,
      label: "False-alarm share",
      value: metrics.fpShare != null ? fmtPct(metrics.fpShare) : "—",
      sub: "FP / reviewed findings",
      tone: metrics.fpShare != null && metrics.fpShare > 0.3 ? "fail" : "pass",
    },
    {
      Icon: ListChecks,
      label: "Audits verified",
      value: String(metrics.totals.verifiedAudits),
      sub: "all findings adjudicated",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="rise">
          <div className="mb-5 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                vlmOnline
                  ? "border-pass/30 bg-pass/[0.07] text-pass"
                  : "border-warn/30 bg-warn/[0.07] text-warn"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${vlmOnline ? "bg-pass" : "bg-warn blink"}`}
              />
              {vlmOnline ? "Qwen-VL endpoint online" : "Qwen-VL offline · heuristic active"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-inkdim">
              WCAG 2.2 · local inference · human-in-the-loop
            </span>
          </div>
          <h1 className="max-w-xl text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[52px]">
            Treat accessibility findings like{" "}
            <span className="bg-gradient-to-r from-brand to-[#ffd799] bg-clip-text text-transparent">
              an experiment
            </span>
            , not a hunch.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-inkdim">
            A11yLens runs a local vision-language model over campus posters and
            UI screenshots, explains each potential issue with its WCAG
            criterion and a concrete fix, then puts every claim in front of a
            human reviewer — so precision, recall and false-alarm rates are{" "}
            <span className="text-white">measured, not assumed</span>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#queue"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:bg-[#ffc46b]"
            >
              Open the audit queue <ArrowRight size={15} />
            </a>
            <a
              href="#method"
              className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-inktext transition hover:border-white/20 hover:text-white"
            >
              How scoring works
            </a>
          </div>
        </div>

        <div className="rise rise-2 panel p-6">
          <SectionLabel>Auditing pipeline</SectionLabel>
          <ol className="mt-5 space-y-5">
            {PIPELINE.map((p, i) => (
              <li key={p.step} className="relative flex gap-4">
                {i < PIPELINE.length - 1 && (
                  <span className="absolute left-[17px] top-10 h-[calc(100%-28px)] w-px bg-gradient-to-b from-white/15 to-transparent" />
                )}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-brand ring-1 ring-hairline">
                  <p.Icon size={16} />
                </span>
                <div>
                  <p className="text-[13px] font-semibold tracking-wide text-white">
                    {p.step}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-inkdim">
                    {p.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── KPI row ──────────────────────────────────────── */}
      <section className="rise rise-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-inkdim">
                {k.label}
              </p>
              <k.Icon
                size={14}
                className={
                  k.tone === "fail"
                    ? "text-fail"
                    : k.tone === "warn"
                      ? "text-warn"
                      : k.tone === "pass"
                        ? "text-pass"
                        : "text-inkdim"
                }
              />
            </div>
            <p
              className={`tabular mt-3 text-[28px] font-semibold leading-none ${
                k.tone === "fail"
                  ? "text-fail"
                  : k.tone === "warn"
                    ? "text-warn"
                    : "text-white"
              }`}
            >
              {k.value}
            </p>
            <p className="mt-2 truncate text-[11px] text-inkdim" title={k.sub}>
              {k.sub}
            </p>
          </div>
        ))}
      </section>

      {/* ── Evaluation charts ────────────────────────────── */}
      <section className="rise rise-4 mt-3 grid gap-3 lg:grid-cols-3">
        <div className="panel p-5">
          <SectionLabel>Verification outcomes</SectionLabel>
          <p className="mt-1 text-[11px] text-inkdim">
            Human verdicts across every model & reviewer finding.
          </p>
          <div className="mt-5">
            <OutcomeDonut outcomes={metrics.outcomes} />
          </div>
        </div>
        <div className="panel p-5">
          <SectionLabel>Confidence calibration</SectionLabel>
          <p className="mt-1 text-[11px] text-inkdim">
            Confirm rate of reviewed findings per confidence bucket — rising
            bars mean trustable scores.
          </p>
          <div className="mt-5">
            <CalibrationBars calibration={metrics.calibration} />
          </div>
        </div>
        <div className="panel p-5">
          <SectionLabel>Precision by category</SectionLabel>
          <p className="mt-1 text-[11px] text-inkdim">
            Where the model over-flags — the practical lever for FP control.
          </p>
          <div className="mt-5">
            <CategoryBars perCategory={metrics.perCategory} />
          </div>
        </div>
      </section>

      {/* ── Queue + upload ───────────────────────────────── */}
      <section id="queue" className="mt-14 scroll-mt-24">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <SectionLabel>Audit queue</SectionLabel>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
              Artifacts under review
            </h2>
          </div>
          <p className="tabular hidden text-[12px] text-inkdim sm:block">
            {auditRows.length} artifacts
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {auditRows.map(({ audit, ...c }) => {
              const status =
                c.pending > 0 ? "pending" : c.total > 0 ? "done" : "empty";
              const src = audit.imagePath ?? `/api/images/${audit.id}`;
              return (
                <Link
                  key={audit.id}
                  href={`/audits/${audit.id}`}
                  className="panel panel-hover group overflow-hidden"
                >
                  <div className="relative h-44 overflow-hidden border-b border-hairline bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={audit.title}
                      className="h-full w-full object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-ink/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-inktext ring-1 ring-hairline backdrop-blur">
                        {audit.kind === "poster" ? (
                          <Presentation size={11} />
                        ) : (
                          <MonitorSmartphone size={11} />
                        )}
                        {audit.kind === "poster" ? "Poster" : "UI screen"}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <AnalyzerChip analyzer={audit.analyzer} />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[14px] font-semibold leading-snug text-white">
                        {audit.title}
                      </h3>
                      {status === "pending" ? (
                        <StatusBadge status="pending" />
                      ) : status === "done" ? (
                        <StatusBadge status="confirmed" />
                      ) : (
                        <span className="rounded-full border border-hairline bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-inkdim">
                          No findings
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-inkdim">
                      {fmtDate(audit.createdAt)}
                      {" · "}
                      {c.total} finding{c.total === 1 ? "" : "s"}
                      {c.critical > 0 && (
                        <span className="text-fail"> · {c.critical} critical</span>
                      )}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                      {[
                        { n: c.confirmed, cls: "bg-pass/70", label: "confirmed" },
                        { n: c.rejected, cls: "bg-fail/70", label: "rejected" },
                        { n: c.pending, cls: "bg-warn/70", label: "pending" },
                      ].map((s) =>
                        s.n > 0 ? (
                          <span
                            key={s.label}
                            title={`${s.n} ${s.label}`}
                            className="tabular inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-inkdim ring-1 ring-hairline"
                          >
                            <span className={`h-1.5 w-1.5 rounded-sm ${s.cls}`} />
                            {s.n}
                          </span>
                        ) : null,
                      )}
                      <span className="ml-auto grid h-5 w-5 place-items-center rounded-full text-inkdim transition group-hover:bg-brand/15 group-hover:text-brand">
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="panel h-fit p-5">
            <SectionLabel>New audit</SectionLabel>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-inkdim">
              Upload a poster or UI screenshot. Analysis runs entirely on this
              machine; the image never leaves local storage.
            </p>
            <UploadZone />
          </div>
        </div>
      </section>

      {/* ── Methodology ──────────────────────────────────── */}
      <section id="method" className="mt-16 scroll-mt-24">
        <SectionLabel>Methodology</SectionLabel>
        <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
          How false positives stay under control
        </h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            {
              t: "Grounded detection, two engines",
              body: "A local Qwen2.5-VL model (OpenAI-compatible endpoint) produces bounded JSON findings — each with an image region, WCAG 2.2 mapping, explanation, fix, and self-reported confidence. Low-confidence claims are never auto-accepted: they enter the queue as pending. When the endpoint is unreachable, a deterministic pixel engine (contrast ratios, color-hue census, edge-density maps) takes over so the pipeline never goes dark.",
            },
            {
              t: "Human adjudication as ground truth",
              body: "Reviewers mark every finding true positive, false positive, or uncertain, and log issues the model missed (false negatives). Verified verdicts are write-protected: re-running the analyzer only refreshes un-reviewed model findings, so evaluation history can never be silently rewritten.",
            },
            {
              t: "Metrics that punish guessing",
              body: "Precision = TP/(TP+FP) over adjudicated model findings; recall = TP/(TP+FN) with FN from reviewer-logged misses; F1 balances both. Calibration buckets compare stated confidence with the observed confirm rate, exposing overconfident prompts before users trust them.",
            },
          ].map((c) => (
            <div key={c.t} className="panel p-5">
              <h3 className="text-[14px] font-semibold text-white">{c.t}</h3>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-inkdim">
                {c.body}
              </p>
            </div>
          ))}
        </div>
        <div className="panel mt-3 overflow-x-auto p-5">
          <SectionLabel>Point A11yLens at your local Qwen-VL</SectionLabel>
          <pre className="tabular mt-3 text-[12px] leading-relaxed text-inkdim">
            <code>
              <span className="text-inkdim/60"># any OpenAI-compatible server works (Ollama, vLLM, LM Studio)</span>
              {"\n"}VLM_BASE_URL=<span className="text-brand">http://127.0.0.1:11434/v1</span>{"  "}
              VLM_MODEL=<span className="text-brand">qwen2.5vl:7b</span>
              {"\n\n"}<span className="text-inkdim/60"># with Ollama, for example:</span>
              {"\n"}$ ollama pull qwen2.5vl:7b && ollama serve
            </code>
          </pre>
        </div>
      </section>
    </main>
  );
}
