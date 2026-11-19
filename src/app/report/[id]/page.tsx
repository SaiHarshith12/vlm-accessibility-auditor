import { notFound } from "next/navigation";
import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { MOCK_AUDITS, MOCK_FINDINGS, isMockDataEnabled } from "@/mocks/mock-data";
import { RemediationReportClient } from "@/components/remediation-report-client";

export const dynamic = "force-dynamic";

export default async function RemediationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Serve mock data if in mock mode or if id matches mock prefix
  if (isMockDataEnabled() || id.startsWith("mock-")) {
    const mockAudit = MOCK_AUDITS.find((a) => a.id === id) || MOCK_AUDITS[0];
    const mockFindings = MOCK_FINDINGS.filter((f) => f.auditId === mockAudit.id);

    return (
      <RemediationReportClient
        audit={{
          id: mockAudit.id,
          title: mockAudit.title,
          kind: mockAudit.kind,
          analyzer: mockAudit.analyzer,
          analyzerMs: mockAudit.analyzerMs,
          createdAt: mockAudit.createdAt,
          imageSrc: mockAudit.imagePath,
          width: mockAudit.width,
          height: mockAudit.height,
        }}
        findings={mockFindings.map((f) => ({
          id: f.id,
          source: f.source,
          category: f.category,
          severity: f.severity,
          humanSeverity: f.humanSeverity,
          remediationRating: f.remediationRating,
          title: f.title,
          explanation: f.explanation,
          suggestion: f.suggestion,
          wcag: f.wcag,
          confidence: f.confidence,
          bbox: f.bbox,
          status: f.status,
          verifiedBy: f.verifiedBy,
          verifiedAt: f.verifiedAt,
        }))}
      />
    );
  }

  try {
    await ensureSeeded();
    const [audit] = await db.select().from(audits).where(eq(audits.id, id)).limit(1);
    if (!audit) notFound();

    const rows = await db
      .select()
      .from(findings)
      .where(eq(findings.auditId, id))
      .orderBy(asc(findings.createdAt));

    return (
      <RemediationReportClient
        audit={{
          id: audit.id,
          title: audit.title,
          kind: audit.kind,
          analyzer: audit.analyzer,
          analyzerMs: audit.analyzerMs,
          createdAt: audit.createdAt.toISOString(),
          imageSrc: audit.imagePath ?? `/api/images/${audit.id}`,
          width: audit.width,
          height: audit.height,
        }}
        findings={(rows as any[]).map((f: any) => ({
          id: f.id,
          source: f.source,
          category: f.category,
          severity: f.severity,
          humanSeverity: f.humanSeverity,
          remediationRating: f.remediationRating,
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
        }))}
      />
    );
  } catch {
    const mockAudit = MOCK_AUDITS.find((a) => a.id === id) || MOCK_AUDITS[0];
    const mockFindings = MOCK_FINDINGS.filter((f) => f.auditId === mockAudit.id);

    return (
      <RemediationReportClient
        audit={{
          id: mockAudit.id,
          title: mockAudit.title,
          kind: mockAudit.kind,
          analyzer: mockAudit.analyzer,
          analyzerMs: mockAudit.analyzerMs,
          createdAt: mockAudit.createdAt,
          imageSrc: mockAudit.imagePath,
          width: mockAudit.width,
          height: mockAudit.height,
        }}
        findings={mockFindings}
      />
    );
  }
}
