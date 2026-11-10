import { computeMetrics } from "@/lib/metrics";
import { ensureSeeded } from "@/lib/seed";
import { checkVlmOnline } from "@/lib/analysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await ensureSeeded();
  const [metrics, vlmOnline] = await Promise.all([
    computeMetrics(),
    checkVlmOnline(),
  ]);
  return Response.json({ ...metrics, vlmOnline });
}
