"use client";

import { useState, useEffect } from "react";
import {
  Crosshair,
  Layers,
  Sparkles,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Activity,
  Zap,
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
  kind: "Poster" | "UI Screen";
  resolution: string;
  regions: DefectRegion[];
}[] = [
  {
    id: "poster-orientation",
    title: "Campus Engineering Fair '26",
    kind: "Poster",
    resolution: "1920 × 1080",
    regions: [
      {
        id: "r1",
        label: "Low Contrast Sub-Headline",
        wcag: "1.4.3 Contrast (Min)",
        severity: "critical",
        confidence: 0.96,
        bbox: { x: 8, y: 18, w: 56, h: 14 },
        explanation: "Faint amber text on slate background yields 2.4:1 contrast ratio (minimum required is 4.5:1).",
        metric: "2.4:1 vs 4.5:1",
      },
      {
        id: "r2",
        label: "Color-Only Room Legend",
        wcag: "1.4.1 Use of Color",
        severity: "major",
        confidence: 0.91,
        bbox: { x: 8, y: 68, w: 42, h: 18 },
        explanation: "Auditorium tracks differentiated solely by red and green dots without text labels or icons.",
        metric: "Hue census 0.88",
      },
      {
        id: "r3",
        label: "Dense All-Caps Body Copy",
        wcag: "1.4.12 Text Spacing",
        severity: "minor",
        confidence: 0.84,
        bbox: { x: 58, y: 46, w: 36, h: 36 },
        explanation: "Condensed sans-serif uppercase copy at 9pt lacks required line-height and paragraph spacing.",
        metric: "Leading 1.05",
      },
    ],
  },
  {
    id: "ui-checkout",
    title: "Mobile Tuition Portal",
    kind: "UI Screen",
    resolution: "1170 × 2532",
    regions: [
      {
        id: "r4",
        label: "Undersized Checkbox Target",
        wcag: "2.5.5 Target Size",
        severity: "critical",
        confidence: 0.98,
        bbox: { x: 12, y: 62, w: 28, h: 12 },
        explanation: "Terms agreement checkbox hit area is only 26×26px. Mobile requires minimum 44×44px hit bounds.",
        metric: "26px < 44px min",
      },
      {
        id: "r5",
        label: "Placeholder Used as Label",
        wcag: "3.3.2 Labels or Instructions",
        severity: "major",
        confidence: 0.89,
        bbox: { x: 12, y: 32, w: 76, h: 15 },
        explanation: "Account number input relies solely on placeholder text which disappears on typing.",
        metric: "No <label> tag",
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

  // Auto-cycle through regions for live demonstration
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
    <div className="relative rounded-2xl border border-hairline bg-surface-0/90 p-1 shadow-2xl backdrop-blur-xl">
      {/* Top command viewfinder bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline/80 bg-surface-1/90 px-4 py-2.5 rounded-t-xl text-[11px] font-mono">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <span className="text-white font-semibold tracking-wide">
            LIVE TELEMETRY VIEWPORT
          </span>
          <span className="text-hairline">/</span>
          <span className="text-brand-light font-medium">{artifact.resolution}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {DEMO_ARTIFACTS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveArtifactIdx(idx);
                setSelectedRegionId(item.regions[0].id);
              }}
              className={`px-2.5 py-1 rounded text-[10.5px] transition ${
                activeArtifactIdx === idx
                  ? "bg-brand/20 text-brand-bright border border-brand/40 shadow-[0_0_10px_-2px_rgba(245,158,11,0.4)]"
                  : "bg-surface-2/60 text-inkdim hover:text-white border border-transparent"
              }`}
            >
              {item.title}
            </button>
          ))}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle bounding box layer"
            className={`p-1 rounded border transition ${
              showOverlays
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-hairline text-inkdim hover:text-white"
            }`}
          >
            <Layers size={13} />
          </button>
        </div>
      </div>

      {/* Main interactive inspection canvas */}
      <div
        className="relative h-[320px] sm:h-[350px] w-full overflow-hidden bg-ink-950 p-4 select-none cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setCoords({
            x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
          });
        }}
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />

        {/* Realistic poster/UI mock canvas rendered natively */}
        <div className="relative h-full w-full rounded-lg border border-hairline/60 bg-gradient-to-br from-surface-1 to-surface-0 p-5 overflow-hidden flex flex-col justify-between">
          {/* Header element on canvas */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-inkdim mb-2">
              <span className="tracking-widest">COLLEGE OF INFORMATICS · AUDIT DECK</span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 border border-hairline">POSTER-ID #4092</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white/95 max-w-sm">
              ANNUAL RESEARCH COLLOQUIUM 2026
            </h2>
            <p className="text-xs text-amber-200/50 mt-1 max-w-xs font-medium">
              Join leading machine learning & human-computer interaction researchers.
            </p>
          </div>

          {/* Middle copy & metric cards */}
          <div className="grid grid-cols-3 gap-2 my-auto">
            <div className="rounded border border-hairline/70 bg-white/[0.02] p-2.5">
              <p className="text-[9px] font-mono text-inkdim">KEYNOTE SPEAKERS</p>
              <p className="text-xs font-semibold text-white mt-1">12 Faculty Leads</p>
            </div>
            <div className="rounded border border-hairline/70 bg-white/[0.02] p-2.5">
              <p className="text-[9px] font-mono text-inkdim">POSTER SESSIONS</p>
              <p className="text-xs font-semibold text-white mt-1">48 Interactive</p>
            </div>
            <div className="rounded border border-hairline/70 bg-white/[0.02] p-2.5">
              <p className="text-[9px] font-mono text-inkdim">REGISTRATION</p>
              <p className="text-xs font-semibold text-brand mt-1">Open · Free Admission</p>
            </div>
          </div>

          {/* Bottom legend block */}
          <div className="flex items-center justify-between border-t border-hairline/50 pt-3">
            <div className="flex items-center gap-3 text-[10px] text-inkdim font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Track 1 (AI)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Track 2 (Robotics)
              </span>
            </div>
            <span className="text-[9px] font-mono text-brand/80">ROOM 402 · 09:00 - 18:00</span>
          </div>

          {/* Dynamic Laser Beam Scanner */}
          {isScanning && (
            <div className="scanner-beam pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-brand/0 via-brand/15 to-brand/35 border-b-2 border-brand shadow-[0_0_20px_2px_rgba(245,158,11,0.6)]" />
          )}

          {/* Bounding Box Overlays */}
          {showOverlays &&
            artifact.regions.map((reg) => {
              const isSelected = selectedRegionId === reg.id;
              const colorCls =
                reg.severity === "critical"
                  ? "border-rose-500/80 bg-rose-500/10 text-rose-300"
                  : reg.severity === "major"
                  ? "border-amber-400/90 bg-amber-400/15 text-amber-200"
                  : "border-cyan-400/80 bg-cyan-400/10 text-cyan-200";

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
                  className={`absolute rounded transition-all cursor-pointer border-2 ${colorCls} ${
                    isSelected
                      ? "ring-4 ring-brand/30 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.01]"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Tactical Reticle Corner markers */}
                  <div className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-inherit" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 border-inherit" />
                  <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-inherit" />
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-inherit" />

                  {/* Top identification label */}
                  <div className="absolute -top-6 left-0 flex items-center gap-1.5 whitespace-nowrap rounded bg-ink-950/95 border border-inherit px-2 py-0.5 text-[9.5px] font-mono font-bold shadow-lg">
                    <span>{reg.wcag.split(" ")[0]}</span>
                    <span className="opacity-60">|</span>
                    <span>{Math.round(reg.confidence * 100)}% CONF</span>
                  </div>

                  {/* Pulsing focal radar target */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-6 w-6 rounded-full border border-brand/60 animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}

          {/* Real-time coordinates HUD readout */}
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-2 rounded bg-ink-950/80 border border-hairline/80 px-2 py-1 font-mono text-[9px] text-inkdim">
            <Crosshair size={10} className="text-brand" />
            <span>X:{coords.x}% Y:{coords.y}%</span>
          </div>
        </div>
      </div>

      {/* Grounded finding inspection drawer */}
      <div className="border-t border-hairline bg-surface-1/95 p-3.5 rounded-b-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-[11px] font-bold ${
              activeRegion.severity === "critical"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300"
            }`}
          >
            !
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-semibold text-white tracking-tight">
                {activeRegion.label}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9.5px] text-brand-light border border-brand/30">
                WCAG {activeRegion.wcag}
              </span>
              <span className="font-mono text-[10px] text-emerald-400">
                {activeRegion.metric}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-inktext/80 line-clamp-1">
              {activeRegion.explanation}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="flex items-center gap-1 rounded-md border border-hairline bg-surface-2/80 px-2.5 py-1.5 text-[11px] font-mono text-inkdim hover:text-white transition"
          >
            <Activity size={12} className={isScanning ? "text-brand animate-spin" : ""} />
            <span>{isScanning ? "Scanner Active" : "Scanner Paused"}</span>
          </button>
          <a
            href="#queue"
            className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-[11px] font-mono font-bold text-ink-950 hover:bg-brand-light transition shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]"
          >
            <CheckCircle2 size={12} />
            <span>Adjudicate</span>
          </a>
        </div>
      </div>
    </div>
  );
}
