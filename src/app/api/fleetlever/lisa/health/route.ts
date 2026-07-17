import { requireFleetLeverApiSession } from "@/lib/auth/access";
import { lisaBridgeHeaders, lisaBridgeUrl, lisaEnabled, noStoreJson } from "@/lib/lisa/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
  if (authError) return authError;
  if (!lisaEnabled()) return noStoreJson({ status: "disabled" });

  const headers = lisaBridgeHeaders();
  if (!headers) return noStoreJson({ status: "misconfigured" }, 503);

  try {
    const response = await fetch(lisaBridgeUrl("health"), {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(2500),
    });
    const body = await response.json().catch(() => ({ status: "unavailable" }));
    return noStoreJson(body, response.ok ? 200 : response.status);
  } catch {
    return noStoreJson({ status: "unavailable" }, 503);
  }
}
