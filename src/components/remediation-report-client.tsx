"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Crosshair,
} from "./icons";
import { SEVERITY_META, CATEGORY_META, type Category, type Severity } from "@/lib/taxonomy";

export interface ReportFinding {
  id: string;
  source: string;
  category: string;
  severity: string;
  humanSeverity?: string | null;
  remediationRating?: string | null;
  title: string;
  explanation: string;
  suggestion: string;
  wcag: string | null;
  confidence: number | null;
  bbox: { x: number; y: number; w: number; h: number } | null;
  status: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export interface ReportAudit {
  id: string;
  title: string;
  kind: string;
  analyzer: string;
  analyzerMs?: number | null;
  createdAt: string;
  imageSrc: string;
  width: number | null;
  height: number | null;
}

interface Props {
  audit: ReportAudit;
  findings: ReportFinding[];
}

export function RemediationReportClient({ audit, findings }: Props) {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"annotated_png" | "interactive">("annotated_png");

  const totalFindings = findings.length;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const majorCount = findings.filter((f) => f.severity === "major").length;
  const minorCount = findings.filter((f) => f.severity === "minor").length;
  const confirmedCount = findings.filter((f) => f.status === "confirmed").length;

  const handlePrint = () => {
    setViewMode("annotated_png");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-ink)]">
      {/* Top action bar - Hidden during print */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/95 backdrop-blur-md px-6 py-3 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/audits/${audit.id}`}
              className="btn btn--sm inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Workspace
            </Link>
            <div className="h-4 w-px bg-[var(--color-rule)]" />
            <span className="text-xs text-[var(--color-muted)] font-mono">
              Executive remediation report
            </span>
          </div>

          {/* Export Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn--primary btn--sm inline-flex items-center gap-1.5"
              title="Print report or export as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <a
              href={`/api/export?auditId=${audit.id}&format=csv`}
              download
              className="btn btn--sm inline-flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </a>
            <a
              href={`/api/export?auditId=${audit.id}&format=json`}
              download
              className="btn btn--sm inline-flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              <FileText className="h-3.5 w-3.5" />
              JSON
            </a>
            <a
              href={`/api/report/${audit.id}/image?download=1`}
              target="_blank"
              rel="noreferrer"
              className="btn btn--sm inline-flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              PNG
            </a>
          </div>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="mx-auto max-w-7xl p-6 lg:p-10">
        {/* Document Header */}
        <section className="mb-8 border-b border-[var(--color-rule)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                  {audit.kind.replace("_", " ")}
                </span>
                <span className="text-xs font-mono text-[var(--color-muted)]">ID: {audit.id}</span>
              </div>
              <h1 className="text-2xl font-light tracking-tight text-[var(--color-ink)] sm:text-3xl font-heading">
                {audit.title}
              </h1>
              <p className="mt-1 text-xs text-[var(--color-muted)] font-mono">
                Generated {new Date(audit.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} · Standard WCAG 2.2 Level AA remediation audit
              </p>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="surface-card p-2.5 min-w-[130px]">
                <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                  <Cpu className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-mono">Analyzer</span>
                </div>
                <div className="mt-1 font-medium text-[var(--color-ink)]">
                  {audit.analyzer === "qwen-vl" ? "Qwen2.5-VL" : "Sharp pixel engine"}
                </div>
              </div>

              {audit.analyzerMs && (
                <div className="surface-card p-2.5 min-w-[120px]">
                  <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-wider font-mono">Latency</span>
                  </div>
                  <div className="mt-1 font-mono text-[var(--color-ink)] num">
                    {audit.analyzerMs}<span className="u text-[10px] ml-0.5">ms</span>
                  </div>
                </div>
              )}

              <div className="surface-card p-2.5 min-w-[130px]">
                <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span className="text-[11px] uppercase tracking-wider font-mono">Review status</span>
                </div>
                <div className="mt-1 font-mono text-[var(--color-accent)] text-xs">
                  {confirmedCount} / {totalFindings} verified
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics Strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="surface-card p-3">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--color-muted)]">Total defect flags</div>
              <div className="mt-1 text-2xl font-light font-mono text-[var(--color-ink)] num">{totalFindings}</div>
            </div>
            <div className="surface-card p-3 border-l-2 border-l-[var(--color-vermilion)]">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--color-muted)]">Critical severity</div>
              <div className="mt-1 text-2xl font-light font-mono text-[var(--color-vermilion)] num">{criticalCount}</div>
            </div>
            <div className="surface-card p-3 border-l-2 border-l-[var(--color-sienna)]">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--color-muted)]">Major severity</div>
              <div className="mt-1 text-2xl font-light font-mono text-[var(--color-sienna)] num">{majorCount}</div>
            </div>
            <div className="surface-card p-3 border-l-2 border-l-[var(--color-accent)]">
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--color-muted)]">Minor severity</div>
              <div className="mt-1 text-2xl font-light font-mono text-[var(--color-accent)] num">{minorCount}</div>
            </div>
          </div>
        </section>

        {/* Two-Column Audit Layout (Stacks vertically on print) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 print:block">
          {/* Visual Artifact with Defect Reticles */}
          <section className="lg:col-span-5 flex flex-col gap-4 print:w-full print:mb-8 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
                <Crosshair className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                Annotated artifact view
              </h2>
              <div className="flex items-center gap-1 text-xs print:hidden">
                <button
                  onClick={() => setViewMode("annotated_png")}
                  className={`px-2.5 py-1 rounded transition border text-xs font-mono ${
                    viewMode === "annotated_png"
                      ? "border-[var(--color-rule-2)] bg-[var(--color-paper-3)] text-[var(--color-accent)] font-medium"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  Composited
                </button>
                <button
                  onClick={() => setViewMode("interactive")}
                  className={`px-2.5 py-1 rounded transition border text-xs font-mono ${
                    viewMode === "interactive"
                      ? "border-[var(--color-rule-2)] bg-[var(--color-paper-3)] text-[var(--color-accent)] font-medium"
                      : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  Interactive
                </button>
              </div>
            </div>

            {/* Artifact Container */}
            <div className="surface-card p-2 overflow-hidden print:border-none print:shadow-none print:p-0 print:overflow-visible print:bg-transparent">
              {viewMode === "annotated_png" ? (
                <div className="relative overflow-hidden rounded flex items-center justify-center bg-[var(--color-paper-3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/report/${audit.id}/image`}
                    alt={`Annotated remediation visual for ${audit.title}`}
                    className="w-full h-auto object-contain rounded print:max-h-[500px] print:w-auto print:mx-auto"
                    loading="eager"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded select-none bg-[var(--color-paper-3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={audit.imageSrc}
                    alt={audit.title}
                    className="w-full h-auto object-contain rounded"
                    loading="eager"
                  />

                  {/* Bounding Box Overlays */}
                  {findings.map((f, idx) => {
                    if (!f.bbox) return null;
                    const isSelected = selectedFindingId === f.id;
                    const isCritical = f.severity === "critical";
                    const isMajor = f.severity === "major";

                    const borderClass = isCritical
                      ? "border-[var(--color-vermilion)] bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)]"
                      : isMajor
                      ? "border-[var(--color-sienna)] bg-[var(--color-sienna)]/15 text-[var(--color-sienna)]"
                      : "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]";

                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFindingId(f.id)}
                        style={{
                          left: `${f.bbox.x * 100}%`,
                          top: `${f.bbox.y * 100}%`,
                          width: `${f.bbox.w * 100}%`,
                          height: `${f.bbox.h * 100}%`,
                        }}
                        className={`absolute border cursor-pointer transition-all duration-150 rounded ${borderClass} ${
                          isSelected ? "ring-2 ring-[var(--color-accent)] z-20" : "z-10"
                        }`}
                      >
                        <div
                          className="absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-mono tracking-tight bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)]"
                        >
                          #{idx + 1} {f.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-xs font-mono text-[var(--color-muted)] text-center">
              Targeted visual evidence mapped to WCAG 2.2 Success Criteria.
            </p>
          </section>

          {/* Remediation Catalog */}
          <section className="lg:col-span-7 flex flex-col gap-6 print:w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                Actionable remediation specifications
              </h2>
              <span className="text-xs font-mono text-[var(--color-muted)]">
                {findings.length} issues identified
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {findings.map((f, idx) => {
                const isSelected = selectedFindingId === f.id;
                const catMeta = CATEGORY_META[f.category as Category] ?? CATEGORY_META.other;
                const sevMeta = SEVERITY_META[f.severity as Severity] ?? SEVERITY_META.major;

                return (
                  <div
                    key={f.id}
                    id={`finding-${f.id}`}
                    onClick={() => setSelectedFindingId(f.id)}
                    className={`surface-card p-5 transition-all print:break-inside-avoid cursor-pointer ${
                      isSelected
                        ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]"
                        : "hover:border-[var(--color-rule-2)]"
                    }`}
                  >
                    {/* Finding Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--color-ink)]">#{idx + 1}</span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${
                            f.severity === "critical"
                              ? "bg-[var(--color-vermilion)]/10 text-[var(--color-vermilion)] border border-[var(--color-vermilion)]/30 border-l-2 border-l-[var(--color-vermilion)]"
                              : f.severity === "major"
                              ? "bg-[var(--color-sienna)]/10 text-[var(--color-sienna)] border border-[var(--color-sienna)]/30 border-l-2 border-l-[var(--color-sienna)]"
                              : "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 border-l-2 border-l-[var(--color-accent)]"
                          }`}
                        >
                          {sevMeta.label}
                        </span>
                        <span className="inline-flex items-center rounded border border-[var(--color-rule)] bg-[var(--color-paper-3)] px-2 py-0.5 text-xs text-[var(--color-muted)] font-mono">
                          {catMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-muted)]">
                        {f.wcag && (
                          <span className="bg-[var(--color-paper-3)] px-2 py-0.5 rounded border border-[var(--color-rule)]">
                            {f.wcag}
                          </span>
                        )}
                        {f.confidence != null && (
                          <span className="num">
                            {Math.round(f.confidence * 100)}<span className="u text-[10px] ml-0.5">%</span> conf
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Defect Title & Explanation */}
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-[var(--color-ink)] tracking-tight">{f.title}</h3>
                      <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">{f.explanation}</p>
                    </div>

                    {/* Concrete Remediation Fix */}
                    <div className="mt-3 rounded border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink)] mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                        Precise remediation step
                      </div>
                      <p className="text-xs text-[var(--color-muted)] leading-relaxed">{f.suggestion}</p>
                    </div>

                    {/* Review metadata strip */}
                    {f.verifiedBy && (
                      <div className="mt-3 flex items-center justify-between text-xs font-mono text-[var(--color-muted)]">
                        <span>Adjudicated by: {f.verifiedBy}</span>
                        {f.humanSeverity && f.humanSeverity !== f.severity && (
                          <span className="text-[var(--color-sienna)]">
                            Severity adjusted to: {f.humanSeverity}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Methodology & Limitations Footer Note */}
        <section className="mt-16 surface-card p-6 print:border-[var(--color-rule)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-ink)] font-heading">
                Limitations & methodology notice
              </h4>
              <p className="mt-1 text-xs text-[var(--color-muted)] max-w-2xl leading-relaxed">
                Automated vision-language accessibility audits evaluate visual-only defects (contrast, typography, color coding, visual touch bounds). They do not replace manual keyboard navigation or screen reader assistive hardware audits.
              </p>
            </div>
            <Link
              href="/methodology"
              className="btn btn--sm shrink-0 inline-flex items-center gap-1.5"
            >
              Full limitations statement →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}