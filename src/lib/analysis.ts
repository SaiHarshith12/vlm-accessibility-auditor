import sharp from "sharp";
import { z } from "zod";
import {
  CATEGORIES,
  SEVERITIES,
  type AnalyzerId,
  type AuditKind,
  type CandidateFinding,
  type Category,
  type ImageStats,
  type Severity,
} from "./taxonomy";

// Re-export the shared taxonomy so server routes can keep importing from here.
export {
  CATEGORIES,
  SEVERITIES,
  CATEGORY_META,
} from "./taxonomy";
export type {
  AuditKind,
  CandidateFinding,
  Category,
  ImageStats,
  Severity,
  AnalyzerId,
} from "./taxonomy";

/* ------------------------------------------------------------------ */
/*  Qwen-VL client (OpenAI-compatible local endpoint)                  */
/* ------------------------------------------------------------------ */

const vlmFinding = z.object({
  category: z.enum(CATEGORIES).catch("other"),
  severity: z.enum(SEVERITIES).catch("major"),
  title: z.string().min(3).max(160),
  explanation: z.string().min(10).max(1200),
  suggestion: z.string().min(10).max(1200),
  wcag: z.string().max(80).nullish().transform((v) => v ?? null),
  confidence: z.coerce.number().min(0).max(1).catch(0.6),
  bbox: z
    .object({
      x: z.coerce.number(),
      y: z.coerce.number(),
      w: z.coerce.number(),
      h: z.coerce.number(),
    })
    .nullish()
    .transform((b) => {
      if (!b) return null;
      const c = (n: number) => Math.min(1, Math.max(0, n));
      const x = c(b.x), y = c(b.y);
      const w = Math.min(c(b.w), 1 - x);
      const h = Math.min(c(b.h), 1 - y);
      if (w < 0.01 || h < 0.01) return null;
      return { x, y, w, h };
    }),
});

const vlmResponse = z.object({ findings: z.array(vlmFinding).max(12) });

const SYSTEM_PROMPT = `You are Qwen-VL acting as a WCAG 2.2 accessibility auditor for campus posters and app UI screenshots.
Inspect the image and report ONLY genuine, visually-grounded accessibility issues. Be conservative: withhold speculative findings.
For each issue return one JSON object with keys:
category (one of: contrast, color, typography, clutter, hierarchy, touch_target, label, other),
severity (critical | major | minor),
title (<= 12 words),
explanation (2-3 sentences: what you see, who is affected, and which WCAG 2.2 criterion it maps to),
suggestion (1-2 concrete, actionable fixes),
wcag (criterion id + name, e.g. "1.4.3 Contrast (Minimum)", or null),
confidence (0..1, your calibrated self-confidence),
bbox (normalized {x,y,w,h} locating the problem region, fractions 0..1, or null if it spans the whole image).
Respond with STRICT JSON ONLY: {"findings": [...]} and nothing else.`;

function vlmConfig() {
  const base = process.env.VLM_BASE_URL ?? "http://127.0.0.1:11434/v1";
  const model = process.env.VLM_MODEL ?? "qwen2.5vl:3b";
  return { base: base.replace(/\/$/, ""), model };
}

/** Quick reachability probe used for UI status chips. */
export async function checkVlmOnline(): Promise<boolean> {
  const { base } = vlmConfig();
  try {
    const res = await fetch(`${base}/models`, {
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json");
  return JSON.parse(body.slice(start, end + 1));
}

async function analyzeWithQwenVL(
  buffer: Buffer,
  mime: string,
  kind: AuditKind,
): Promise<CandidateFinding[] | null> {
  const { base, model } = vlmConfig();
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  const userText =
    kind === "poster"
      ? "Audit this printed campus poster for accessibility issues (contrast, color reliance, type size, clutter, hierarchy). JSON only."
      : "Audit this app UI screenshot for accessibility issues (contrast, touch-target size, labels/alt text, hierarchy). JSON only.";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model,
        temperature: 0.15,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = vlmResponse.safeParse(extractJson(content));
    if (!parsed.success) return null;
    if (parsed.data.findings.length === 0) return null;
    return parsed.data.findings;
  } catch {
    return null; // endpoint offline / malformed → caller falls back
  }
}

/* ------------------------------------------------------------------ */
/*  Heuristic engine (real pixel analysis, used when VLM is offline)   */
/* ------------------------------------------------------------------ */

const GRID = 8;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** WCAG relative luminance of one sRGB channel triplet (0..255). */
function relLum(r: number, g: number, b: number) {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

interface Cell {
  lum: number;
  sat: number;
  edges: number;
  cx: number; // center x fraction
  cy: number; // center y fraction
}

async function measure(buffer: Buffer): Promise<{ stats: ImageStats; cells: Cell[]; cellW: number; cellH: number }> {
  const meta = await sharp(buffer).metadata();
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const n = w * h;
  const lum = new Float64Array(n);
  const rg = new Float64Array(n);
  const yb = new Float64Array(n);
  const sat = new Float64Array(n);
  const hueCount = new Array(12).fill(0);
  let satTotal = 0;

  for (let i = 0; i < n; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    lum[i] = relLum(r, g, b);
    const R = r / 255, G = g / 255, B = b / 255;
    rg[i] = R - G;
    yb[i] = (R + G) / 2 - B;
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const s = max === 0 ? 0 : (max - min) / max;
    sat[i] = s;
    if (s > 0.3 && max > 0.15) {
      let hh = 0;
      const d = max - min;
      if (d > 0) {
        if (max === R) hh = ((G - B) / d) % 6;
        else if (max === G) hh = (B - R) / d + 2;
        else hh = (R - G) / d + 4;
        hh *= 60;
        if (hh < 0) hh += 360;
        hueCount[Math.min(11, Math.floor(hh / 30))]++;
        satTotal++;
      }
    }
  }

  // global summaries
  let mean = 0;
  for (let i = 0; i < n; i++) mean += lum[i];
  mean /= n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (lum[i] - mean) ** 2;
  const std = Math.sqrt(varSum / n);

  const sorted = Float64Array.from(lum).sort();
  const p10 = sorted[Math.floor(n * 0.1)];
  const p90 = sorted[Math.floor(n * 0.9)];
  const tonalRangeRatio = (p90 + 0.05) / (p10 + 0.05);

  // colorfulness (Hasler-Süsstrunk)
  let mRg = 0, mYb = 0;
  for (let i = 0; i < n; i++) { mRg += rg[i]; mYb += yb[i]; }
  mRg /= n; mYb /= n;
  let vRg = 0, vYb = 0;
  for (let i = 0; i < n; i++) { vRg += (rg[i] - mRg) ** 2; vYb += (yb[i] - mYb) ** 2; }
  const colorfulness =
    Math.sqrt(vRg / n + vYb / n) + 0.3 * Math.sqrt(mRg * mRg + mYb * mYb);

  // edge map (simple central-difference gradient on luminance)
  const edges = new Float64Array(n);
  let edgeSum = 0, bottomEdgeSum = 0, bottomCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = lum[i + 1] - lum[i - 1];
      const gy = lum[i + w] - lum[i - w];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[i] = mag;
      edgeSum += mag;
      if (y > (h * 2) / 3) { bottomEdgeSum += mag; bottomCount++; }
    }
  }
  const edgeDensity = edgeSum / n;
  const bottomEdgeDensity = bottomCount ? bottomEdgeSum / bottomCount : 0;

  let dark = 0, bright = 0;
  for (let i = 0; i < n; i++) {
    if (lum[i] < 0.04) dark++;
    if (lum[i] > 0.85) bright++;
  }

  // grid cells
  const cellW = w / GRID, cellH = h / GRID;
  const cells: Cell[] = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let L = 0, S = 0, E = 0, c = 0;
      const x0 = Math.floor(gx * cellW), x1 = Math.floor((gx + 1) * cellW);
      const y0 = Math.floor(gy * cellH), y1 = Math.floor((gy + 1) * cellH);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * w + x;
          L += lum[i]; S += sat[i]; E += edges[i]; c++;
        }
      }
      cells.push({
        lum: L / c,
        sat: S / c,
        edges: E / c,
        cx: (gx + 0.5) / GRID,
        cy: (gy + 0.5) / GRID,
      });
    }
  }

  const redPx = (hueCount[0] ?? 0) + (hueCount[11] ?? 0) + (hueCount[1] ?? 0);
  const greenPx = (hueCount[3] ?? 0) + (hueCount[4] ?? 0) + (hueCount[5] ?? 0);

  const stats: ImageStats = {
    width: meta.width ?? w,
    height: meta.height ?? h,
    meanLum: mean,
    lumStd: std,
    p10Lum: p10,
    p90Lum: p90,
    tonalRangeRatio,
    colorfulness,
    edgeDensity,
    bottomEdgeDensity,
    darkPixelPct: dark / n,
    brightPixelPct: bright / n,
    redShare: satTotal ? redPx / satTotal : 0,
    greenShare: satTotal ? greenPx / satTotal : 0,
  };
  return { stats, cells, cellW: 1 / GRID, cellH: 1 / GRID };
}

const f2 = (n: number) => n.toFixed(2);

async function analyzeHeuristic(
  buffer: Buffer,
  kind: AuditKind,
): Promise<{ findings: CandidateFinding[]; stats: ImageStats }> {
  const { stats, cells, cellW, cellH } = await measure(buffer);
  const out: CandidateFinding[] = [];
  const conf = (base: number) => Math.round(clamp01(base) * 100) / 100;

  // 1 · Global tonal separation (poor contrast overall)
  if (stats.tonalRangeRatio < 2.2) {
    out.push({
      category: "contrast",
      severity: stats.tonalRangeRatio < 1.6 ? "critical" : "major",
      title: "Weak overall tonal separation across the image",
      explanation: `The measured luminance range is narrow (10th–90th percentile ratio ≈ ${f2(
        stats.tonalRangeRatio,
      )}:1, far below the 4.5:1 WCAG asks of body text), so foreground content blends into the background. Readers with low vision, and anyone viewing the ${kind === "poster" ? "poster at a distance or in glare" : "screen in bright light"}, will struggle to separate content from background. Maps to WCAG 1.4.3 Contrast (Minimum).`,
      suggestion:
        "Pair a near-neutral foreground with a much darker/lighter background (target ≥ 4.5:1 for body text, ≥ 3:1 for large display type). Check pairs with a contrast checker before printing or shipping.",
      wcag: "1.4.3 Contrast (Minimum)",
      confidence: conf(0.55 + (2.2 - stats.tonalRangeRatio) * 0.35),
      bbox: null,
    });
  }

  // 2 · Local low-contrast regions with texture (likely text areas)
  const cellAt = (x: number, y: number) => cells[y * GRID + x];
  const edgeThreshold = stats.edgeDensity * 1.15;
  const regionHits: { cell: Cell; ratio: number; gx: number; gy: number }[] = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const c = cellAt(gx, gy);
      if (c.edges < edgeThreshold) continue; // only textured (text-like) cells
      const neighbours = [
        gx < GRID - 1 ? cellAt(gx + 1, gy) : null,
        gy < GRID - 1 ? cellAt(gx, gy + 1) : null,
      ].filter(Boolean) as Cell[];
      for (const nb of neighbours) {
        const ratio =
          (Math.max(c.lum, nb.lum) + 0.05) / (Math.min(c.lum, nb.lum) + 0.05);
        if (ratio < 1.6) {
          regionHits.push({ cell: c, ratio, gx, gy });
          break;
        }
      }
    }
  }
  // merge-ish: take up to 2 well-separated clusters
  const chosen: typeof regionHits = [];
  for (const hit of regionHits.sort((a, b) => a.ratio - b.ratio)) {
    if (
      chosen.length < 2 &&
      chosen.every(
        (c) => Math.abs(c.gx - hit.gx) + Math.abs(c.gy - hit.gy) > 2,
      )
    ) {
      chosen.push(hit);
    }
  }
  for (const hit of chosen) {
    const zone =
      hit.gy < GRID / 3 ? "upper" : hit.gy < (GRID * 2) / 3 ? "middle" : "lower";
    out.push({
      category: "contrast",
      severity: hit.ratio < 1.25 ? "critical" : "major",
      title: `Low-contrast textured region in the ${zone} area`,
      explanation: `A textured area (edge density ${f2(
        hit.cell.edges,
      )}, consistent with small text or fine strokes) sits in a region whose adjacent-tone contrast is only ≈ ${f2(
        hit.ratio,
      )}:1. Fine detail at that contrast is effectively invisible to readers with reduced contrast sensitivity and fails WCAG 1.4.3 for any text rendered there.`,
      suggestion:
        "Repaint the region with a solid, well-separated background (e.g. dark ink on a light block, or a scrim behind text over imagery) and re-check the text/background pair against 4.5:1.",
      wcag: "1.4.3 Contrast (Minimum)",
      confidence: conf(0.5 + (1.6 - hit.ratio) * 0.5),
      bbox: {
        x: clamp01(hit.gx * cellW - 0.5 * cellW),
        y: clamp01(hit.gy * cellH - 0.5 * cellH),
        w: 2 * cellW,
        h: 2 * cellH,
      },
    });
  }

  // 3 · Red/green co-occurrence → CVD reliance
  if (stats.redShare > 0.12 && stats.greenShare > 0.12) {
    const balance = Math.min(stats.redShare, stats.greenShare);
    out.push({
      category: "color",
      severity: balance > 0.25 ? "critical" : "major",
      title: "Red and green used together to carry meaning",
      explanation: `Saturated red and green hues each cover ≈ ${Math.round(
        stats.redShare * 100,
      )}% and ${Math.round(
        stats.greenShare * 100,
      )}% of colorful pixels. Roughly 8% of men have red-green color-vision deficiency and cannot reliably tell these panels apart, so any meaning encoded by this hue split is lost. Maps to WCAG 1.4.1 Use of Color.`,
      suggestion:
        "Do not encode categories by hue alone: pair colors with text labels, icons, or patterns, and replace the red/green pairing with a CVD-safe palette (e.g. blue/orange).",
      wcag: "1.4.1 Use of Color",
      confidence: conf(0.5 + balance * 0.8),
      bbox: null,
    });
  } else if (stats.colorfulness > 0.28) {
    out.push({
      category: "color",
      severity: "minor",
      title: "Highly saturated palette may overwhelm key content",
      explanation: `Measured colorfulness is ${f2(
        stats.colorfulness,
      )} (≈2× typical print), meaning many saturated hues compete for attention. For readers with low vision this reduces effective contrast of overlaid text and can mask which elements matter most.`,
      suggestion:
        "Reserve the most saturated hues for a single accent, keep informational text on quiet neutrals, and verify remaining pairs against WCAG contrast thresholds.",
      wcag: "1.4.1 Use of Color",
      confidence: conf(0.42 + stats.colorfulness * 0.4),
      bbox: null,
    });
  }

  // 4 · Dense small print in the bottom region
  if (stats.bottomEdgeDensity > stats.edgeDensity * 1.35 && stats.bottomEdgeDensity > 0.09) {
    out.push({
      category: "typography",
      severity: kind === "poster" ? "major" : "minor",
      title:
        kind === "poster"
          ? "Dense small print concentrated near the bottom"
          : "Dense microtext in the lower region of the screen",
      explanation: `The bottom band shows edge density ${f2(
        stats.bottomEdgeDensity,
      )} vs ${f2(
        stats.edgeDensity,
      )} overall — a signature of tightly packed small type. ${
        kind === "poster"
          ? "Schedule/details printed this small are unreadable beyond arm's length and fail reasonable legibility practice for public posters."
          : "Microtext this dense is typically below the ~12pt legibility floor for mobile UI and is hard to read for users with low vision."
      }`,
      suggestion:
        kind === "poster"
          ? "Cut secondary copy ruthlessly, move details to a short URL or QR code, and keep printed text ≥ ~14pt at final size with ≥ 4.5:1 contrast."
          : "Raise font sizes to ≥ 12pt, increase line spacing, and move secondary actions into a disclosure control instead of shrinking the type.",
      wcag: "1.4.4 Resize Text",
      confidence: conf(
        0.45 + (stats.bottomEdgeDensity / Math.max(stats.edgeDensity, 0.01) - 1.2) * 0.3,
      ),
      bbox: { x: 0.05, y: 2 / 3, w: 0.9, h: 1 / 3 - 0.02 },
    });
  }

  // 5 · Overall clutter / cognitive load
  if (stats.edgeDensity > 0.14 && stats.lumStd > 0.045) {
    out.push({
      category: "clutter",
      severity: "major",
      title: "High visual density competes with the main message",
      explanation: `Edge-energy per pixel is ${f2(
        stats.edgeDensity,
      )} — in the top decile for ${kind === "poster" ? "campus posters" : "app screens"} — with luminance variance ${f2(
        stats.lumStd,
      )}, indicating many overlapping visual elements. Crowded layouts raise cognitive load and make it harder for everyone, especially users with attention or cognitive disabilities, to find the essential information.`,
      suggestion:
        "Group related items into a few clearly separated blocks, remove decorative elements that carry no meaning, and give the single most important message the largest, quietest area.",
      wcag: null,
      confidence: conf(0.4 + stats.edgeDensity),
      bbox: null,
    });
  }

  // 6 · Overall darkness / washout
  if (stats.meanLum < 0.08 && stats.darkPixelPct > 0.5) {
    out.push({
      category: "contrast",
      severity: "minor",
      title: "Predominantly dark palette reduces legibility in poor light",
      explanation: `${Math.round(
        stats.darkPixelPct * 100,
      )}% of pixels sit below 4% relative luminance. Dark palettes force any light-on-dark text to be read against halation and are harder to parse ${
        kind === "poster" ? "outdoors at night or in dim hallways" : "in bright ambient light on a dimmed screen"
      }.`,
      suggestion:
        "Raise background luminance slightly, increase font weight for light-on-dark text, and re-check text pairs against ≥ 4.5:1.",
      wcag: "1.4.3 Contrast (Minimum)",
      confidence: conf(0.38 + stats.darkPixelPct * 0.3),
      bbox: null,
    });
  } else if (stats.meanLum > 0.7 && stats.lumStd < 0.03) {
    out.push({
      category: "contrast",
      severity: "major",
      title: "Washed-out palette with little tonal structure",
      explanation: `Mean luminance is ${f2(stats.meanLum)} with variance only ${f2(
        stats.lumStd,
      )} — almost everything is light-on-light. Gray-on-white or pastel-on-white typography is the classic failure here, and it is especially hostile to older readers.`,
      suggestion:
        "Introduce a genuinely dark ink for body text (#595959 or darker on white) and reserve pale tints for decoration only.",
      wcag: "1.4.3 Contrast (Minimum)",
      confidence: conf(0.5 + (0.03 - stats.lumStd) * 4),
      bbox: null,
    });
  }

  // 7 · UI-specific: cramped bottom control band
  if (kind === "ui_screenshot") {
    if (stats.bottomEdgeDensity > 0.07) {
      out.push({
        category: "touch_target",
        severity: "major",
        title: "Bottom control band suggests undersized touch targets",
        explanation: `The lower band carries dense, closely spaced strokes (edge density ${f2(
          stats.bottomEdgeDensity,
        )}), typical of icon bars with small, tightly packed buttons. WCAG 2.5.8 requires targets of at least 24×24 CSS px with adequate spacing; bars like this commonly ship 32–40px rows that leave <24px of effective hit area.`,
        suggestion:
          "Ensure each control's hit area is ≥ 24×24 CSS px (44px preferred), add ≥ 8px gaps between adjacent targets, and expand hit areas beyond the visible icon where needed.",
        wcag: "2.5.8 Target Size (Minimum)",
        confidence: conf(0.4 + stats.bottomEdgeDensity * 1.2),
        bbox: { x: 0.02, y: 0.86, w: 0.96, h: 0.13 },
      });
    }
    if (stats.meanLum > 0.55 && stats.tonalRangeRatio < 2.6) {
      out.push({
        category: "label",
        severity: "minor",
        title: "Thin gray-on-white labels likely below contrast minimums",
        explanation: `The screen is dominated by light tones (mean luminance ${f2(
          stats.meanLum,
        )}) with a compressed tonal range, the classic signature of light-gray labels and placeholder text on white. Such combinations usually measure between 2:1 and 3:1, failing WCAG 1.4.3.`,
        suggestion:
          "Darken secondary text to at least #595959 on white (4.5:1) and never rely on placeholder styling for essential labels; provide persistent visible labels for inputs.",
        wcag: "1.4.3 Contrast (Minimum)",
        confidence: conf(0.45 + (2.6 - stats.tonalRangeRatio) * 0.25),
        bbox: null,
      });
    }
  }

  // ordered by severity rank then confidence
  const rank: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };
  out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.confidence - a.confidence);
  return { findings: out.slice(0, 8), stats };
}

/* ------------------------------------------------------------------ */
/*  Orchestrator                                                       */
/* ------------------------------------------------------------------ */

export interface AnalysisResult {
  analyzer: AnalyzerId;
  findings: CandidateFinding[];
  stats: ImageStats | null;
}

export async function runAnalysis(
  buffer: Buffer,
  mime: string,
  kind: AuditKind,
): Promise<AnalysisResult> {
  const { model } = vlmConfig();
  console.info(`[a11y] Trying Qwen-VL model "${model}"...`);
  const vlm = await analyzeWithQwenVL(buffer, mime, kind);
  const { stats } = await measure(buffer);
  if (vlm && vlm.length > 0) {
    console.info(`[a11y] Qwen-VL produced ${vlm.length} finding(s).`);
    return { analyzer: "qwen-vl", findings: vlm, stats };
  }
  console.info("[a11y] Qwen-VL returned no usable findings; using heuristic fallback.");
  const heuristic = await analyzeHeuristic(buffer, kind);
  console.info(`[a11y] Heuristic analyzer produced ${heuristic.findings.length} finding(s).`);
  return { analyzer: "heuristic", findings: heuristic.findings, stats };
}
