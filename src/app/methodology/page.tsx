import Link from "next/link";
import {
  ArrowLeft,
  Crosshair,
  Cpu,
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
    <main className="mx-auto max-w-4xl px-6 py-12 text-[var(--color-ink)]">
      {/* Return link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition font-mono"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Return to audit console
      </Link>

      {/* Header */}
      <header className="border-b border-[var(--color-rule)] pb-8 mb-10">
        <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-muted)] font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          <span className="uppercase tracking-wider text-[11px]">Academic deliverable & specification</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-[var(--color-ink)] sm:text-4xl font-heading">
          System methodology & limitations statement
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)] leading-relaxed max-w-2xl">
          Complete formal documentation on visual-language model grounding, deterministic pixel
          heuristics, inter-rater severity agreement, and deliberate operational boundaries.
        </p>

        {/* Dataset Export Strip */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs text-[var(--color-muted)] font-mono">Download labelled ground-truth:</span>
          <a
            href="/api/export?format=csv"
            download
            className="btn btn--sm inline-flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <Download className="h-3.5 w-3.5" />
            Benchmark CSV
          </a>
          <a
            href="/api/export?format=json"
            download
            className="btn btn--sm inline-flex items-center gap-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <FileText className="h-3.5 w-3.5" />
            Benchmark JSON
          </a>
        </div>
      </header>

      {/* Section 1: Architecture Overview */}
      <section className="mb-12">
        <h2 className="text-lg font-light tracking-tight text-[var(--color-ink)] mb-4 flex items-center gap-2 font-heading">
          <Cpu className="h-4 w-4 text-[var(--color-muted)]" />
          1. Dual-engine pipeline architecture
        </h2>
        <div className="surface-card p-5 space-y-3 text-sm text-[var(--color-muted)] leading-relaxed">
          <p className="text-[var(--color-ink)]">
            The auditor employs a tiered architecture combining deep Vision-Language Models (VLMs)
            with deterministic low-level computer vision algorithms:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs">
            <li>
              <strong className="text-[var(--color-ink)] font-normal">Primary engine (Qwen2.5-VL):</strong> Evaluates
              high-level visual semantics, layout hierarchy, color-only encoding (e.g. red/green
              status dots), and typographic clutter. Outputs normalized bounding boxes and
              calibrated self-confidence.
            </li>
            <li>
              <strong className="text-[var(--color-ink)] font-normal">Deterministic fallback (Sharp pixel engine):</strong>{" "}
              Computes luminance histograms, Sobel edge densities, colorfulness metrics, and 10th/90th
              percentile tonal distributions to verify contrast ratios against WCAG 1.4.3 without
              model hallucinations.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Evaluation Metrics & Formulas */}
      <section className="mb-12">
        <h2 className="text-lg font-light tracking-tight text-[var(--color-ink)] mb-4 flex items-center gap-2 font-heading">
          <Crosshair className="h-4 w-4 text-[var(--color-accent)]" />
          2. Evaluation metrics & scientific formulations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-card p-4 border-l-2 border-l-[var(--color-accent)]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-accent)]">
              Precision (True positive rate)
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Formula: TP / (TP + FP)</p>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Fraction of model-flagged accessibility defects that were confirmed by qualified
              human reviewers during adjudication.
            </p>
          </div>

          <div className="surface-card p-4 border-l-2 border-l-[var(--color-ink)]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)]">
              Recall (Ground-truth coverage)
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Formula: TP / (TP + FN)</p>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Fraction of all genuine accessibility defects detected. False negatives (FN) are
              recorded whenever a reviewer manually logs a missed defect.
            </p>
          </div>

          <div className="surface-card p-4 border-l-2 border-l-[var(--color-vermilion)]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-vermilion)]">
              False-positive rate (False alarm)
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Formula: FP / (TP + FP)</p>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Proportion of model claims rejected as non-issues or spurious detections. Minimized by
              strict confidence thresholding.
            </p>
          </div>

          <div className="surface-card p-4 border-l-2 border-l-[var(--color-sienna)]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-sienna)]">
              Severity agreement
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">Formula: Agreed / Total confirmed</p>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Inter-rater agreement tracking whether model severity classifications (Critical,
              Major, Minor) align with human adjudications in a 3×3 drift matrix.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Formal Limitations Statement */}
      <section className="mb-12">
        <h2 className="text-lg font-light tracking-tight text-[var(--color-ink)] mb-4 flex items-center gap-2 font-heading">
          <AlertTriangle className="h-4 w-4 text-[var(--color-vermilion)]" />
          3. Formal statement of limitations
        </h2>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h3 className="text-xs font-medium text-[var(--color-ink)] flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--color-muted)]">3.1</span> Visual-only modality boundary
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              This system operates exclusively on static 2D images (JPEG, PNG, WebP) and rendered
              visual viewports. It does not inspect underlying DOM accessibility trees, ARIA
              landmark attributes, screen reader voiceover announcement sequences, or physical
              keyboard focus order (WCAG 2.1.1).
            </p>
          </div>

          <div className="surface-card p-5">
            <h3 className="text-xs font-medium text-[var(--color-ink)] flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--color-muted)]">3.2</span> Resolution & micro-typography hallucination
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              When text size drops below 10–12 CSS pixels or is subjected to extreme perspective
              warp in campus photos, VLMs may attempt semantic completion rather than precise optical
              glyph recognition. For small legal disclaimers, reviewers should confirm contrast
              manually with a spot colorimeter.
            </p>
          </div>

          <div className="surface-card p-5">
            <h3 className="text-xs font-medium text-[var(--color-ink)] flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--color-muted)]">3.3</span> Touch target size approximations
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              WCAG 2.5.8 requires interactive targets to have hit areas of at least 24×24 CSS
              pixels. Because visual screenshots lack touch-delegate hitbox coordinates, the auditor
              approximates target dimensions from visual boundary reticles alone.
            </p>
          </div>

          <div className="surface-card p-5">
            <h3 className="text-xs font-medium text-[var(--color-ink)] flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--color-muted)]">3.4</span> Color space & environmental assumptions
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Contrast calculations assume standard sRGB color primaries viewed in neutral diffuse
              lighting. Real-world outdoor posters under direct sunlight or mobile devices operating
              under auto-dimming night-shift filters will experience different actual contrast.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Human-in-the-Loop Adjudication Protocol */}
      <section className="mb-12">
        <h2 className="text-lg font-light tracking-tight text-[var(--color-ink)] mb-4 flex items-center gap-2 font-heading">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
          4. Human-in-the-loop adjudication protocol
        </h2>
        <div className="surface-card p-5 text-xs text-[var(--color-muted)] leading-relaxed space-y-3">
          <p className="text-[var(--color-ink)]">
            No automated AI model should unilaterally declare compliance. The AURA Console
            (Accessibility Understanding and Remediation Assistant) enforces an adjudication loop where:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 font-mono text-[11px]">
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