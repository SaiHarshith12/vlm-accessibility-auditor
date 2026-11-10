import { db } from "@/db";
import { findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["pending", "confirmed", "rejected", "uncertain"] as const;

/** Human verification of one finding (true/false positive adjudication). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = body?.status as string | undefined;
  if (!status || !STATUSES.includes(status as never)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  const verifiedBy =
    typeof body?.verifiedBy === "string" && body.verifiedBy.trim()
      ? body.verifiedBy.trim().slice(0, 120)
      : "reviewer";

  const [row] = await db
    .update(findings)
    .set(
      status === "pending"
        ? { status: "pending", verifiedBy: null, verifiedAt: null }
        : { status, verifiedBy, verifiedAt: new Date() },
    )
    .where(eq(findings.id, id))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ finding: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(findings)
    .where(eq(findings.id, id))
    .returning({ id: findings.id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
