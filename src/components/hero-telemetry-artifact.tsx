"use client";

import { useState, useEffect } from "react";
import {
  Crosshair,
  Layers,
  CheckCircle2,
  Activity,
} from "lucide-react";

interface DefectRegion {
  id: string;
  label: string;
  wcag: string;
  severity: "critical" | "major" | "minor";
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  explanation: string;
  metric: string;
}

const DEMO_ARTIFACTS: {
  id: string;
  title: string;
  kind: "Poster" | "UI screen";
  resolution: string;
  regions: DefectRegion[];
}[] = [
  {
    id: "poster-orientation",
    title: "Campus engineering fair",
    kind: "Poster",
    resolution: "1920 × 1080 px",
    regions: [
      {
        id: "r1",
        label: "Low contrast sub-headline",
        wcag: "1.4.3 Contrast (min)",
        severity: "critical",
        confidence: 0.96,
        bbox: { x: 4, y: 18, w: 82, h: 14 },
        explanation: "Faint amber text on slate ground yields a 2.4:1 contrast ratio (4.5:1 minimum required).",
        metric: "2.4:1 ratio",
      },
      {
        id: "r2",
        label: "Color-only room legend",
        wcag: "1.4.1 Use of color",
        severity: "major",
        confidence: 0.91,
        bbox: { x: 4, y: 76, w: 58, h: 20 },
        explanation: "Auditorium tracks differentiated solely by red and green dots without text labels or icons.",
        metric: "0.88 hue census",
      },
      {
        id: "r3",
        label: "Dense multi-column info cards",
        wcag: "1.4.12 Text spacing",
        severity: "minor",
        confidence: 0.84,
        bbox: { x: 4, y: 38, w: 92, h: 32 },
        explanation: "Condensed small type cards lack required line-height and paragraph spacing for distant viewing.",
        metric: "1.05 leading",
      },
    ],
  },
  {
    id: "ui-checkout",
    title: "Mobile tuition portal",
    kind: "UI screen",
    resolution: "1170 × 2532 px",
    regions: [
      {
        id: "r4",
        label: "Undersized checkbox hit target",
        wcag: "2.5.5 Target size",
        severity: "critical",
        confidence: 0.98,
        bbox: { x: 4, y: 75, w: 65, h: 22 },
        explanation: "Terms agreement checkbox hit area is only 24×24 px. Mobile requires a minimum 44×44 px hit bounds.",
        metric: "24 px target",
      },
      {
        id: "r5",
        label: "Placeholder used as label",
        wcag: "3.3.2 Labels or instructions",
        severity: "major",
        confidence: 0.89,
        bbox: { x: 4, y: 38, w: 92, h: 32 },
        explanation: "Account number input relies solely on placeholder text which disappears on typing.",
        metric: "Missing label",
      },
    ],
  },
];

export function HeroTelemetryArtifact() {
  const [activeArtifactIdx, setActiveArtifactIdx] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("r1");
  const [isScanning, setIsScanning] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [coords, setCoords] = useState({ x: 65.4, y: 12.8 });

  const artifact = DEMO_ARTIFACTS[activeArtifactIdx];
  const activeRegion =
    artifact.regions.find((r) => r.id === selectedRegionId) || artifact.regions[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedRegionId((prev) => {
        const idx = artifact.regions.findIndex((r) => r.id === prev);
        const nextIdx = (idx + 1) % artifact.regions.length;
        return artifact.regions[nextIdx].id;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [artifact]);

  return (
    <div className="surface-card overflow-hidden ticks">
      {/* Top command viewfinder bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]" />
          </span>
          <span className="text-[var(--color-ink)] font-mono text-[11px] uppercase tracking-wider">
            Live survey viewport
          </span>
          <span className="text-[var(--color-rule)]">/</span>
          <span className="num font-mono text-[var(--color-muted)]">{artifact.resolution}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {DEMO_ARTIFACTS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveArtifactIdx(idx);
                setSelectedRegionId(item.regions[0].id);
              }}
              className={`px-3 py-1 text-xs rounded-full transition border font-mono ${
                activeArtifactIdx === idx
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-[var(--color-accent)] font-medium"
                  : "bg-[var(--color-paper)] text-[var(--color-muted)] border-[var(--color-rule)] hover:text-[var(--color-ink)]"
              }`}
            >
              {item.title}
            </button>
          ))}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle highlight layer"
            className={`p-1.5 rounded-full border transition ${
              showOverlays
                ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-paper-3)]"
                : "border-[var(--color-rule)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Layers size={13} />
          </button>
        </div>
      </div>

      {/* Main interactive inspection canvas */}
      <div
        className="relative h-[320px] sm:h-[350px] w-full overflow-hidden bg-[var(--color-paper)] p-4 select-none cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCoords({
            x: parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(1)),
            y: parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(1)),
          });
        }}
      >
        {/* Subtle survey coordinate grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Poster / UI mock sheet */}
        <div className="relative h-full w-full rounded-[var(--radius-card)] border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] p-5 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mb-2 font-mono">
              <span>College of Informatics · Survey sheet</span>
              <span className="rounded-full bg-[var(--color-paper-3)] px-2 py-0.5 border border-[var(--color-rule)] text-[var(--color-ink)]">
                Sheet #4092
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[var(--color-ink)] max-w-sm font-display">
              Annual research colloquium
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-xs font-normal">
              Join leading machine learning & human-computer interaction researchers.
            </p>
          </div>

          {/* Middle copy & metric cards */}
          <div className="grid grid-cols-3 gap-2 my-auto">
            <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2.5">
              <p className="text-[10px] text-[var(--color-muted)] font-mono">Keynote speakers</p>
              <p className="text-xs text-[var(--color-ink)] font-normal mt-0.5">12 faculty leads</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2.5">
              <p className="text-[10px] text-[var(--color-muted)] font-mono">Poster sessions</p>
              <p className="text-xs text-[var(--color-ink)] font-normal mt-0.5">48 interactive</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-3)] p-2.5">
              <p className="text-[10px] text-[var(--color-muted)] font-mono">Registration</p>
              <p className="text-xs text-[var(--color-accent)] font-medium mt-0.5">Open · free</p>
            </div>
          </div>

          {/* Bottom legend block */}
          <div className="flex items-center justify-between border-t border-[var(--color-rule)] pt-3 text-[11px] text-[var(--color-muted)] font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[var(--color-vermilion)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-vermilion)]" /> Track 1 (AI)
              </span>
              <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Track 2 (Robotics)
              </span>
            </div>
            <span className="text-[10px]">Room 402 · 09:00–18:00</span>
          </div>

          {/* Laser sweep animation plane */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent to-[var(--color-accent)]/20 border-b border-[var(--color-accent)] animate-vantage-sweep" />
          )}

          {/* Highlight Boundary Windows */}
          {showOverlays &&
            artifact.regions.map((reg) => {
              const isSelected = selectedRegionId === reg.id;
              const colorCls =
                reg.severity === "critical"
                  ? "border-[var(--color-vermilion)] bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)]"
                  : reg.severity === "major"
                  ? "border-[var(--color-sienna)] bg-[var(--color-sienna)]/15 text-[var(--color-sienna)]"
                  : "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]";

              return (
                <div
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  style={{
                    left: `${reg.bbox.x}%`,
                    top: `${reg.bbox.y}%`,
                    width: `${reg.bbox.w}%`,
                    height: `${reg.bbox.h}%`,
                  }}
                  className={`absolute rounded-[2px] transition-all cursor-pointer border ${colorCls} ${
                    isSelected
                      ? "ring-2 ring-[var(--color-accent)] z-20"
                      : "opacity-80 hover:opacity-100 z-10"
                  }`}
                >
                  {/* Top identification label */}
                  <div className="absolute -top-5 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-ink)]">
                    <span className="text-[var(--color-accent)]">#{reg.id}</span>
                    <span>{reg.wcag.split(" ")[0]}</span>
                    <span className="text-[var(--color-rule)]">/</span>
                    <span className="num tabular">{Math.round(reg.confidence * 100)}%</span>
                  </div>
                </div>
              );
            })}

          {/* Real-time coordinates HUD readout */}
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1.5 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-2)] px-2.5 py-1 font-mono text-[10px] text-[var(--color-muted)]">
            <Crosshair size={11} className="text-[var(--color-accent)]" />
            <span className="text-[var(--color-ink)] font-normal">X:{coords.x}% Y:{coords.y}%</span>
          </div>
        </div>
      </div>

      {/* Grounded finding inspection drawer */}
      <div className="border-t border-[var(--color-rule)] bg-[var(--color-paper-2)] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border font-mono text-xs font-bold ${
              activeRegion.severity === "critical"
                ? "border-[var(--color-vermilion)]/40 bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)]"
                : "border-[var(--color-sienna)]/40 bg-[var(--color-sienna)]/15 text-[var(--color-sienna)]"
            }`}
          >
            !
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-ink)] font-normal">
                {activeRegion.label}
              </span>
              <span className="rounded-full bg-[var(--color-paper-3)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-muted)] border border-[var(--color-rule)]">
                WCAG {activeRegion.wcag}
              </span>
              <span className="num tabular font-mono text-[10px] text-[var(--color-accent)] font-medium">
                {activeRegion.metric}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-muted)] line-clamp-1">
              {activeRegion.explanation}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="btn btn--line btn--sm flex items-center gap-1.5"
          >
            <Activity size={12} className={isScanning ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"} />
            <span>{isScanning ? "Scanner active" : "Scanner paused"}</span>
          </button>
          <a
            href="#queue"
            className="btn btn--primary btn--sm flex items-center gap-1.5"
          >
            <CheckCircle2 size={12} />
            <span>Adjudicate</span>
          </a>
        </div>
      </div>
    </div>
  );
}