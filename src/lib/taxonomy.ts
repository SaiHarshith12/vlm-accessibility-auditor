/**
 * Shared, bundle-safe taxonomy for findings — no Node-only imports here, so
 * both server and client components may import from this module.
 */

export const CATEGORIES = [
  "contrast",
  "color",
  "typography",
  "clutter",
  "hierarchy",
  "touch_target",
  "label",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { label: string; blurb: string }> = {
  contrast: { label: "Low contrast", blurb: "Insufficient luminance separation between text and background." },
  color: { label: "Color reliance", blurb: "Meaning carried by hue alone; risky for color-vision deficiency." },
  typography: { label: "Type & legibility", blurb: "Type size, weight or spacing below legibility guidance." },
  clutter: { label: "Visual clutter", blurb: "Excess density raising cognitive load and hiding key content." },
  hierarchy: { label: "Hierarchy", blurb: "Weak information hierarchy makes scanning and ordering hard." },
  touch_target: { label: "Target size", blurb: "Interactive targets likely below the 24px WCAG minimum." },
  label: { label: "Labels / alt text", blurb: "Controls or images that likely lack accessible names or alt text." },
  other: { label: "Other", blurb: "Miscellaneous accessibility concern." },
};

export const SEVERITIES = ["critical", "major", "minor"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type AuditKind = "poster" | "ui_screenshot";
export type AnalyzerId = "qwen-vl" | "heuristic" | "seeded-demo";

export interface CandidateFinding {
  category: Category;
  severity: Severity;
  title: string;
  explanation: string;
  suggestion: string;
  wcag: string | null;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number } | null;
}

export interface ImageStats {
  width: number;
  height: number;
  meanLum: number;
  lumStd: number;
  p10Lum: number;
  p90Lum: number;
  tonalRangeRatio: number;
  colorfulness: number;
  edgeDensity: number;
  bottomEdgeDensity: number;
  darkPixelPct: number;
  brightPixelPct: number;
  redShare: number;
  greenShare: number;
}
