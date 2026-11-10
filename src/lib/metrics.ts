import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { sql } from "drizzle-orm";
import { CATEGORY_META, type Category } from "./taxonomy";

export interface Metrics {
  totals: {
    audits: number;
    findings: number;
    pendingReview: number;
    reviewedModelFindings: number;
    needsReviewAudits: number;
    verifiedAudits: number;
  };
  confusion: { tp: number; fp: number; fn: number; uncertain: number };
  precision: number | null;
  recall: number | null;
  f1: number | null;
  /** Share of reviewed model findings that were false positives. */
  fpShare: number | null;
  outcomes: { status: string; count: number }[];
  calibration: { bucket: string; mid: number; confirmRate: number; n: number }[];
  perCategory: {
    category: Category;
    label: string;
    tp: number;
    fp: number;
    precision: number | null;
    total: number;
  }[];
}

export async function computeMetrics(): Promise<Metrics> {
  const rows = await db
    .select({
      source: findings.source,
      status: findings.status,
      category: findings.category,
      confidence: findings.confidence,
    })
    .from(findings);

  let tp = 0, fp = 0, uncertain = 0;
  const fn = rows.filter((r) => r.source === "human").length;

  type Cat = Category;
  const perCat = new Map<Cat, { tp: number; fp: number; total: number }>();
  const buckets = [
    { bucket: "0.30–0.55", lo: 0.0, hi: 0.55, mid: 0.425, ok: 0, n: 0 },
    { bucket: "0.55–0.70", lo: 0.55, hi: 0.7, mid: 0.625, ok: 0, n: 0 },
    { bucket: "0.70–0.85", lo: 0.7, hi: 0.85, mid: 0.775, ok: 0, n: 0 },
    { bucket: "0.85–1.00", lo: 0.85, hi: 1.01, mid: 0.925, ok: 0, n: 0 },
  ];

  const outcomeCount = new Map<string, number>();
  const bump = (k: string) => outcomeCount.set(k, (outcomeCount.get(k) ?? 0) + 1);

  for (const r of rows) {
    bump(r.status);
    if (r.source !== "model") continue;
    const cat = (r.category as Cat) in CATEGORY_META ? (r.category as Cat) : "other";
    if (!perCat.has(cat)) perCat.set(cat, { tp: 0, fp: 0, total: 0 });
    const pc = perCat.get(cat)!;
    pc.total++;
    if (r.status === "confirmed") {
      tp++;
      pc.tp++;
    } else if (r.status === "rejected") {
      fp++;
      pc.fp++;
    } else if (r.status === "uncertain") {
      uncertain++;
    }
    if (
      (r.status === "confirmed" || r.status === "rejected") &&
      r.confidence != null
    ) {
      const b = buckets.find((b) => r.confidence! >= b.lo && r.confidence! < b.hi);
      if (b) {
        b.n++;
        if (r.status === "confirmed") b.ok++;
      }
    }
  }

  const reviewed = tp + fp;
  const precision = reviewed > 0 ? tp / reviewed : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null;
  const f1 =
    precision != null && recall != null && precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null;
  const fpShare = reviewed > 0 ? fp / reviewed : null;

  const [{ count: auditCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(audits);

  const pendingRows = await db
    .select({ auditId: findings.auditId, count: sql<number>`count(*)::int` })
    .from(findings)
    .where(sql`${findings.status} = 'pending'`)
    .groupBy(findings.auditId);
  const auditsWithPending = new Set(pendingRows.map((r) => r.auditId));

  const findingsPerAudit = await db
    .select({ auditId: findings.auditId, count: sql<number>`count(*)::int` })
    .from(findings)
    .groupBy(findings.auditId);
  const auditsWithFindings = new Set(findingsPerAudit.map((r) => r.auditId));

  const verifiedAudits = [...auditsWithFindings].filter(
    (id) => !auditsWithPending.has(id),
  ).length;

  return {
    totals: {
      audits: auditCount,
      findings: rows.length,
      pendingReview: outcomeCount.get("pending") ?? 0,
      reviewedModelFindings: reviewed,
      needsReviewAudits: auditsWithPending.size,
      verifiedAudits,
    },
    confusion: { tp, fp, fn, uncertain },
    precision,
    recall,
    f1,
    fpShare,
    outcomes: ["pending", "confirmed", "rejected", "uncertain"].map((s) => ({
      status: s,
      count: outcomeCount.get(s) ?? 0,
    })),
    calibration: buckets.map((b) => ({
      bucket: b.bucket,
      mid: b.mid,
      confirmRate: b.n > 0 ? b.ok / b.n : 0,
      n: b.n,
    })),
    perCategory: [...perCat.entries()]
      .map(([category, v]) => ({
        category,
        label: CATEGORY_META[category].label,
        tp: v.tp,
        fp: v.fp,
        total: v.total,
        precision: v.tp + v.fp > 0 ? v.tp / (v.tp + v.fp) : null,
      }))
      .sort((a, b) => b.total - a.total),
  };
}
