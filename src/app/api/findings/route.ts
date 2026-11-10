import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { CATEGORIES, SEVERITIES } from "@/lib/analysis";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Add a human-identified finding (a false negative — used for recall). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    auditId,
    category,
    severity,
    title,
    explanation,
    suggestion,
    wcag,
    verifiedBy,
  } = body as Record<string, unknown>;

  if (typeof auditId !== "string") {
    return Response.json({ error: "auditId is required" }, { status: 400 });
  }
  const [audit] = await db
    .select({ id: audits.id })
    .from(audits)
    .where(eq(audits.id, auditId))
    .limit(1);
  if (!audit) return Response.json({ error: "Audit not found" }, { status: 404 });

  const cat = CATEGORIES.includes(category as never)
    ? (category as string)
    : "other";
  const sev = SEVERITIES.includes(severity as never)
    ? (severity as string)
    : "major";
  const t = String(title ?? "").trim();
  const ex = String(explanation ?? "").trim();
  const su = String(suggestion ?? "").trim();
  if (t.length < 3 || ex.length < 5 || su.length < 5) {
    return Response.json(
      { error: "Title, explanation and suggestion are required" },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(findings)
    .values({
      auditId: audit.id,
      source: "human",
      category: cat,
      severity: sev,
      title: t.slice(0, 160),
      explanation: ex.slice(0, 2000),
      suggestion: su.slice(0, 2000),
      wcag: typeof wcag === "string" && wcag.trim() ? wcag.trim().slice(0, 80) : null,
      // Human-added findings are ground truth, hence confirmed by definition.
      status: "confirmed",
      verifiedBy:
        typeof verifiedBy === "string" && verifiedBy.trim()
          ? verifiedBy.trim().slice(0, 120)
          : "reviewer",
      verifiedAt: new Date(),
    })
    .returning();

  return Response.json({ finding: row }, { status: 201 });
}
