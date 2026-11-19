"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  TriangleAlert,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30">
      {/* Top action bar - Hidden during print */}
      <header className="sticky top-0 z-40 border-b border-amber-950/40 bg-slate-950/90 backdrop-blur-md px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/audits/${audit.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              WORKSPACE
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-500/80">
              EXECUTIVE REMEDIATION REPORT
            </span>
          </div>

          {/* Export Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-mono font-medium text-amber-400 hover:bg-amber-500/20 transition"
              title="Print report or export as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              PRINT / PDF
            </button>
            <a
              href={`/api/export?auditId=${audit.id}&format=csv`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </a>
            <a
              href={`/api/export?auditId=${audit.id}&format=json`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <FileText className="h-3.5 w-3.5" />
              JSON
            </a>
            <a
              href={`/api/report/${audit.id}/image?download=1`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:border-slate-700 hover:text-white transition"
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
        <section className="mb-8 border-b border-slate-800/80 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  {audit.kind.replace("_", " ")}
                </span>
                <span className="text-xs font-mono text-slate-500">ID: {audit.id}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {audit.title}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Generated {new Date(audit.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })} · Standard WCAG 2.2 Level AA Remediation Audit
              </p>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Cpu className="h-3.5 w-3.5 text-amber-500" />
                  <span>ANALYZER</span>
                </div>
                <div className="mt-1 font-semibold text-white">
                  {audit.analyzer === "qwen-vl" ? "Qwen2.5-VL Vision" : "Heuristic Pixel Engine"}
                </div>
              </div>

              {audit.analyzerMs && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>LATENCY</span>
                  </div>
                  <div className="mt-1 font-semibold text-white">{audit.analyzerMs} ms</div>
                </div>
              )}

              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>REVIEW STATUS</span>
                </div>
                <div className="mt-1 font-semibold text-emerald-400">
                  {confirmedCount}/{totalFindings} Verified
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics Strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
              <div className="text-[11px] font-mono uppercase text-slate-400">Total Defect Flags</div>
              <div className="mt-1 text-xl font-bold font-mono text-white">{totalFindings}</div>
            </div>
            <div className="rounded-lg border border-red-950/40 bg-red-950/10 p-3">
              <div className="text-[11px] font-mono uppercase text-red-400">Critical Severity</div>
              <div className="mt-1 text-xl font-bold font-mono text-red-400">{criticalCount}</div>
            </div>
            <div className="rounded-lg border border-amber-950/40 bg-amber-950/10 p-3">
              <div className="text-[11px] font-mono uppercase text-amber-400">Major Severity</div>
              <div className="mt-1 text-xl font-bold font-mono text-amber-400">{majorCount}</div>
            </div>
            <div className="rounded-lg border border-sky-950/40 bg-sky-950/10 p-3">
              <div className="text-[11px] font-mono uppercase text-sky-400">Minor Severity</div>
              <div className="mt-1 text-xl font-bold font-mono text-sky-400">{minorCount}</div>
            </div>
          </div>
        </section>

        {/* Two-Column Audit Layout (Stacks vertically on print) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 print:block">
          {/* Visual Artifact with Defect Reticles */}
          <section className="lg:col-span-5 flex flex-col gap-4 print:w-full print:mb-8 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-wider text-amber-500/90 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-amber-400" />
                ANNOTATED ARTIFACT VIEW
              </h2>
              <div className="flex items-center gap-1 text-[11px] font-mono print:hidden">
                <button
                  onClick={() => setViewMode("annotated_png")}
                  className={`px-2 py-0.5 rounded transition ${
                    viewMode === "annotated_png"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  COMPOSITED (WITH OVERLAYS)
                </button>
                <button
                  onClick={() => setViewMode("interactive")}
                  className={`px-2 py-0.5 rounded transition ${
                    viewMode === "interactive"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  INTERACTIVE
                </button>
              </div>
            </div>

            {/* Artifact Container */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-2 overflow-hidden shadow-2xl print:border-none print:shadow-none print:p-0 print:overflow-visible print:bg-transparent">
              {viewMode === "annotated_png" ? (
                <div className="relative overflow-hidden rounded-lg flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/report/${audit.id}/image`}
                    alt={`Annotated remediation visual for ${audit.title}`}
                    className="w-full h-auto object-contain rounded-lg print:max-h-[500px] print:w-auto print:mx-auto"
                    loading="eager"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={audit.imageSrc}
                    alt={audit.title}
                    className="w-full h-auto object-contain rounded-lg"
                    loading="eager"
                  />

                    {/* Bounding Box Overlays */}
                    {findings.map((f, idx) => {
                      if (!f.bbox) return null;
                      const isSelected = selectedFindingId === f.id;
                      const isCritical = f.severity === "critical";
                      const isMajor = f.severity === "major";

                      const borderClass = isCritical
                        ? "border-red-500 bg-red-500/15"
                        : isMajor
                        ? "border-amber-400 bg-amber-400/15"
                        : "border-sky-400 bg-sky-400/15";

                      const badgeClass = isCritical
                        ? "bg-red-500 text-black"
                        : isMajor
                        ? "bg-amber-400 text-black"
                        : "bg-sky-400 text-black";

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
                          className={`absolute border-2 cursor-pointer transition-all duration-150 ${borderClass} ${
                            isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-20" : "z-10"
                          }`}
                        >
                          <div
                            className={`absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-tight shadow-md uppercase ${badgeClass}`}
                          >
                            #{idx + 1} {f.category}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>

            <p className="text-xs font-mono text-slate-500 text-center">
              Targeted visual evidence mapped to WCAG 2.2 Success Criteria.
            </p>
          </section>

          {/* Remediation Catalog */}
          <section className="lg:col-span-7 flex flex-col gap-6 print:w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-wider text-amber-500/90 print:text-amber-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400 print:text-amber-700" />
                ACTIONABLE REMEDIATION SPECIFICATIONS
              </h2>
              <span className="text-xs font-mono text-slate-400 print:text-slate-600">
                {findings.length} ISSUES IDENTIFIED
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
                    className={`rounded-xl border p-5 transition-all print:break-inside-avoid print:bg-white print:border-slate-300 print:shadow-none ${
                      isSelected
                        ? "border-amber-500/80 bg-slate-900/90 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/40"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    {/* Finding Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-500">#{idx + 1}</span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                            f.severity === "critical"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : f.severity === "major"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {sevMeta.label}
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                          {catMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        {f.wcag && (
                          <span className="text-amber-400/90 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/40">
                            {f.wcag}
                          </span>
                        )}
                        {f.confidence != null && (
                          <span className="text-slate-500">
                            {Math.round(f.confidence * 100)}% conf
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Defect Title & Explanation */}
                    <div className="mt-3">
                      <h3 className="text-base font-semibold text-white tracking-tight">{f.title}</h3>
                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{f.explanation}</p>
                    </div>

                    {/* Concrete Remediation Fix */}
                    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/15 p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        PRECISE REMEDIATION STEP
                      </div>
                      <p className="text-xs text-amber-100/90 leading-relaxed font-sans">{f.suggestion}</p>
                    </div>

                    {/* Review metadata strip */}
                    {f.verifiedBy && (
                      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Adjudicated by: {f.verifiedBy}</span>
                        {f.humanSeverity && f.humanSeverity !== f.severity && (
                          <span className="text-amber-400">
                            Severity adjusted to: {f.humanSeverity.toUpperCase()}
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
        <section className="mt-16 rounded-xl border border-slate-800 bg-slate-900/50 p-6 print:border-slate-400">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Limitations & Methodology Notice
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
                Automated vision-language accessibility audits evaluate visual-only defects (contrast, typography, color coding, visual touch bounds). They do not replace manual keyboard navigation or screen reader assistive hardware audits.
              </p>
            </div>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:border-amber-500/50 hover:text-amber-400 transition shrink-0"
            >
              FULL LIMITATIONS STATEMENT →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
