import { db } from "@/db";
import { audits, findings, type NewFinding } from "@/db/schema";
import { runAnalysis, type AuditKind } from "@/lib/analysis";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

export async function GET() {
  const rows = await db
    .select({
      audit: audits,
      total: sql<number>`count(${findings.id})::int`,
      pending: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'pending')::int`,
      confirmed: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'confirmed')::int`,
      rejected: sql<number>`count(${findings.id}) filter (where ${findings.status} = 'rejected')::int`,
      critical: sql<number>`count(${findings.id}) filter (where ${findings.severity} = 'critical')::int`,
    })
    .from(audits)
    .leftJoin(findings, eq(findings.auditId, audits.id))
    .groupBy(audits.id)
    .orderBy(desc(audits.createdAt));

  return Response.json({
    audits: rows.map(({ audit, ...c }) => ({
      ...audit,
      stats: undefined,
      counts: c,
    })),
  });
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "File must be an image" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image exceeds the 12MB limit" }, { status: 413 });
  }

  const kind: AuditKind =
    form.get("kind") === "ui_screenshot" ? "ui_screenshot" : "poster";
  const rawTitle = String(form.get("title") ?? "").trim();
  const title =
    rawTitle ||
    file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") ||
    "Untitled artifact";

  const buffer = Buffer.from(await file.arrayBuffer());

  let width: number | null = null;
  let height: number | null = null;
  try {
    const meta = await sharp(buffer).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } catch {
    return Response.json({ error: "Could not decode image" }, { status: 422 });
  }

  const { analyzer, findings: found, stats } = await runAnalysis(
    buffer,
    file.type,
    kind,
  );

  const [audit] = await db
    .insert(audits)
    .values({
      title,
      kind,
      imageData: buffer.toString("base64"),
      mime: file.type,
      width,
      height,
      analyzer,
      stats,
    })
    .returning({ id: audits.id });

  if (found.length > 0) {
    const values: NewFinding[] = found.map((f) => ({
      auditId: audit.id,
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

  return Response.json(
    { id: audit.id, analyzer, added: found.length },
    { status: 201 },
  );
}
