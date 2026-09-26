import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db/client";
import { validateDemoRequest } from "@/lib/commercial/demo-request-validation";
import { rateLimitedResponse, takeRateLimit } from "@/lib/auth/rate-limit";
import { clientRateLimitKey } from "@/lib/security/client-ip.mjs";
import { readJsonBody } from "@/lib/security/request-body.mjs";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A real demo request is a few hundred bytes; the validator truncates every field anyway.
const maximumBodyBytes = 16 * 1024;
const requestsPerClient = 5;
const requestWindowMs = 10 * 60_000;

export async function POST(request: NextRequest) {
  if (!originMatches(request)) return originErrorResponse();
  if (!(await takeRateLimit(`demo-request:${clientRateLimitKey(request.headers)}`, requestsPerClient, requestWindowMs))) {
    return rateLimitedResponse(Math.ceil(requestWindowMs / 1000));
  }

  const body = await readJsonBody(request, maximumBodyBytes);
  if (body.status === "too_large") return Response.json({ ok: false, errors: { form: "The request is too large." } }, { status: 413 });
  const result = validateDemoRequest(body.status === "ok" ? body.value : null);

  if (result.request.honeypot) return Response.json({ ok: true }, { status: 202 });
  if (!result.valid) return Response.json({ ok: false, errors: result.errors }, { status: 400 });

  const lead = result.request;
  if (process.env.DATABASE_URL) {
    // The table is created by migration 0014_commercial_intake_tables, never at request time.
    try {
      await getDbPool().query(
        `insert into public.commercial_demo_requests
         (name, company, work_email, phone, role, fleet_size, challenge, source)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [lead.name, lead.company, lead.email, lead.phone, lead.role, lead.fleetSize, lead.challenge, lead.source],
      );
    } catch (error) {
      console.error("FleetLever demo request was not stored", error instanceof Error ? error.message : error);
      return Response.json({ ok: false, errors: { form: "The request could not be saved. Email hello@fleetlever.com instead." } }, { status: 503 });
    }
  } else {
    console.info("FleetLever demo request", { ...lead, honeypot: undefined });
  }

  return Response.json({ ok: true }, { status: 201 });
}
