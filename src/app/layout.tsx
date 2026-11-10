import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ScanEye } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "A11yLens — Vision-first accessibility auditing",
  description:
    "Assistive accessibility auditing of campus posters and UI screenshots with a local Qwen-VL model, human verification, and quantitative false-positive control.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-transparent text-inktext antialiased">
        <header className="sticky top-0 z-40 border-b border-hairline bg-ink/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
                <ScanEye size={17} strokeWidth={2.2} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                A11yLens
              </span>
              <span className="mt-px hidden text-[10px] font-medium uppercase tracking-[0.2em] text-inkdim sm:inline">
                Campus Accessibility Audit Console
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-[13px] text-inkdim">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/#queue"
                className="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                Audit queue
              </Link>
              <Link
                href="/#method"
                className="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-hairline">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-[12px] text-inkdim sm:flex-row sm:items-center sm:justify-between">
            <p>
              A11yLens — assistive auditing with a local Qwen-VL model, human
              verification, and measured false-positive control.
            </p>
            <p className="tabular">
              WCAG 2.2 · precision / recall evaluation · human-in-the-loop
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
