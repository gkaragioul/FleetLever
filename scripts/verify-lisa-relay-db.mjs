import assert from "node:assert/strict";

import pg from "pg";
import { databaseSsl } from "./lib/database-connection.mjs";

const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
if (!databaseUrl) {
  console.error("MIGRATION_DATABASE_URL or DATABASE_PUBLIC_URL is required.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl(databaseUrl),
});
const client = await pool.connect();

try {
  await client.query("begin");
  const tenant = await client.query(
    "select member.organization_id, member.profile_id from public.organization_members member order by member.created_at limit 1",
  );
  assert.equal(tenant.rowCount, 1, "A tenant is required for the relay verification.");

  const { organization_id: organizationId, profile_id: profileId } = tenant.rows[0];
  await client.query("select set_config('app.current_organization_id', $1, true)", [organizationId]);
  const inserted = await client.query(
    `insert into public.lisa_relay_jobs (organization_id, requested_by_profile_id, question, context)
     values ($1, $2, 'relay verification', '{}'::jsonb)
     returning id`,
    [organizationId, profileId],
  );
  const jobId = inserted.rows[0].id;

  await client.query("select set_config('app.current_organization_id', '', true)");
  const claimed = await client.query("select * from app_private.claim_lisa_relay_job('verification')");
  assert.equal(claimed.rows[0]?.id, jobId, "The companion function must claim the pending job across tenant RLS.");

  const accepted = await client.query(
    "select app_private.append_lisa_relay_event($1, 'done', '{\"status\":\"connected\"}'::jsonb, true) as accepted",
    [jobId],
  );
  assert.equal(accepted.rows[0]?.accepted, true, "The companion function must append a terminal event.");

  const status = await client.query("select * from app_private.lisa_relay_job_status($1)", [jobId]);
  assert.equal(status.rows[0]?.status, "completed");

  await client.query("select set_config('app.current_organization_id', $1, true)", [organizationId]);
  const scrubbed = await client.query("select question, context from public.lisa_relay_jobs where id = $1", [jobId]);
  assert.equal(scrubbed.rows[0]?.question, "[expired]");
  assert.deepEqual(scrubbed.rows[0]?.context, {});

  await client.query("rollback");
  console.log("Lisa relay database claim, event, scrub, and status flow verified.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}
