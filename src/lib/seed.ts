import { db } from "@/db";
import { audits, findings, type NewFinding } from "@/db/schema";
import { sql } from "drizzle-orm";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Idempotent demo seeding: when the database has no audits yet we insert four
 * curated audits (matching the bundled sample images) with a realistic mixture
 * of confirmed / rejected / pending / human-added findings so the evaluation
 * dashboard is meaningful on first load.
 */
export async function ensureSeeded() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(audits);
  if (count > 0) return;

  const dir = path.join(process.cwd(), "public", "samples");
  const names = [
    "poster-concert.jpg",
    "poster-clubfair.jpg",
    "poster-lecture.jpg",
    "ui-campusapp.jpg",
  ];
  try {
    await fs.access(path.join(dir, names[0]));
  } catch {
    return; // samples not present → skip seeding silently
  }
  const dims = new Map<string, { w: number; h: number }>();
  for (const n of names) {
    try {
      const meta = await sharp(path.join(dir, n)).metadata();
      dims.set(n, { w: meta.width ?? 0, h: meta.height ?? 0 });
    } catch {
      dims.set(n, { w: 0, h: 0 });
    }
  }

  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000);
  const F = (
    f: Partial<NewFinding> &
      Pick<
        NewFinding,
        "auditId" | "category" | "severity" | "title" | "explanation" | "suggestion"
      >,
  ) => f;

  // ── Audit 1 · concert poster (dark navy, lavender type, dense schedule) ──
  const [a1] = await db
    .insert(audits)
    .values({
      title: "Indie Night — Battle of the Bands",
      kind: "poster",
      imagePath: "/samples/poster-concert.jpg",
      mime: "image/jpeg",
      width: dims.get("poster-concert.jpg")!.w,
      height: dims.get("poster-concert.jpg")!.h,
      analyzer: "qwen-vl",
      createdAt: d(9),
      stats: {
        meanLum: 0.062, lumStd: 0.028, tonalRangeRatio: 2.04, colorfulness: 0.09,
        edgeDensity: 0.108, bottomEdgeDensity: 0.171, darkPixelPct: 0.61,
        brightPixelPct: 0.02, redShare: 0.04, greenShare: 0.03,
      },
    })
    .returning({ id: audits.id });
  await db.insert(findings).values([
    F({
      auditId: a1.id, category: "contrast", severity: "critical",
      title: "Pale lavender serif type on navy sits at ≈ 2.3:1",
      explanation:
        "The headline and body copy are set in a thin lavender serif over a deep navy field. Sampling the two tones gives approximately 2.3:1 — well under the 4.5:1 WCAG minimum — and thin serifs erode that further at a distance. Students with low vision or anyone reading in glare will not be able to parse the event details.",
      suggestion:
        "Switch body copy to an off-white (#F2F0FF) on the navy or a dark ink on a light panel, target ≥ 4.5:1, and move the headline to a heavier weight.",
      wcag: "1.4.3 Contrast (Minimum)", confidence: 0.91,
      bboxX: 0.12, bboxY: 0.08, bboxW: 0.76, bboxH: 0.3,
      status: "confirmed", verifiedBy: "m.okafor@campus.edu", verifiedAt: d(7),
      createdAt: d(9),
    }),
    F({
      auditId: a1.id, category: "typography", severity: "major",
      title: "Full schedule set as dense small print in the bottom third",
      explanation:
        "The lower band holds the entire lineup in tightly packed small type (its edge density is ~1.6× the page average). Text printed at this size on a public poster is illegible beyond arm's length and hostile to readers with low vision.",
      suggestion:
        "Cut the schedule to three headliners and move the full lineup behind a short URL or QR code; keep printed copy ≥ ~14pt at final size.",
      wcag: "1.4.4 Resize Text", confidence: 0.84,
      bboxX: 0.06, bboxY: 0.66, bboxW: 0.88, bboxH: 0.31,
      status: "confirmed", verifiedBy: "m.okafor@campus.edu", verifiedAt: d(7),
      createdAt: d(9),
    }),
    F({
      auditId: a1.id, category: "color", severity: "minor",
      title: "Low-saturation palette may reduce signpost visibility",
      explanation:
        "The palette is almost monochromatic; no accent hue separates date, venue and call-to-action from body text, so key signposts blend into surrounding copy.",
      suggestion:
        "Introduce one high-contrast accent (e.g. warm amber) reserved exclusively for date/venue/CTA.",
      wcag: null, confidence: 0.44,
      status: "rejected", verifiedBy: "m.okafor@campus.edu", verifiedAt: d(7),
      createdAt: d(9),
    }),
    F({
      auditId: a1.id, category: "hierarchy", severity: "minor",
      title: "Headline and supporting copy share one type size rhythm",
      explanation:
        "Poster title, artist names and date lines step down gradually rather than jumping, so the scannable entry point is ambiguous from a distance.",
      suggestion:
        "Make the event name at least 2.5× the body size and isolate the date in its own band.",
      wcag: null, confidence: 0.57, status: "pending", createdAt: d(9),
      bboxX: 0.1, bboxY: 0.05, bboxW: 0.8, bboxH: 0.55,
    }),
  ]);

  // ── Audit 2 · club fair poster (red/green coding) ──
  const [a2] = await db
    .insert(audits)
    .values({
      title: "Spring Club Fair — Clubs & Societies Expo",
      kind: "poster",
      imagePath: "/samples/poster-clubfair.jpg",
      mime: "image/jpeg",
      width: dims.get("poster-clubfair.jpg")!.w,
      height: dims.get("poster-clubfair.jpg")!.h,
      analyzer: "qwen-vl",
      createdAt: d(6),
      stats: {
        meanLum: 0.31, lumStd: 0.07, tonalRangeRatio: 3.9, colorfulness: 0.34,
        edgeDensity: 0.152, bottomEdgeDensity: 0.118, darkPixelPct: 0.04,
        brightPixelPct: 0.11, redShare: 0.38, greenShare: 0.31,
      },
    })
    .returning({ id: audits.id });
  await db.insert(findings).values([
    F({
      auditId: a2.id, category: "color", severity: "critical",
      title: "Club categories encoded by red vs. green panels alone",
      explanation:
        "Sports clubs sit on saturated red panels and academic societies on saturated green, with no labels or icons differentiating them. For the ~8% of men with red-green CVD the two categories collapse into one indistinguishable brown, so the poster's core organizing device fails. Maps to WCAG 1.4.1 Use of Color.",
      suggestion:
        "Add explicit text labels and an icon per category, and swap the pairing for a CVD-safe combo such as navy/orange; keep hue as decoration only.",
      wcag: "1.4.1 Use of Color", confidence: 0.88,
      bboxX: 0.04, bboxY: 0.18, bboxW: 0.92, bboxH: 0.5,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(4),
      createdAt: d(6),
    }),
    F({
      auditId: a2.id, category: "contrast", severity: "major",
      title: "Yellow and white text over saturated red below 4.5:1",
      explanation:
        "Small white and yellow captions sit directly on the red panels; measured pairs hover near 3:1. Against saturated mid-tone backgrounds both combos fail WCAG 1.4.3 for normal-size text.",
      suggestion:
        "Place captions on solid dark chips, or darken panel fills ~30% behind text; re-verify each pair in a contrast checker.",
      wcag: "1.4.3 Contrast (Minimum)", confidence: 0.79,
      bboxX: 0.08, bboxY: 0.3, bboxW: 0.4, bboxH: 0.32,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(4),
      createdAt: d(6),
    }),
    F({
      auditId: a2.id, category: "clutter", severity: "minor",
      title: "Overlapping badges and doodles compete with information",
      explanation:
        "Edge density is in the top decile for posters of this size; decorative badges overlap panel boundaries where the event details live, raising visual search time for every reader.",
      suggestion:
        "Confine decorations to a border zone and keep the central information grid free of overlap.",
      wcag: null, confidence: 0.6,
      status: "pending", createdAt: d(6),
      bboxX: 0.55, bboxY: 0.12, bboxW: 0.4, bboxH: 0.4,
    }),
    F({
      auditId: a2.id, category: "typography", severity: "minor",
      title: "Event date rendered in stylized outline type",
      explanation:
        "The date is set in an outlined display face, which effectively halves stroke contrast at reading distance.",
      suggestion: "Set the date in a solid, bold face on a quiet background.",
      wcag: "1.4.3 Contrast (Minimum)", confidence: 0.52,
      status: "rejected", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(4),
      createdAt: d(6),
    }),
    F({
      auditId: a2.id, category: "label", severity: "major", source: "human",
      title: "Accessibility table info only shown on the color-coded map",
      explanation:
        "The step-free entrance and quiet-room locations are marked solely by colored pins on the illustration — information absent from the text and from any alt description. Added by the reviewer; the model missed it.",
      suggestion:
        "List access details in plain text under the map and in the digital flyer's alt text.",
      wcag: "1.1.1 Non-text Content", confidence: null,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(4),
      createdAt: d(4),
    }),
  ]);

  // ── Audit 3 · clean lecture poster (low-issue control case) ──
  const [a3] = await db
    .insert(audits)
    .values({
      title: "Distinguished Lecture — Dr. A. Rahman",
      kind: "poster",
      imagePath: "/samples/poster-lecture.jpg",
      mime: "image/jpeg",
      width: dims.get("poster-lecture.jpg")!.w,
      height: dims.get("poster-lecture.jpg")!.h,
      analyzer: "qwen-vl",
      createdAt: d(3),
      stats: {
        meanLum: 0.12, lumStd: 0.11, tonalRangeRatio: 16.2, colorfulness: 0.02,
        edgeDensity: 0.047, bottomEdgeDensity: 0.052, darkPixelPct: 0.55,
        brightPixelPct: 0.09, redShare: 0.0, greenShare: 0.0,
      },
    })
    .returning({ id: audits.id });
  await db.insert(findings).values([
    F({
      auditId: a3.id, category: "hierarchy", severity: "minor",
      title: "Single accent rule may read as a divider of equal sections",
      explanation:
        "The thin white rule sits near optical center, which can visually split the poster into two competing halves.",
      suggestion:
        "Move the rule closer to the date block or thicken it slightly to read as an underline.",
      wcag: null, confidence: 0.41,
      status: "rejected", verifiedBy: "m.okafor@campus.edu", verifiedAt: d(1),
      createdAt: d(3),
    }),
    F({
      auditId: a3.id, category: "label", severity: "minor", source: "human",
      title: "No alt text or plain-text equivalent for the emailed flyer",
      explanation:
        "The PDF circulated by email embeds this artwork without alt text; screen-reader users receive only the file name. Human-identified false negative.",
      suggestion:
        "Attach a short plain-text description (speaker, title, date, venue) in the email body and PDF metadata.",
      wcag: "1.1.1 Non-text Content", confidence: null,
      status: "confirmed", verifiedBy: "m.okafor@campus.edu", verifiedAt: d(1),
      createdAt: d(1),
    }),
  ]);

  // ── Audit 4 · campus app screenshot ──
  const [a4] = await db
    .insert(audits)
    .values({
      title: "CampusGo App — Services Home Screen v2.3",
      kind: "ui_screenshot",
      imagePath: "/samples/ui-campusapp.jpg",
      mime: "image/jpeg",
      width: dims.get("ui-campusapp.jpg")!.w,
      height: dims.get("ui-campusapp.jpg")!.h,
      analyzer: "heuristic",
      createdAt: d(2),
      stats: {
        meanLum: 0.78, lumStd: 0.024, tonalRangeRatio: 1.9, colorfulness: 0.07,
        edgeDensity: 0.069, bottomEdgeDensity: 0.128, darkPixelPct: 0.0,
        brightPixelPct: 0.62, redShare: 0.05, greenShare: 0.06,
      },
    })
    .returning({ id: audits.id });
  await db.insert(findings).values([
    F({
      auditId: a4.id, category: "touch_target", severity: "critical",
      title: "Bottom utility buttons undersized and tightly packed",
      explanation:
        "The bottom bar packs eight circular buttons into a ~40px-tall strip, leaving an effective hit area well under the 24×24px WCAG 2.5.8 minimum with almost no gap between neighbors. Motor-impaired users will frequently mis-tap.",
      suggestion:
        "Reduce to five primary actions, give each ≥ 44×44px hit area with ≥ 8px separation, and move the rest into an overflow sheet.",
      wcag: "2.5.8 Target Size (Minimum)", confidence: 0.86,
      bboxX: 0.03, bboxY: 0.86, bboxW: 0.94, bboxH: 0.12,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(1),
      createdAt: d(2),
    }),
    F({
      auditId: a4.id, category: "contrast", severity: "major",
      title: "List labels render as light gray on white (est. ≈ 2.6:1)",
      explanation:
        "Primary row labels use a #C7C7CC-like gray on white. Estimated contrast ≈ 2.6:1 fails WCAG 1.4.3 and degrades further outdoors on glossy screens.",
      suggestion:
        "Use #3C3C43 (≈ 11:1) for primary labels and at least #595959 for secondary text.",
      wcag: "1.4.3 Contrast (Minimum)", confidence: 0.78,
      bboxX: 0.06, bboxY: 0.22, bboxW: 0.88, bboxH: 0.5,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(1),
      createdAt: d(2),
    }),
    F({
      auditId: a4.id, category: "color", severity: "minor",
      title: "Active state shown by a subtle blue tint only",
      explanation:
        "The selected tab appears distinguished only by a pale blue fill against white; without a weight or icon change this state is lost for CVD and low-vision users.",
      suggestion: "Pair tint with a filled icon state and a bold label.",
      wcag: "1.4.1 Use of Color", confidence: 0.55,
      status: "pending", createdAt: d(2),
      bboxX: 0.04, bboxY: 0.04, bboxW: 0.92, bboxH: 0.1,
    }),
    F({
      auditId: a4.id, category: "label", severity: "major", source: "human",
      title: "Icon-only row chevrons lack accessible names",
      explanation:
        "VoiceOver reads the trailing chevron/number rows as unlabeled buttons. Found during human review — the model's static analysis missed the missing accessibility labels.",
      suggestion:
        "Set accessibilityLabel on every row action (e.g. \"Open dining hours\") and group row content into one accessible element.",
      wcag: "4.1.2 Name, Role, Value", confidence: null,
      status: "confirmed", verifiedBy: "j.whitfield@campus.edu", verifiedAt: d(1),
      createdAt: d(1),
    }),
  ]);
}
