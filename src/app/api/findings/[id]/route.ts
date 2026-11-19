import { db } from "@/db";
import { findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["pending", "confirmed", "rejected", "uncertain"] as const;

/** Human verification of one finding (true/false positive adjudication, remediation rating, severity). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const status = body.status as string | undefined;
  if (status !== undefined && !STATUSES.includes(status as never)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const remediationRating = body.remediationRating as string | undefined;
  if (
    remediationRating !== undefined &&
    remediationRating !== null &&
    !["helpful", "not_helpful"].includes(remediationRating)
  ) {
    return Response.json({ error: "Invalid remediationRating" }, { status: 400 });
  }

  const humanSeverity = body.humanSeverity as string | undefined;
  if (
    humanSeverity !== undefined &&
    humanSeverity !== null &&
    !["critical", "major", "minor"].includes(humanSeverity)
  ) {
    return Response.json({ error: "Invalid humanSeverity" }, { status: 400 });
  }

  const verifiedBy =
    typeof body?.verifiedBy === "string" && body.verifiedBy.trim()
      ? body.verifiedBy.trim().slice(0, 120)
      : "reviewer";

  const updateFields: Record<string, any> = {};
  if (status !== undefined) {
    if (status === "pending") {
      updateFields.status = "pending";
      updateFields.verifiedBy = null;
      updateFields.verifiedAt = null;
    } else {
      updateFields.status = status;
      updateFields.verifiedBy = verifiedBy;
      updateFields.verifiedAt = new Date();
    }
  }
  if (remediationRating !== undefined) {
    updateFields.remediationRating = remediationRating;
  }
  if (humanSeverity !== undefined) {
    updateFields.humanSeverity = humanSeverity;
  }

  if (id.startsWith("f-") || id.startsWith("mock-")) {
    return Response.json({
      finding: {
        id,
        ...updateFields,
      },
    });
  }

  const [row] = await db
    .update(findings)
    .set(updateFields)
    .where(eq(findings.id, id))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ finding: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (id.startsWith("f-") || id.startsWith("mock-")) {
    return Response.json({ ok: true, id });
  }
  const [row] = await db
    .delete(findings)
    .where(eq(findings.id, id))
    .returning({ id: findings.id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
