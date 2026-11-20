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
        bbox: { x: 3, y: 17, w: 80, h: 14 },
        explanation: "Faint amber text on slate ground yields a 2.4:1 contrast ratio (4.5:1 minimum required).",
        metric: "2.4:1 ratio",
      },
      {
        id: "r2",
        label: "Color-only room legend",
        wcag: "1.4.1 Use of color",
        severity: "major",
        confidence: 0.91,
        bbox: { x: 3, y: 76, w: 58, h: 21 },
        explanation: "Auditorium tracks differentiated solely by red and green dots without text labels or icons.",
        metric: "0.88 hue census",
      },
      {
        id: "r3",
        label: "Dense multi-column info cards",
        wcag: "1.4.12 Text spacing",
        severity: "minor",
        confidence: 0.84,
        bbox: { x: 3, y: 37, w: 94, h: 32 },
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
        bbox: { x: 3, y: 75, w: 65, h: 22 },
        explanation: "Terms agreement checkbox hit area is only 24×24 px. Mobile requires a minimum 44×44 px hit bounds.",
        metric: "24 px target",
      },
      {
        id: "r5",
        label: "Placeholder used as label",
        wcag: "3.3.2 Labels or instructions",
        severity: "major",
        confidence: 0.89,
        bbox: { x: 3, y: 37, w: 94, h: 32 },
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
  const [coords, setCoords] = useState({ x: 42.8, y: 24.1 });

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
    }, 4200);
    return () => clearInterval(timer);
  }, [artifact]);

  return (
    <div className="surface-card overflow-hidden">
      {/* Top command viewfinder bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-paper-rule)] bg-[var(--color-paper-warm)] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]" />
          </span>
          <span className="font-semibold text-[var(--color-ink)]">
            Live survey viewport
          </span>
          <span className="text-[var(--color-paper-rule)]">/</span>
          <span className="font-mono text-[var(--color-pencil)]">{artifact.resolution}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {DEMO_ARTIFACTS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveArtifactIdx(idx);
                setSelectedRegionId(item.regions[0].id);
              }}
              className={`px-2.5 py-1 text-xs rounded transition border ${
                activeArtifactIdx === idx
                  ? "bg-[var(--color-paper-card)] text-[var(--color-ink)] border-[var(--color-ink)] font-semibold shadow-xs"
                  : "bg-[var(--color-paper)] text-[var(--color-pencil)] border-[var(--color-paper-rule)] hover:text-[var(--color-ink)]"
              }`}
            >
              {item.title}
            </button>
          ))}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle highlight layer"
            className={`p-1 rounded border transition ${
              showOverlays
                ? "border-[var(--color-ink)] bg-[var(--color-paper-card)] text-[var(--color-ink)]"
                : "border-[var(--color-paper-rule)] text-[var(--color-pencil)] hover:text-[var(--color-ink)]"
            }`}
          >
            <Layers size={13} />
          </button>
        </div>
      </div>

      {/* Main interactive inspection canvas */}
      <div
        className="relative h-[320px] sm:h-[350px] w-full overflow-hidden bg-[var(--color-paper-warm)] p-4 select-none cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCoords({
            x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
          });
        }}
      >
        {/* Drafting grid underlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(43,39,35,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(43,39,35,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Poster / UI mock canvas rendered as an ivory working sheet */}
        <div className="relative h-full w-full rounded border border-[var(--color-paper-rule)] bg-[var(--color-paper-card)] p-5 overflow-hidden flex flex-col justify-between shadow-xs">
          {/* Header element on canvas */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-[var(--color-pencil)] mb-2 font-mono">
              <span>College of Informatics · Audit sheet</span>
              <span className="rounded bg-[var(--color-paper-warm)] px-1.5 py-0.5 border border-[var(--color-paper-rule)]">Sheet #4092</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)] max-w-sm">
              Annual research colloquium
            </h2>
            <p className="text-xs text-[var(--color-pencil)] mt-1 max-w-xs">
              Join leading machine learning & human-computer interaction researchers.
            </p>
          </div>

          {/* Middle copy & metric cards */}
          <div className="grid grid-cols-3 gap-2 my-auto">
            <div className="rounded border border-[var(--color-paper-rule)] bg-[var(--color-paper)] p-2.5">
              <p className="text-[10px] text-[var(--color-pencil)]">Keynote speakers</p>
              <p className="text-xs font-semibold text-[var(--color-ink)] mt-0.5">12 faculty leads</p>
            </div>
            <div className="rounded border border-[var(--color-paper-rule)] bg-[var(--color-paper)] p-2.5">
              <p className="text-[10px] text-[var(--color-pencil)]">Poster sessions</p>
              <p className="text-xs font-semibold text-[var(--color-ink)] mt-0.5">48 interactive</p>
            </div>
            <div className="rounded border border-[var(--color-paper-rule)] bg-[var(--color-paper)] p-2.5">
              <p className="text-[10px] text-[var(--color-pencil)]">Registration</p>
              <p className="text-xs font-semibold text-[#2b8a3e] mt-0.5">Open · free</p>
            </div>
          </div>

          {/* Bottom legend block */}
          <div className="flex items-center justify-between border-t border-[var(--color-paper-rule)] pt-3 text-[11px] text-[var(--color-pencil)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c92a2a]" /> Track 1 (AI)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#2b8a3e]" /> Track 2 (Robotics)
              </span>
            </div>
            <span className="font-mono text-[10px]">Room 402 · 09:00–18:00</span>
          </div>

          {/* Hairline calibration sweep */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[var(--color-accent)]/0 via-[var(--color-accent)]/10 to-[var(--color-accent)]/20 border-b border-[var(--color-accent)]" />
          )}

          {/* Highlight Boundary Windows */}
          {showOverlays &&
            artifact.regions.map((reg) => {
              const isSelected = selectedRegionId === reg.id;
              const colorCls =
                reg.severity === "critical"
                  ? "border-[#c92a2a] bg-[#c92a2a]/10 text-[#c92a2a]"
                  : reg.severity === "major"
                  ? "border-[#d97706] bg-[#d97706]/10 text-[#7a3e00]"
                  : "border-[#2b8a3e] bg-[#2b8a3e]/10 text-[#1b5e20]";

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
                  className={`absolute rounded transition-all cursor-pointer border ${colorCls} ${
                    isSelected
                      ? "ring-2 ring-[var(--color-ink)] shadow-sm"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* Top identification label */}
                  <div className="absolute -top-5 left-0 flex items-center gap-1.5 whitespace-nowrap rounded bg-[var(--color-paper-card)] border border-[var(--color-paper-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink)] shadow-xs">
                    <span>{reg.wcag.split(" ")[0]}</span>
                    <span className="text-[var(--color-paper-rule)]">|</span>
                    <span>{Math.round(reg.confidence * 100)}% conf</span>
                  </div>
                </div>
              );
            })}

          {/* Real-time coordinates HUD readout */}
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1.5 rounded bg-[var(--color-paper-card)] border border-[var(--color-paper-rule)] px-2 py-1 font-mono text-[10px] text-[var(--color-pencil)] shadow-xs">
            <Crosshair size={10} className="text-[var(--color-accent)]" />
            <span>X:{coords.x}% Y:{coords.y}%</span>
          </div>
        </div>
      </div>

      {/* Grounded finding inspection drawer */}
      <div className="border-t border-[var(--color-paper-rule)] bg-[var(--color-paper-card)] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded border font-mono text-xs font-bold ${
              activeRegion.severity === "critical"
                ? "border-[#c92a2a]/40 bg-[#c92a2a]/10 text-[#c92a2a]"
                : "border-[#d97706]/40 bg-[#d97706]/10 text-[#7a3e00]"
            }`}
          >
            !
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {activeRegion.label}
              </span>
              <span className="rounded bg-[var(--color-paper-warm)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-pencil)] border border-[var(--color-paper-rule)]">
                WCAG {activeRegion.wcag}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-ink)] font-medium">
                {activeRegion.metric}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-pencil)] line-clamp-1">
              {activeRegion.explanation}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="btn btn--sm flex items-center gap-1.5"
          >
            <Activity size={12} className={isScanning ? "text-[var(--color-accent)]" : "text-[var(--color-pencil)]"} />
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
