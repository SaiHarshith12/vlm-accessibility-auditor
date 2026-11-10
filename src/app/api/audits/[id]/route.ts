import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [audit] = await db.select().from(audits).where(eq(audits.id, id)).limit(1);
  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });
  const rows = await db
    .select()
    .from(findings)
    .where(eq(findings.auditId, id))
    .orderBy(asc(findings.createdAt));
  return Response.json({
    audit: { ...audit, imageData: undefined },
    findings: rows,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [audit] = await db
    .delete(audits)
    .where(eq(audits.id, id))
    .returning({ id: audits.id });
  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
