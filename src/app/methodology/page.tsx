import Link from "next/link";
import {
  ArrowLeft,
  Crosshair,
  ShieldAlert,
  Radius,
  Cpu,
  Clock,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "@/components/icons";

export const metadata = {
  title: "Methodology & Limitations Statement — AURA Console",
  description:
    "Scientific methodology, evaluation formulas, ground-truthing protocols, and formal limitations statement for AURA: Accessibility Understanding and Remediation Assistant.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-slate-200 selection:bg-amber-500/30">
      {/* Return link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-amber-500 hover:text-amber-400 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        RETURN TO AUDIT CONSOLE
      </Link>

      {/* Header */}
      <header className="border-b border-slate-800 pb-8 mb-10">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-amber-500">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>ACADEMIC DELIVERABLE & SPECIFICATION</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          System Methodology & Limitations Statement
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
          Complete formal documentation on visual-language model grounding, deterministic pixel
          heuristics, inter-rater severity agreement, and deliberate operational boundaries.
        </p>

        {/* Dataset Export Pill Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-slate-400">Download Labelled Ground-Truth:</span>
          <a
            href="/api/export?format=csv"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400 transition"
          >
            <Download className="h-3.5 w-3.5" />
            BENCHMARK CSV
          </a>
          <a
            href="/api/export?format=json"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400 transition"
          >
            <FileText className="h-3.5 w-3.5" />
            BENCHMARK JSON
          </a>
        </div>
      </header>

      {/* Section 1: Architecture Overview */}
      <section className="mb-12">
        <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-amber-500" />
          1. Dual-Engine Pipeline Architecture
        </h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            The auditor employs a tiered architecture combining deep Vision-Language Models (VLMs)
            with deterministic low-level computer vision algorithms:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300 font-mono">
            <li>
              <strong className="text-white">Primary Engine (Qwen2.5-VL):</strong> Evaluates
              high-level visual semantics, layout hierarchy, color-only encoding (e.g. red/green
              status dots), and typographic clutter. Outputs normalized bounding boxes and
              calibrated self-confidence.
            </li>
            <li>
              <strong className="text-white">Deterministic Fallback (Sharp Pixel Engine):</strong>{" "}
              Computes luminance histograms, Sobel edge densities, colorfulness metrics, and 10th/90th
              percentile tonal distributions to verify contrast ratios against WCAG 1.4.3 without
              model hallucinations.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Evaluation Metrics & Formulas */}
      <section className="mb-12">
        <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-emerald-400" />
          2. Evaluation Metrics & Scientific Formulations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase">
              Precision (True Positive Rate)
            </h3>
            <p className="mt-1 font-mono text-xs text-slate-400">Formula: TP / (TP + FP)</p>
            <p className="mt-2 text-xs text-slate-300">
              Fraction of model-flagged accessibility defects that were confirmed by qualified
              human reviewers during adjudication.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-mono text-xs font-bold text-sky-400 uppercase">
              Recall (Ground-Truth Coverage)
            </h3>
            <p className="mt-1 font-mono text-xs text-slate-400">Formula: TP / (TP + FN)</p>
            <p className="mt-2 text-xs text-slate-300">
              Fraction of all genuine accessibility defects detected. False negatives (FN) are
              recorded whenever a reviewer manually logs a missed defect.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-mono text-xs font-bold text-rose-400 uppercase">
              False-Positive Rate (False Alarm)
            </h3>
            <p className="mt-1 font-mono text-xs text-slate-400">Formula: FP / (TP + FP)</p>
            <p className="mt-2 text-xs text-slate-300">
              Proportion of model claims rejected as non-issues or spurious detections. Minimized by
              strict confidence thresholding.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="font-mono text-xs font-bold text-amber-400 uppercase">
              Severity Agreement
            </h3>
            <p className="mt-1 font-mono text-xs text-slate-400">Formula: Agreed / Total Confirmed</p>
            <p className="mt-2 text-xs text-slate-300">
              Inter-rater agreement tracking whether model severity classifications (Critical,
              Major, Minor) align with human adjudications in a 3×3 drift matrix.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Formal Limitations Statement */}
      <section className="mb-12">
        <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          3. Formal Statement of Limitations
        </h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <span className="text-amber-500">3.1</span> Visual-Only Modality Boundary
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              This system operates exclusively on static 2D images (JPEG, PNG, WebP) and rendered
              visual viewports. It does not inspect underlying DOM accessibility trees, ARIA
              landmark attributes, screen reader voiceover announcement sequences, or physical
              keyboard focus order (WCAG 2.1.1).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <span className="text-amber-500">3.2</span> Resolution & Micro-Typography Hallucination
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              When text size drops below 10–12 CSS pixels or is subjected to extreme perspective
              warp in campus photos, VLMs may attempt semantic completion rather than precise optical
              glyph recognition. For small legal disclaimers, reviewers should confirm contrast
              manually with a spot colorimeter.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <span className="text-amber-500">3.3</span> Touch Target Size Approximations
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              WCAG 2.5.8 requires interactive targets to have hit areas of at least 24×24 CSS
              pixels. Because visual screenshots lack touch-delegate hitbox coordinates, the auditor
              approximates target dimensions from visual boundary reticles alone.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
              <span className="text-amber-500">3.4</span> Color Space & Environmental Assumptions
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Contrast calculations assume standard sRGB color primaries viewed in neutral diffuse
              lighting. Real-world outdoor posters under direct sunlight or mobile devices operating
              under auto-dimming night-shift filters will experience different actual contrast.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Human-in-the-Loop Adjudication Protocol */}
      <section className="mb-12">
        <h2 className="text-xl font-bold font-mono text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          4. Human-in-the-Loop Adjudication Protocol
        </h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-300 leading-relaxed space-y-3">
          <p>
            No automated AI model should unilaterally declare compliance. The AURA Console
            (Accessibility Understanding and Remediation Assistant) enforces an adjudication loop where:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 font-mono">
            <li>Reviewers adjudicate candidate findings as Confirmed (TP) or Rejected (FP).</li>
            <li>Reviewers rate suggestion usefulness to optimize remediation advice.</li>
            <li>Reviewers can log un-flagged issues to keep recall calculations honest.</li>
            <li>The system records individual reviewer identities and timestamps for reproducibility.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
