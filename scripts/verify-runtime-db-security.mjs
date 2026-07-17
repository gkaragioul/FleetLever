import process from "node:process";
import pg from "pg";
import { randomBytes } from "node:crypto";
import { databaseSsl } from "./lib/database-connection.mjs";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for runtime database security verification.");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: databaseSsl(process.env.DATABASE_URL),
});

async function expectDenied(sql, label) {
  const client = await pool.connect();
  try {
    await client.query(sql);
    throw new Error(`${label} was unexpectedly allowed for the runtime role.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("unexpectedly allowed")) throw error;
    if (error?.code !== "42501") throw new Error(`${label} failed for an unexpected reason: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    client.release();
  }
}

try {
  const role = await pool.query("select current_user as role");
  if (role.rows[0]?.role !== "fleetlever_app") throw new Error(`Expected runtime role fleetlever_app, received ${role.rows[0]?.role ?? "unknown"}.`);
  await expectDenied("select count(*) from public.auth_sessions", "Direct auth-session reads");
  await expectDenied("select count(*) from public.auth_tokens", "Direct auth-token reads");
  await expectDenied("select count(*) from public.oauth_identities", "Direct OAuth-identity reads");
  await expectDenied("select count(*) from app_private.account_credentials", "Direct credential reads");
  await expectDenied("select count(*) from app_private.rate_limit_buckets", "Direct rate-limit bucket reads");
  await expectDenied("update public.audit_logs set metadata = metadata where false", "Audit-log updates");
  await expectDenied("delete from public.audit_logs where false", "Audit-log deletes");

  const rateLimitKey = randomBytes(32).toString("hex");
  const first = await pool.query("select app_private.consume_rate_limit($1::char(64), 2, 60) as allowed", [rateLimitKey]);
  const second = await pool.query("select app_private.consume_rate_limit($1::char(64), 2, 60) as allowed", [rateLimitKey]);
  const third = await pool.query("select app_private.consume_rate_limit($1::char(64), 2, 60) as allowed", [rateLimitKey]);
  if (!first.rows[0]?.allowed || !second.rows[0]?.allowed || third.rows[0]?.allowed) {
    throw new Error("Shared database rate limiting did not enforce the configured request window.");
  }
  console.log("PASS restricted runtime database privileges");
} finally {
  await pool.end();
}
