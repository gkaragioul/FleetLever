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

assert.match(coreMigration, /force row level security/i, "Core tenant tables must force RLS.");
assert.match(coreMigration, /organization_id = app_private\.current_organization_id\(\)/i, "Core RLS must compare organization context.");
assert.match(snapshotMigration, /force row level security/i, "Console snapshots must force RLS.");
assert.match(snapshotMigration, /console_snapshots_tenant_(select|insert|update|delete)/i, "Console snapshots need tenant policies.");
assert.match(tenantClient, /set_config\('app\.current_organization_id'/, "Database transactions must set organization context.");
assert.match(tenantClient, /organization_members[\s\S]*status = 'active'/, "Database transactions must verify active membership.");
assert.match(consoleState, /where organization_id = \$1/, "Snapshot reads and writes must be organization scoped.");
assert.match(consoleState, /console\.customization_updated/, "Customization changes must be audited.");

console.log("PASS security and tenant-isolation contract");
