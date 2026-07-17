import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mutationRoutes = [
  "src/app/api/fleetlever/console-state/route.ts",
  "src/app/api/fleetlever/uploads/route.ts",
  "src/app/api/fleetlever/console-actions/route.ts",
  "src/app/api/fleetlever/lisa/chat/route.ts",
  "src/app/api/commercial/demo-sessions/route.ts",
  "src/app/api/commercial/demo-sessions/[sessionId]/state/route.ts",
  "src/app/api/commercial/events/route.ts",
  "src/app/api/commercial/demo-request/route.ts",
  "src/app/api/auth/logout/route.ts",
];

for (const file of mutationRoutes) {
  const source = await readFile(file, "utf8");
  assert.match(source, /originMatches\(request\)/, `${file} must reject cross-origin mutations.`);
}

const coreMigration = await readFile("db/migrations/0001_fleetlever_core.sql", "utf8");
const snapshotMigration = await readFile("db/migrations/0003_console_snapshots.sql", "utf8");
const tenantClient = await readFile("src/lib/db/client.ts", "utf8");
const consoleState = await readFile("src/lib/db/console-state.ts", "utf8");
const fleetData = await readFile("src/lib/db/fleetlever-data.ts", "utf8");
const fieldPage = await readFile("src/app/field/[assetId]/page.tsx", "utf8");
const demoLogin = await readFile("src/app/api/auth/demo-login/route.ts", "utf8");
const accountSecurityMigration = await readFile("db/migrations/0008_security_hardening.sql", "utf8");
const runtimeFunctionGrants = await readFile("db/migrations/0009_runtime_account_function_grants.sql", "utf8");
const phaseTwoSecurityMigration = await readFile("db/migrations/0010_auth_security_phase2.sql", "utf8");
const accountServer = await readFile("src/lib/auth/account.ts", "utf8");
const rateLimitServer = await readFile("src/lib/auth/rate-limit.ts", "utf8");
const uploadRoute = await readFile("src/app/api/fleetlever/uploads/route.ts", "utf8");
const roleBootstrap = await readFile("scripts/create-db-app-role.mjs", "utf8");
const resetPasswordAction = await readFile("src/app/reset-password/actions.ts", "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");
const proxy = await readFile("src/proxy.ts", "utf8");

assert.match(coreMigration, /force row level security/i, "Core tenant tables must force RLS.");
assert.match(coreMigration, /organization_id = app_private\.current_organization_id\(\)/i, "Core RLS must compare organization context.");
assert.match(snapshotMigration, /force row level security/i, "Console snapshots must force RLS.");
assert.match(snapshotMigration, /console_snapshots_tenant_(select|insert|update|delete)/i, "Console snapshots need tenant policies.");
assert.match(tenantClient, /set_config\('app\.current_organization_id'/, "Database transactions must set organization context.");
assert.match(tenantClient, /organization_members[\s\S]*status = 'active'/, "Database transactions must verify active membership.");
assert.match(consoleState, /where organization_id = \$1/, "Snapshot reads and writes must be organization scoped.");
assert.match(consoleState, /console\.customization_updated/, "Customization changes must be audited.");
assert.match(consoleState, /role !== "owner" && role !== "admin"/, "Only organization administrators may change branding or custom schemas.");
assert.match(consoleState, /Only organization administrators may reset console state/, "Destructive tenant reset must be administrator-only.");
assert.match(
  fleetData,
  /requireActiveFleetLeverMutationSession/,
  "Every shared tenant mutation must enforce an active authenticated FleetLever session.",
);
assert.match(
  fieldPage,
  /requireActiveFleetLeverPageSession/,
  "Field mode must require an active authenticated FleetLever session.",
);
assert.match(
  fieldPage,
  /getFleetLeverData\(\{\s*organizationId:[\s\S]*profileId:/,
  "Field mode must load data with the authenticated tenant context explicitly.",
);
assert.match(
  demoLogin,
  /demoLoginAllowed/,
  "Demo login must be explicitly gated and unavailable in the commercial console by default.",
);
assert.match(accountSecurityMigration, /drop policy if exists audit_logs_tenant_update/i, "Audit logs must not be mutable.");
assert.match(accountSecurityMigration, /drop policy if exists audit_logs_tenant_delete/i, "Audit logs must not be deletable.");
assert.match(accountSecurityMigration, /create_auth_session/i, "Session writes must use a constrained database function.");
assert.match(accountSecurityMigration, /issue_auth_token/i, "Auth-token writes must use a constrained database function.");
assert.match(accountSecurityMigration, /revoke all on public\.auth_sessions/i, "The runtime role must not access session rows directly.");
assert.match(accountSecurityMigration, /revoke all on public\.auth_tokens/i, "The runtime role must not access auth-token rows directly.");
assert.match(runtimeFunctionGrants, /register_email_account\(citext, text, text, text\)/i, "The runtime role must be able to register accounts through the constrained function.");
assert.match(runtimeFunctionGrants, /account_session_by_hash\(char\)/i, "The runtime role must be able to resolve account sessions through the constrained function.");
assert.match(phaseTwoSecurityMigration, /create table if not exists app_private\.account_credentials/i, "Password hashes must live in a private credential table.");
assert.match(phaseTwoSecurityMigration, /update public\.profiles[\s\S]*password_hash = null/i, "Public profile rows must not retain password hashes.");
assert.match(phaseTwoSecurityMigration, /create table if not exists app_private\.rate_limit_buckets/i, "Rate limits must be shared across app instances.");
assert.match(phaseTwoSecurityMigration, /consume_rate_limit/i, "Rate-limit writes must use a constrained database function.");
assert.doesNotMatch(accountServer, /insert into public\.auth_sessions/i, "Application code must not insert session rows directly.");
assert.doesNotMatch(accountServer, /insert into public\.auth_tokens/i, "Application code must not insert auth-token rows directly.");
assert.doesNotMatch(accountServer, /60 \* 60 \* 24 \* 30/, "Account sessions must not remain valid for 30 days.");
assert.match(rateLimitServer, /consume_rate_limit/, "Authentication throttling must be database-backed.");
assert.match(uploadRoute, /validateUpload/, "Evidence uploads must validate extension, MIME type, and file signatures.");
assert.match(roleBootstrap, /revoke update, delete on public\.audit_logs/i, "Role bootstrap must preserve append-only audit logs.");
assert.match(roleBootstrap, /revoke all on public\.auth_sessions/i, "Role bootstrap must preserve private auth tables.");
assert.match(resetPasswordAction, /takeAuthRateLimit\(`reset:/, "Password-reset consumption must be rate limited.");
assert.match(nextConfig, /Strict-Transport-Security/, "Hosted responses must advertise HSTS.");
assert.match(nextConfig, /poweredByHeader:\s*false/, "Hosted responses must not disclose the Next.js implementation header.");
assert.match(nextConfig, /default-src 'self'/, "The CSP must define a restrictive default source.");
assert.match(nextConfig, /object-src 'none'/, "The CSP must block plugin content.");
assert.match(nextConfig, /base-uri 'self'/, "The CSP must restrict base URL injection.");
assert.match(nextConfig, /form-action 'self'/, "The CSP must restrict form submissions.");
assert.match(proxy, /fleetlever_account_session/, "The production proxy must recognize authenticated trial accounts.");
assert.match(proxy, /hasFleetLeverSessionCookie/, "Protected FleetLever APIs must accept either account or administrator sessions.");

console.log("PASS security and tenant-isolation contract");
