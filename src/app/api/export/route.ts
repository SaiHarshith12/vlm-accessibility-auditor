import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { MOCK_AUDITS, MOCK_FINDINGS, isMockDataEnabled } from "@/mocks/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auditId = searchParams.get("auditId");
  const format = (searchParams.get("format") || "json").toLowerCase();

  const useMock = isMockDataEnabled() || (auditId && auditId.startsWith("mock-"));

  let exportData: any[] = [];

  if (useMock) {
    const targetAudits = auditId
      ? MOCK_AUDITS.filter((a) => a.id === auditId)
      : MOCK_AUDITS;
    const targetFindings = auditId
      ? MOCK_FINDINGS.filter((f) => f.auditId === auditId)
      : MOCK_FINDINGS;

    const auditMap = new Map(targetAudits.map((a) => [a.id, a]));

    exportData = targetFindings.map((f) => {
      const a = auditMap.get(f.auditId);
      return {
        auditId: f.auditId,
        auditTitle: a?.title ?? "Unknown Audit",
        auditKind: a?.kind ?? "unknown",
        analyzer: a?.analyzer ?? "unknown",
        analyzerMs: a?.analyzerMs ?? null,
        findingId: f.id,
        source: f.source,
        category: f.category,
        severity: f.severity,
        humanSeverity: f.humanSeverity ?? null,
        wcag: f.wcag ?? null,
        confidence: f.confidence ?? null,
        bboxX: f.bbox?.x ?? null,
        bboxY: f.bbox?.y ?? null,
        bboxW: f.bbox?.w ?? null,
        bboxH: f.bbox?.h ?? null,
        status: f.status,
        remediationRating: f.remediationRating ?? null,
        title: f.title,
        explanation: f.explanation,
        suggestion: f.suggestion,
        verifiedBy: f.verifiedBy,
        verifiedAt: f.verifiedAt,
        createdAt: f.createdAt,
      };
    });
  } else {
    if (auditId) {
      const [audit] = await db.select().from(audits).where(eq(audits.id, auditId));
      if (!audit) {
        return Response.json({ error: "Audit not found" }, { status: 404 });
      }
      const findingRows = await db
        .select()
        .from(findings)
        .where(eq(findings.auditId, auditId));

      exportData = (findingRows as any[]).map((f: any) => ({
        auditId: f.auditId,
        auditTitle: audit.title,
        auditKind: audit.kind,
        analyzer: audit.analyzer,
        analyzerMs: audit.analyzerMs,
        findingId: f.id,
        source: f.source,
        category: f.category,
        severity: f.severity,
        humanSeverity: f.humanSeverity,
        wcag: f.wcag,
        confidence: f.confidence,
        bboxX: f.bboxX,
        bboxY: f.bboxY,
        bboxW: f.bboxW,
        bboxH: f.bboxH,
        status: f.status,
        remediationRating: f.remediationRating,
        title: f.title,
        explanation: f.explanation,
        suggestion: f.suggestion,
        verifiedBy: f.verifiedBy,
        verifiedAt: f.verifiedAt,
        createdAt: f.createdAt,
      }));
    } else {
      const allAudits = await db.select().from(audits);
      const auditMap = new Map((allAudits as any[]).map((a: any) => [a.id, a]));
      const allFindings = await db.select().from(findings);

      exportData = (allFindings as any[]).map((f: any) => {
        const a: any = auditMap.get(f.auditId);
        return {
          auditId: f.auditId,
          auditTitle: a?.title ?? "Unknown Audit",
          auditKind: a?.kind ?? "unknown",
          analyzer: a?.analyzer ?? "unknown",
          analyzerMs: a?.analyzerMs ?? null,
          findingId: f.id,
          source: f.source,
          category: f.category,
          severity: f.severity,
          humanSeverity: f.humanSeverity,
          wcag: f.wcag,
          confidence: f.confidence,
          bboxX: f.bboxX,
          bboxY: f.bboxY,
          bboxW: f.bboxW,
          bboxH: f.bboxH,
          status: f.status,
          remediationRating: f.remediationRating,
          title: f.title,
          explanation: f.explanation,
          suggestion: f.suggestion,
          verifiedBy: f.verifiedBy,
          verifiedAt: f.verifiedAt,
          createdAt: f.createdAt,
        };
      });
    }
  }

  const filenameStem = auditId ? `audit-${auditId}-dataset` : "accessibility-labelled-dataset";

  if (format === "csv") {
    const headers = [
      "audit_id",
      "audit_title",
      "audit_kind",
      "analyzer",
      "analyzer_ms",
      "finding_id",
      "source",
      "category",
      "severity",
      "human_severity",
      "wcag",
      "confidence",
      "bbox_x",
      "bbox_y",
      "bbox_w",
      "bbox_h",
      "status",
      "remediation_rating",
      "title",
      "explanation",
      "suggestion",
      "verified_by",
      "verified_at",
      "created_at",
    ];

    const lines = [headers.join(",")];
    for (const row of exportData) {
      lines.push(
        [
          csvEscape(row.auditId),
          csvEscape(row.auditTitle),
          csvEscape(row.auditKind),
          csvEscape(row.analyzer),
          csvEscape(row.analyzerMs),
          csvEscape(row.findingId),
          csvEscape(row.source),
          csvEscape(row.category),
          csvEscape(row.severity),
          csvEscape(row.humanSeverity),
          csvEscape(row.wcag),
          csvEscape(row.confidence),
          csvEscape(row.bboxX),
          csvEscape(row.bboxY),
          csvEscape(row.bboxW),
          csvEscape(row.bboxH),
          csvEscape(row.status),
          csvEscape(row.remediationRating),
          csvEscape(row.title),
          csvEscape(row.explanation),
          csvEscape(row.suggestion),
          csvEscape(row.verifiedBy),
          csvEscape(row.verifiedAt),
          csvEscape(row.createdAt),
        ].join(","),
      );
    }

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameStem}.csv"`,
      },
    });
  }

  // Default: JSON export
  return new Response(
    JSON.stringify(
      {
        datasetVersion: "1.0",
        exportedAt: new Date().toISOString(),
        totalRecords: exportData.length,
        records: exportData,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameStem}.json"`,
      },
    },
  );
}
