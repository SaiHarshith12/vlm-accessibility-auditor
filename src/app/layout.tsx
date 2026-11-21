import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ScanEye, ShieldCheck, Activity } from "@/components/icons";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Accessibility Understanding and Remediation Assistant",
  description:
    "AURA: Accessibility Understanding and Remediation Assistant. Spatial accessibility verification for campus posters and UI artifacts with local vision-language models, grounded human adjudication, and empirical false-positive control.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink-2)] antialiased font-sans">
        {/* Top telemetry bar */}
        <div className="border-b border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[11px] font-sans text-[var(--color-muted)] px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[var(--color-ink)] font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span>Station local-01</span>
            </span>
            <span className="text-[var(--color-rule)]">/</span>
            <span className="hidden sm:inline text-[var(--color-muted)]">
              Active engine: Qwen2.5-VL · Multimodal VLM
            </span>
            <span className="text-[var(--color-rule)] hidden md:inline">/</span>
            <span className="hidden md:inline">WCAG 2.2 AA/AAA benchmark</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
              <ShieldCheck size={12} />
              <span>Airgapped & local</span>
            </span>
            <span className="tabular num hidden md:inline text-[var(--color-muted)]">
              2026.11<span className="u">build</span>
            </span>
          </div>
        </div>

        {/* Main navigation header */}
        <header className="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/95 backdrop-blur-md transition-all">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] text-[var(--color-accent)]">
                <ScanEye size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[17px] font-normal tracking-tight text-[var(--color-ink)]">
                    AURA
                  </span>
                  <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-accent-ink)] px-2 py-0.5 text-[10px] font-medium leading-none">
                    Auditor
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-muted)] font-normal leading-none mt-0.5">
                  Accessibility Understanding and Remediation Assistant
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition"
              >
                <Activity size={13} className="text-[var(--color-accent)]" />
                <span>Console</span>
              </Link>
              <Link
                href="/#queue"
                className="rounded-full px-3 py-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition"
              >
                Inspection queue
              </Link>
              <Link
                href="/#metrics"
                className="rounded-full px-3 py-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition"
              >
                Calibration ledger
              </Link>
              <Link
                href="/methodology"
                className="hidden sm:inline-flex rounded-full px-3 py-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition"
              >
                Methodology
              </Link>
              <div className="ml-2 hidden h-4 w-px bg-[var(--color-rule)] md:block" />
              <a
                href="#upload"
                className="btn btn--primary btn--sm"
              >
                + Ingest new artifact
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* Console footer */}
        <footer className="border-t border-[var(--color-rule)] bg-[var(--color-paper)] mt-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between text-[12px] text-[var(--color-muted)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[13px] text-[var(--color-ink)]">AURA Inspection Console</span>
                <span className="text-[var(--color-rule)]">/</span>
                <span>Empirical ground truth & verification</span>
              </div>
              <p className="max-w-md text-[11.5px] leading-relaxed text-[var(--color-muted)]">
                Local Qwen-VL multimodal model paired with deterministic pixel engine contrast, edge, and colorimetric analysis.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5 text-[11.5px]">
              <div className="flex items-center gap-3">
                <Link href="/methodology" className="hover:text-[var(--color-ink)] transition">
                  Limitations statement
                </Link>
                <span className="text-[var(--color-rule)]">/</span>
                <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  <span>Precision benchmark passed</span>
                </span>
                <span className="text-[var(--color-rule)]">/</span>
                <span className="text-[var(--color-ink)]">WCAG 2.2</span>
              </div>
              <span className="text-[var(--color-muted)]">Strict human verification loop · No silent guessing</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
