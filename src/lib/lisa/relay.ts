import "server-only";

import { getDbPool, withTenant } from "@/lib/db/client";
import {
  relayConnectionStatus,
  relayRequestIsAuthorized,
  sanitizeRelayEvent,
  type RelayPublicEvent,
} from "@/lib/lisa/relay-core.mjs";

type TenantContext = { organizationId: string; profileId: string };
type RelayJob = { id: string; question: string; context: Record<string, unknown> };

const relayPollIntervalMs = 300;
const relayStreamTimeoutMs = 95_000;

export function lisaRelayEnabled() {
  return process.env.FLEETLEVER_LISA_RELAY_ENABLED === "true";
}

export function lisaRelayCompanionId() {
  return (process.env.FLEETLEVER_LISA_RELAY_COMPANION_ID ?? "primary").slice(0, 120);
}

export function lisaRelayIsConfigured() {
  const secret = process.env.FLEETLEVER_LISA_RELAY_SECRET ?? "";
  return lisaRelayEnabled() && secret.length >= 32;
}

export function relayRequestAuthorized(request: Request) {
  return relayRequestIsAuthorized(request.headers.get("authorization"), process.env.FLEETLEVER_LISA_RELAY_SECRET ?? "");
}

export async function recordLisaRelayHeartbeat(input: { companionId: string; status?: string; version?: string }) {
  await getDbPool().query("select app_private.lisa_relay_heartbeat($1, $2, $3)", [
    input.companionId.slice(0, 120),
    input.status === "busy" ? "busy" : "connected",
    (input.version ?? "unknown").slice(0, 80),
  ]);
}

export async function getLisaRelayConnectionStatus() {
  if (!lisaRelayIsConfigured()) return lisaRelayEnabled() ? "misconfigured" : "disabled";
  const result = await getDbPool().query<{ status: string; last_heartbeat_at: Date }>(
    "select * from app_private.lisa_relay_last_heartbeat($1)",
    [lisaRelayCompanionId()],
  );
  if (relayConnectionStatus(result.rows[0]?.last_heartbeat_at ?? null) !== "connected") return "unavailable";
  return result.rows[0]?.status === "busy" ? "busy" : "connected";
}

export async function claimLisaRelayJob(companionId: string): Promise<RelayJob | null> {
  const result = await getDbPool().query<RelayJob>("select * from app_private.claim_lisa_relay_job($1)", [companionId.slice(0, 120)]);
  return result.rows[0] ?? null;
}

export async function appendLisaRelayEvent(jobId: string, value: unknown) {
  const event = sanitizeRelayEvent(value);
  if (!event) return { accepted: false, cancelRequested: false };
  const result = await getDbPool().query<{ accepted: boolean }>(
    "select app_private.append_lisa_relay_event($1, $2, $3::jsonb, $4) as accepted",
    [jobId, event.event, JSON.stringify(event.data), event.terminal],
  );
  const status = await getLisaRelayJobStatus(jobId);
  return { accepted: result.rows[0]?.accepted === true, cancelRequested: status?.cancel_requested === true };
}

export async function getLisaRelayJobStatus(jobId: string) {
  const result = await getDbPool().query<{ status: string; cancel_requested: boolean }>(
    "select * from app_private.lisa_relay_job_status($1)",
    [jobId],
  );
  return result.rows[0] ?? null;
}

export async function enqueueLisaRelayJob(context: TenantContext, input: { question: string; context?: unknown }) {
  return withTenant(context, async (client) => {
    const result = await client.query<{ id: string }>(
      `
        insert into public.lisa_relay_jobs (organization_id, requested_by_profile_id, question, context)
        values ($1, $2, $3, $4::jsonb)
        returning id
      `,
      [
        context.organizationId,
        context.profileId,
        input.question,
        JSON.stringify(input.context && typeof input.context === "object" ? input.context : {}),
      ],
    );
    return result.rows[0].id;
  });
}

async function readLisaRelayEvents(context: TenantContext, jobId: string, afterSequence: number) {
  return withTenant(context, async (client) => {
    const result = await client.query<{ sequence_id: string; event_type: RelayPublicEvent["event"]; payload: RelayPublicEvent["data"] }>(
      `
        select sequence_id, event_type, payload
        from public.lisa_relay_events
        where organization_id = $1
          and job_id = $2
          and sequence_id > $3
        order by sequence_id
      `,
      [context.organizationId, jobId, afterSequence],
    );
    return result.rows;
  });
}

async function cancelLisaRelayJob(context: TenantContext, jobId: string) {
  await withTenant(context, async (client) => {
    await client.query(
      `
        update public.lisa_relay_jobs
        set cancel_requested = true,
            status = case when status = 'pending' then 'cancelled' else status end,
            completed_at = case when status = 'pending' then now() else completed_at end,
            question = '[expired]',
            context = '{}'::jsonb
        where organization_id = $1
          and id = $2
          and status in ('pending', 'processing')
      `,
      [context.organizationId, jobId],
    );
  }).catch(() => {});
}

function serverEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function streamLisaRelayJob(context: TenantContext, jobId: string, requestSignal: AbortSignal) {
  const encoder = new TextEncoder();
  let stopped = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const stop = () => {
        stopped = true;
        void cancelLisaRelayJob(context, jobId);
      };
      requestSignal.addEventListener("abort", stop, { once: true });
      controller.enqueue(encoder.encode(serverEvent("status", { status: "queued" })));

      let lastSequence = 0;
      const deadline = Date.now() + relayStreamTimeoutMs;
      try {
        while (!stopped && Date.now() < deadline) {
          const events = await readLisaRelayEvents(context, jobId, lastSequence);
          for (const event of events) {
            lastSequence = Number(event.sequence_id);
            controller.enqueue(encoder.encode(serverEvent(event.event_type, event.payload)));
            if (event.event_type === "done" || event.event_type === "error") {
              stopped = true;
              break;
            }
          }
          if (!stopped) await wait(relayPollIntervalMs);
        }

        if (!stopped) {
          await cancelLisaRelayJob(context, jobId);
          controller.enqueue(encoder.encode(serverEvent("error", { status: "timeout", detail: "Lisa took too long to answer." })));
        }
        controller.close();
      } catch {
        await cancelLisaRelayJob(context, jobId);
        if (!stopped) {
          controller.enqueue(encoder.encode(serverEvent("error", { status: "unavailable", detail: "The Lisa relay was interrupted." })));
          controller.close();
        }
      } finally {
        requestSignal.removeEventListener("abort", stop);
      }
    },
    cancel() {
      stopped = true;
      return cancelLisaRelayJob(context, jobId);
    },
  });
}
