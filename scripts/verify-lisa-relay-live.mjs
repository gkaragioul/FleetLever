import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import pg from "pg";

const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
if (!databaseUrl) {
  console.error("MIGRATION_DATABASE_URL or DATABASE_PUBLIC_URL is required.");
  process.exit(1);
}

const packageMetadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const expectedVersion = process.env.RELAY_EXPECTED_VERSION ?? packageMetadata.version;
const timeoutMs = Number(process.env.RELAY_LIVE_TIMEOUT_MS ?? 120_000);
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let jobId;

try {
  const connection = await pool.query(
    `select status, version, extract(epoch from now() - last_heartbeat_at)::int as age_seconds
     from app_private.lisa_relay_connections
     where companion_id = 'primary'`,
  );
  assert.equal(connection.rowCount, 1, "The primary Lisa companion has not connected.");
  assert.equal(connection.rows[0].version, expectedVersion, "The connected Lisa companion is not running the expected version.");
  assert.ok(Number(connection.rows[0].age_seconds) <= 10, "The Lisa companion heartbeat is stale.");

  const tenant = await pool.query(
    "select organization_id, profile_id from public.organization_members where status = 'active' order by created_at limit 1",
  );
  assert.equal(tenant.rowCount, 1, "An active tenant is required for the live relay verification.");

  const inserted = await pool.query(
    `insert into public.lisa_relay_jobs (organization_id, requested_by_profile_id, question, context, expires_at)
     values ($1, $2, $3, $4::jsonb, now() + interval '3 minutes')
     returning id`,
    [
      tenant.rows[0].organization_id,
      tenant.rows[0].profile_id,
      "What does FleetLever help an operations team decide? Answer in one short sentence.",
      JSON.stringify({ locale: "en", route: "/fleet-management", view: "tomorrow", summary: "Live relay verification." }),
    ],
  );
  jobId = inserted.rows[0].id;

  const deadline = Date.now() + timeoutMs;
  let status = "pending";
  while (Date.now() < deadline && !["completed", "failed", "cancelled"].includes(status)) {
    await wait(1_000);
    const job = await pool.query("select status from public.lisa_relay_jobs where id = $1", [jobId]);
    status = job.rows[0]?.status ?? "missing";
  }
  assert.equal(status, "completed", `Lisa relay job finished with status ${status}.`);

  const events = await pool.query(
    "select event_type, payload from public.lisa_relay_events where job_id = $1 order by sequence_id",
    [jobId],
  );
  const answer = events.rows
    .filter((event) => event.event_type === "message" && typeof event.payload?.text === "string")
    .map((event) => event.payload.text)
    .join("")
    .trim();
  assert.ok(answer.length >= 20, "Lisa completed the job without a usable answer.");
  assert.ok(events.rows.some((event) => event.event_type === "done"), "Lisa did not emit the terminal done event.");

  console.log(`Lisa live relay verified (${connection.rows[0].version}): ${answer.slice(0, 240)}`);
} finally {
  if (jobId) await pool.query("delete from public.lisa_relay_jobs where id = $1", [jobId]).catch(() => {});
  await pool.end();
}
