import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db/client";
import { validateDemoRequest } from "@/lib/commercial/demo-request-validation";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!originMatches(request)) return originErrorResponse();
  const payload = await request.json().catch(() => null);
  const result = validateDemoRequest(payload);

  if (result.request.honeypot) return Response.json({ ok: true }, { status: 202 });
  if (!result.valid) return Response.json({ ok: false, errors: result.errors }, { status: 400 });

  const lead = result.request;
  if (process.env.DATABASE_URL) {
    const pool = getDbPool();
    await pool.query(`
      create table if not exists public.commercial_demo_requests (
        id bigserial primary key,
        name text not null,
        company text not null,
        work_email text not null,
        phone text,
        role text not null,
        fleet_size text not null,
        challenge text not null,
        source text,
        status text not null default 'new',
        created_at timestamptz not null default now()
      )
    `);
    await pool.query(
      `insert into public.commercial_demo_requests
       (name, company, work_email, phone, role, fleet_size, challenge, source)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [lead.name, lead.company, lead.email, lead.phone, lead.role, lead.fleetSize, lead.challenge, lead.source],
    );
  } else {
    console.info("FleetLever demo request", { ...lead, honeypot: undefined });
  }

  return Response.json({ ok: true }, { status: 201 });
}
