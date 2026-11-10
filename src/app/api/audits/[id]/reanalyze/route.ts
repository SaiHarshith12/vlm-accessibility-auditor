import { db } from "@/db";
import { audits, findings, type NewFinding } from "@/db/schema";
import { runAnalysis, type AuditKind } from "@/lib/analysis";
import { and, eq } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [audit] = await db
    .select()
    .from(audits)
    .where(eq(audits.id, id))
    .limit(1);
  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });

  let buffer: Buffer;
  if (audit.imageData) {
    buffer = Buffer.from(audit.imageData, "base64");
  } else if (audit.imagePath) {
    const p = path.join(process.cwd(), "public", audit.imagePath);
    buffer = await fs.readFile(p);
  } else {
    return Response.json({ error: "Audit has no image bytes" }, { status: 422 });
  }

  const result = await runAnalysis(
    buffer,
    audit.mime,
    audit.kind as AuditKind,
  );

  // Drop only un-reviewed model findings; verified verdicts and human-added
  // ground truth are preserved so evaluation history is never destroyed.
  await db
    .delete(findings)
    .where(
      and(
        eq(findings.auditId, id),
        eq(findings.source, "model"),
        eq(findings.status, "pending"),
      ),
    );

  if (result.findings.length > 0) {
    const values: NewFinding[] = result.findings.map((f) => ({
      auditId: id,
      source: "model",
      category: f.category,
      severity: f.severity,
      title: f.title,
      explanation: f.explanation,
      suggestion: f.suggestion,
      wcag: f.wcag,
      confidence: f.confidence,
      bboxX: f.bbox?.x ?? null,
      bboxY: f.bbox?.y ?? null,
      bboxW: f.bbox?.w ?? null,
      bboxH: f.bbox?.h ?? null,
    }));
    await db.insert(findings).values(values);
  }

  await db
    .update(audits)
    .set({ analyzer: result.analyzer, stats: result.stats })
    .where(eq(audits.id, id));

  return Response.json({ ok: true, analyzer: result.analyzer, added: result.findings.length });
}
