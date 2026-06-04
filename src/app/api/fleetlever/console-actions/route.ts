import { withTenant } from "@/lib/db/client";
import { getActiveTenantContext } from "@/lib/db/tenant-context";
import { requireSuperAdminApiSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const actionTypes = new Set([
  "console.notification",
  "console.release_decision",
  "console.owner_assigned",
  "console.action_completed",
  "console.service_updated",
  "console.service_job_added",
  "console.evidence_uploaded",
  "console.override_released",
]);

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback;
}

function cleanRecordId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function POST(request: Request) {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: "DATABASE_URL is required for production actions." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const action = cleanText(payload.action, "console.notification");
  if (!actionTypes.has(action)) {
    return Response.json({ ok: false, error: "Unsupported console action." }, { status: 400 });
  }

  const title = cleanText(payload.title, "FleetLever action");
  const detail = cleanText(payload.detail, "A FleetLever action was recorded.");
  const recordTable = cleanText(payload.recordTable, "console");
  const recordId = cleanRecordId(payload.recordId);
  const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
  let context;

  try {
    context = await getActiveTenantContext();
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "FleetLever production tenant is not configured.",
        detail: error instanceof Error ? error.message : "Unable to load tenant context.",
      },
      { status: 503 },
    );
  }

  await withTenant(context, async (client) => {
    await client.query(
      `
        insert into public.audit_logs (
          organization_id,
          actor_profile_id,
          action,
          record_table,
          record_id,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [context.organizationId, context.profileId, action, recordTable, recordId, JSON.stringify({ title, detail, ...metadata })],
    );

    await client.query(
      `
        insert into public.notifications (
          organization_id,
          profile_id,
          title,
          body,
          notification_type,
          record_table,
          record_id,
          delivery_channels
        )
        values ($1, $2, $3, $4, $5, $6, $7, '{in_app}')
      `,
      [context.organizationId, context.profileId, title, detail, action, recordTable, recordId],
    );
  });

  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
