import { db } from "@/db";
import { audits, findings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { MOCK_AUDITS, MOCK_FINDINGS, isMockDataEnabled } from "@/mocks/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  major: "#f59e0b",
  minor: "#3b82f6",
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "1";

  const useMock = isMockDataEnabled() || id.startsWith("mock-");

  let imageBuffer: Buffer;
  let targetFindings: Array<{
    category: string;
    severity: string;
    bbox: { x: number; y: number; w: number; h: number } | null;
  }> = [];

  if (useMock) {
    const mockAudit = MOCK_AUDITS.find((a) => a.id === id);
    if (!mockAudit) {
      return Response.json({ error: "Audit not found" }, { status: 404 });
    }

    if (mockAudit.imagePath.startsWith("data:image/svg+xml")) {
      const svgContent = decodeURIComponent(
        mockAudit.imagePath.replace(/^data:image\/svg\+xml;utf8,/, ""),
      );
      imageBuffer = Buffer.from(svgContent, "utf-8");
    } else {
      const p = path.join(process.cwd(), "public", mockAudit.imagePath.replace(/^\//, ""));
      imageBuffer = await fs.readFile(p);
    }

    targetFindings = MOCK_FINDINGS.filter((f) => f.auditId === id && f.bbox != null).map(
      (f) => ({
        category: f.category,
        severity: f.severity,
        bbox: f.bbox,
      }),
    );
  } else {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    if (!audit) {
      return Response.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.imageData) {
      imageBuffer = Buffer.from(audit.imageData, "base64");
    } else if (audit.imagePath?.startsWith("data:image/svg+xml")) {
      const svgContent = decodeURIComponent(
        audit.imagePath.replace(/^data:image\/svg\+xml;utf8,/, ""),
      );
      imageBuffer = Buffer.from(svgContent, "utf-8");
    } else if (audit.imagePath?.startsWith("data:image/")) {
      const base64Data = audit.imagePath.replace(/^data:image\/[a-z0-9+]+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } else if (audit.imagePath) {
      const p = path.join(process.cwd(), "public", audit.imagePath.replace(/^\//, ""));
      try {
        imageBuffer = await fs.readFile(p);
      } catch {
        imageBuffer = await sharp({
          create: {
            width: audit.width || 800,
            height: audit.height || 1200,
            channels: 4,
            background: { r: 15, g: 23, b: 42, alpha: 1 },
          },
        }).png().toBuffer();
      }
    } else {
      return Response.json({ error: "Audit has no image data" }, { status: 422 });
    }

    const findingRows = await db
      .select()
      .from(findings)
      .where(eq(findings.auditId, id));

    targetFindings = (findingRows as any[])
      .filter((f: any) => f.bboxX != null && f.bboxY != null && f.bboxW != null && f.bboxH != null)
      .map((f: any) => ({
        category: f.category,
        severity: f.severity,
        bbox: {
          x: f.bboxX!,
          y: f.bboxY!,
          w: f.bboxW!,
          h: f.bboxH!,
        },
      }));
  }

  // Probe base image dimensions
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width || 800;
  const height = meta.height || 1200;

  // Render SVG overlay containing bounding boxes and tags
  const rectsSvg = targetFindings
    .map((f, idx) => {
      if (!f.bbox) return "";
      const color = SEVERITY_COLORS[f.severity] || "#f59e0b";
      const x = Math.round(f.bbox.x * width);
      const y = Math.round(f.bbox.y * height);
      const w = Math.round(f.bbox.w * width);
      const h = Math.round(f.bbox.h * height);

      const label = `${f.category.toUpperCase()} · ${f.severity.toUpperCase()}`;
      const badgeW = Math.max(80, label.length * 7.5 + 16);
      const badgeY = y > 26 ? y - 24 : y + 4;
      const textY = badgeY + 16;

      return `
        <!-- Finding #${idx + 1} -->
        <rect x="${x}" y="${y}" width="${w}" height="${h}"
              fill="${color}" fill-opacity="0.12"
              stroke="${color}" stroke-width="3" stroke-dasharray="6 3"/>
        <rect x="${x}" y="${badgeY}" width="${badgeW}" height="22" rx="4"
              fill="${color}"/>
        <text x="${x + 8}" y="${textY}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#000000" letter-spacing="0.5">${label}</text>
      `;
    })
    .join("\n");

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${rectsSvg}
  </svg>`;

  const annotatedPng = await sharp(imageBuffer)
    .png()
    .composite([
      {
        input: Buffer.from(overlaySvg, "utf-8"),
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  const disposition = download ? "attachment" : "inline";

  return new Response(new Uint8Array(annotatedPng), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${disposition}; filename="audit-${id}-remediation-annotated.png"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
