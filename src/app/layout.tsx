import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ScanEye, ShieldCheck, Activity } from "@/components/icons";
import "./globals.css";

export const metadata: Metadata = {
  title: "A11yLens — Vision-First Accessibility Auditing Console",
  description:
    "Scientific accessibility verification for campus posters and UI artifacts with local vision-language models, grounded human adjudication, and empirical false-positive control.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-inktext antialiased font-sans selection:bg-brand/25 selection:text-brand-light">
        {/* Top telemetry bar */}
        <div className="border-b border-hairline/80 bg-ink-950/90 text-[11px] font-mono text-inkdim px-6 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              <span>STATION: LOCAL-01</span>
            </span>
            <span className="text-hairline">|</span>
            <span className="hidden sm:inline">WCAG 2.2 AA/AAA BENCHMARK ENGINE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={12} />
              <span>OFFLINE SAFE · AIRGAPPED</span>
            </span>
            <span className="tabular hidden md:inline text-inkdim/70">
              BUILD 2026.11
            </span>
          </div>
        </div>

        {/* Main navigation header */}
        <header className="sticky top-0 z-40 border-b border-hairline bg-ink-900/85 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="group flex items-center gap-3.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-dark/30 ring-1 ring-brand/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] transition group-hover:scale-105 group-hover:ring-brand">
                <ScanEye size={19} className="text-brand-light transition group-hover:rotate-6" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-ink" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[16px] font-bold tracking-tight text-white group-hover:text-brand-light transition">
                    A11yLens
                  </span>
                  <span className="rounded bg-brand/10 border border-brand/25 px-1.5 py-0.2 text-[9px] font-mono font-semibold tracking-wider text-brand-light">
                    PRO-MAX
                  </span>
                </div>
                <span className="text-[10.5px] font-medium tracking-wide text-inkdim/90">
                  Grounded Vision Accessibility Auditor
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[12.5px] font-medium text-inktext/90 transition hover:border-hairline hover:bg-white/[0.04] hover:text-white"
              >
                <Activity size={13} className="text-brand" />
                <span>Console</span>
              </Link>
              <Link
                href="/#queue"
                className="rounded-lg border border-transparent px-3 py-1.5 text-[12.5px] font-medium text-inkdim transition hover:border-hairline hover:bg-white/[0.04] hover:text-white"
              >
                Inspection Queue
              </Link>
              <Link
                href="/#metrics"
                className="rounded-lg border border-transparent px-3 py-1.5 text-[12.5px] font-medium text-inkdim transition hover:border-hairline hover:bg-white/[0.04] hover:text-white"
              >
                Calibration & ROC
              </Link>
              <Link
                href="/#method"
                className="hidden sm:inline-flex rounded-lg border border-transparent px-3 py-1.5 text-[12.5px] font-medium text-inkdim transition hover:border-hairline hover:bg-white/[0.04] hover:text-white"
              >
                Methodology
              </Link>
              <div className="ml-2 hidden h-4 w-px bg-hairline md:block" />
              <a
                href="#upload"
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand via-amber-400 to-amber-500 px-3.5 py-1.5 text-[12px] font-semibold text-ink-950 shadow-[0_0_20px_-4px_rgba(245,158,11,0.5)] transition hover:brightness-110 active:scale-95"
              >
                + New Audit
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* Console footer */}
        <footer className="border-t border-hairline/80 bg-ink-950/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between text-[12px] text-inkdim">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white">A11yLens Console</span>
                <span className="text-hairline">/</span>
                <span>Vision-first accessibility ground-truthing</span>
              </div>
              <p className="text-inkdim/70 max-w-md text-[11px] leading-relaxed">
                Empirical adjudication system pairing local Qwen-VL with pixel-deterministic contrast, edge and colorimetric analysis.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  PRECISION BENCHMARK: PASS
                </span>
                <span className="text-hairline">·</span>
                <span className="text-inktext/80">WCAG 2.2 CRITERIA</span>
              </div>
              <span className="text-inkdim/60">Strict human verification loop · No silent model guessing</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
