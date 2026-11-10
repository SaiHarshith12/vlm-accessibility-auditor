import { db } from "@/db";
import { audits } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Streams the uploaded image bytes stored inline in the audits row. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [audit] = await db
    .select({ imageData: audits.imageData, mime: audits.mime })
    .from(audits)
    .where(eq(audits.id, id))
    .limit(1);
  if (!audit?.imageData) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = Buffer.from(audit.imageData, "base64");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": audit.mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
