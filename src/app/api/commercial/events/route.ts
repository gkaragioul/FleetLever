import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db/client";
import { rateLimitedResponse, takeRateLimit } from "@/lib/auth/rate-limit";
import { clientRateLimitKey } from "@/lib/security/client-ip.mjs";
import { readJsonBody } from "@/lib/security/request-body.mjs";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Anonymous analytics: small bodies only, a per-client budget, and bounded stored metadata.
const maximumBodyBytes = 4 * 1024;
const maximumMetadataBytes = 2 * 1024;
const eventsPerClientPerMinute = 60;

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : null;

function boundedMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const serialized = JSON.stringify(value);
  return Buffer.byteLength(serialized, "utf8") <= maximumMetadataBytes ? value : null;
}

export async function POST(request: NextRequest) {
  if (!originMatches(request)) return originErrorResponse();
  if (!(await takeRateLimit(`commercial-event:${clientRateLimitKey(request.headers)}`, eventsPerClientPerMinute, 60_000))) {
    return rateLimitedResponse(60);
  }

  const body = await readJsonBody(request, maximumBodyBytes);
  if (body.status === "too_large") return Response.json({ ok: false }, { status: 413 });
  const payload = body.status === "ok" && body.value && typeof body.value === "object" ? (body.value as Record<string, unknown>) : null;
  if (!payload) return Response.json({ ok: false }, { status: 400 });

  const event = clean(payload.event, 80);
  const path = clean(payload.path, 240);
  if (!event || !path) return Response.json({ ok: false }, { status: 400 });

  const record = {
    event,
    path,
    label: clean(payload.label, 120),
    referrer: clean(payload.referrer, 500),
    metadata: boundedMetadata(payload.metadata),
  };

  if (process.env.DATABASE_URL) {
    // The table is created by migration 0014_commercial_intake_tables, never at request time.
    await getDbPool()
      .query(
        `insert into public.commercial_events (event_name, path, label, referrer, metadata)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [record.event, record.path, record.label, record.referrer, JSON.stringify(record.metadata)],
      )
      .catch((error) => console.error("FleetLever commercial event was not stored", error instanceof Error ? error.message : error));
  } else {
    console.info("FleetLever commercial event", record);
  }

  return Response.json({ ok: true }, { status: 202 });
}
