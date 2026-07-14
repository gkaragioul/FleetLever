import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : null;

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return Response.json({ ok: false }, { status: 400 });

  const event = clean(payload.event, 80);
  const path = clean(payload.path, 240);
  if (!event || !path) return Response.json({ ok: false }, { status: 400 });

  const record = {
    event,
    path,
    label: clean(payload.label, 120),
    referrer: clean(payload.referrer, 500),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : null,
  };

  if (process.env.DATABASE_URL) {
    const pool = getDbPool();
    await pool.query(`
      create table if not exists public.commercial_events (
        id bigserial primary key,
        event_name text not null,
        path text not null,
        label text,
        referrer text,
        metadata jsonb,
        created_at timestamptz not null default now()
      )
    `);
    await pool.query(
      `insert into public.commercial_events (event_name, path, label, referrer, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [record.event, record.path, record.label, record.referrer, JSON.stringify(record.metadata)],
    );
  } else {
    console.info("FleetLever commercial event", record);
  }

  return Response.json({ ok: true }, { status: 202 });
}
