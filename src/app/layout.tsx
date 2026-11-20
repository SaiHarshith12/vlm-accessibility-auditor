import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ScanEye, ShieldCheck, Activity } from "@/components/icons";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Accessibility Understanding and Remediation Assistant",
  description:
    "AURA: Accessibility Understanding and Remediation Assistant. Scientific accessibility verification for campus posters and UI artifacts with local vision-language models, grounded human adjudication, and empirical false-positive control.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] antialiased font-sans">
        {/* Top telemetry bar */}
        <div className="border-b border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[11px] font-mono text-[var(--color-muted)] px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[var(--color-accent-ink)] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span>STATION: LOCAL-01</span>
            </span>
            <span className="text-[var(--color-rule)]">|</span>
            <span className="hidden sm:inline text-[var(--color-ink)]">ACTIVE ENGINE: QWEN2.5-VL · MULTIMODAL VLM</span>
            <span className="text-[var(--color-rule)] hidden md:inline">|</span>
            <span className="hidden md:inline">WCAG 2.2 AA/AAA BENCHMARK</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[var(--color-green)] font-semibold">
              <ShieldCheck size={12} />
              <span>OFFLINE SAFE · AIRGAPPED</span>
            </span>
            <span className="tabular hidden md:inline text-[var(--color-muted)]">
              BUILD 2026.11
            </span>
          </div>
        </div>

        {/* Main navigation header */}
        <header className="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)]/95 backdrop-blur-md transition-all">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-sm">
                <ScanEye size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[17px] font-bold tracking-tight text-[var(--color-ink)]">
                    AURA
                  </span>
                  <span className="rounded-[4px] bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-1.5 py-0.2 text-[9.5px] font-mono font-medium text-[var(--color-muted)]">
                    AUDITOR
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-muted)] font-medium leading-none">
                  Accessibility Understanding and Remediation Assistant
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition"
              >
                <Activity size={13} className="text-[var(--color-accent-ink)]" />
                <span>Console</span>
              </Link>
              <Link
                href="/#queue"
                className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition"
              >
                Inspection queue
              </Link>
              <Link
                href="/#metrics"
                className="rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition"
              >
                Calibration ledger
              </Link>
              <Link
                href="/methodology"
                className="hidden sm:inline-flex rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition"
              >
                Methodology
              </Link>
              <div className="ml-2 hidden h-4 w-px bg-[var(--color-rule)] md:block" />
              <a
                href="#upload"
                className="btn btn--primary text-[12px] h-9 px-3.5"
              >
                + Ingest new artifact
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* Console footer */}
        <footer className="border-t border-[var(--color-ink)] bg-[var(--color-paper-2)] mt-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between text-[12px] text-[var(--color-muted)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-[var(--color-ink)] text-[13px]">AURA Inspection Console</span>
                <span className="text-[var(--color-rule)]">/</span>
                <span>Empirical ground truth & verification</span>
              </div>
              <p className="max-w-md text-[11.5px] leading-relaxed text-[var(--color-muted)]">
                Local Qwen-VL multimodal model paired with deterministic pixel engine contrast, edge, and colorimetric analysis.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-3">
                <Link href="/methodology" className="hover:underline text-[var(--color-ink)] font-medium">
                  Limitations Statement
                </Link>
                <span className="text-[var(--color-rule)]">·</span>
                <span className="flex items-center gap-1 text-[var(--color-green)] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
                  PRECISION BENCHMARK: PASS
                </span>
                <span className="text-[var(--color-rule)]">·</span>
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
