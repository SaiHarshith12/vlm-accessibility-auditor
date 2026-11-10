import { notFound } from "next/navigation";
import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { checkVlmOnline } from "@/lib/analysis";
import type { ImageStats } from "@/lib/taxonomy";
import { AuditWorkspace } from "@/components/audit-workspace";

export const dynamic = "force-dynamic";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureSeeded();

  const [audit] = await db.select().from(audits).where(eq(audits.id, id)).limit(1);
  if (!audit) notFound();

  const rows = await db
    .select()
    .from(findings)
    .where(eq(findings.auditId, id))
    .orderBy(asc(findings.createdAt));

  const vlmOnline = await checkVlmOnline();

  return (
    <AuditWorkspace
      audit={{
        id: audit.id,
        title: audit.title,
        kind: audit.kind,
        analyzer: audit.analyzer,
        createdAt: audit.createdAt.toISOString(),
        imageSrc: audit.imagePath ?? `/api/images/${audit.id}`,
        width: audit.width,
        height: audit.height,
        stats: (audit.stats as ImageStats | null) ?? null,
      }}
      findings={rows.map((f) => ({
        id: f.id,
        source: f.source,
        category: f.category,
        severity: f.severity,
        title: f.title,
        explanation: f.explanation,
        suggestion: f.suggestion,
        wcag: f.wcag,
        confidence: f.confidence,
        bbox:
          f.bboxX != null && f.bboxY != null && f.bboxW != null && f.bboxH != null
            ? { x: f.bboxX, y: f.bboxY, w: f.bboxW, h: f.bboxH }
            : null,
        status: f.status,
        verifiedBy: f.verifiedBy,
        verifiedAt: f.verifiedAt ? f.verifiedAt.toISOString() : null,
        createdAt: f.createdAt.toISOString(),
      }))}
      vlmOnline={vlmOnline}
    />
  );
}
