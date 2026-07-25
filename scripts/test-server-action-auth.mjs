import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const actionsPath = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "actions.ts");
const source = readFileSync(actionsPath, "utf8");

const guardCall = "requireMutationAccess()";
const superAdminGuardCall = "requireSuperAdminAccess()";

// Calls that read or write tenant-scoped data. An access check has to come before any of them.
const tenantCalls = ["runTenantMutation", "getFleetLeverData", "setActiveTenantContext"];

/**
 * Splits actions.ts into one segment per exported server action. Each segment runs from its
 * `export async function` line to the start of the next, which is enough to tell whether that
 * action checks access and whether it does so before touching tenant data.
 */
function readServerActions() {
  const starts = [...source.matchAll(/^export async function (\w+)\s*\(/gm)].map((match) => ({
    name: match[1],
    index: match.index,
  }));

  return starts.map((start, position) => ({
    name: start.name,
    body: source.slice(start.index, starts[position + 1]?.index ?? source.length),
  }));
}

test("actions.ts still exposes server actions to check", () => {
  assert.ok(readServerActions().length > 0, "expected exported server actions in src/app/actions.ts");
});

test("every exported server action performs an access check", () => {
  const unguarded = readServerActions()
    .filter((action) => !action.body.includes(guardCall) && !action.body.includes(superAdminGuardCall))
    .map((action) => action.name);

  assert.deepEqual(unguarded, [], `reachable without authentication: ${unguarded.join(", ")}`);
});

/** Position of the first access check in an action body, or -1 when it has none. */
function guardPosition(body) {
  const positions = [body.indexOf(guardCall), body.indexOf(superAdminGuardCall)].filter((at) => at !== -1);
  return positions.length ? Math.min(...positions) : -1;
}

test("the access check runs before any tenant data is touched", () => {
  const lateGuards = readServerActions()
    .filter((action) => guardPosition(action.body) !== -1)
    .filter((action) => {
      const guardAt = guardPosition(action.body);
      return tenantCalls.some((call) => {
        const callAt = action.body.indexOf(call);
        return callAt !== -1 && callAt < guardAt;
      });
    })
    .map((action) => action.name);

  assert.deepEqual(lateGuards, [], `tenant data touched before the access check: ${lateGuards.join(", ")}`);
});

test("switchWorkspace is restricted to super admins", () => {
  const action = readServerActions().find((entry) => entry.name === "switchWorkspace");

  assert.ok(action, "expected a switchWorkspace server action");
  assert.ok(
    action.body.includes(superAdminGuardCall),
    "switchWorkspace rewrites the active tenant cookies, so it must be super-admin only",
  );
});
